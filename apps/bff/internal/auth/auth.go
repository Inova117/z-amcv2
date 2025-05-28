package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/go-redis/redis/v8"
)

type User struct {
	ID    string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Type   string `json:"type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

type Service struct {
	jwtSecret     []byte
	refreshSecret []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
	redisClient   *redis.Client
}

func NewService(jwtSecret string) *Service {
	// Generate a separate refresh secret if not provided
	refreshSecret := jwtSecret + "_refresh"
	
	return &Service{
		jwtSecret:     []byte(jwtSecret),
		refreshSecret: []byte(refreshSecret),
		accessTTL:     15 * time.Minute,  // Short-lived access tokens
		refreshTTL:    7 * 24 * time.Hour, // 7 days for refresh tokens
	}
}

func NewServiceWithRedis(jwtSecret string, redisClient *redis.Client) *Service {
	service := NewService(jwtSecret)
	service.redisClient = redisClient
	return service
}

// GenerateTokenPair creates a new access and refresh token pair
func (s *Service) GenerateTokenPair(userID, email, role string) (*TokenPair, error) {
	if len(s.jwtSecret) < 32 {
		return nil, errors.New("JWT secret must be at least 32 bytes for security")
	}

	// Generate access token
	accessToken, err := s.generateAccessToken(userID, email, role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate refresh token
	refreshToken, err := s.generateRefreshToken(userID, email, role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(s.accessTTL.Seconds()),
		TokenType:    "Bearer",
	}, nil
}

// generateAccessToken creates a short-lived access token
func (s *Service) generateAccessToken(userID, email, role string) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		Type:   "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "zamc-bff",
			Audience:  []string{"zamc-web"},
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

// generateRefreshToken creates a long-lived refresh token
func (s *Service) generateRefreshToken(userID, email, role string) (string, error) {
	now := time.Now()
	
	// Generate a unique JTI for the refresh token
	jti, err := s.generateJTI()
	if err != nil {
		return "", fmt.Errorf("failed to generate JTI: %w", err)
	}

	claims := &Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		Type:   "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.refreshTTL)),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "zamc-bff",
			Audience:  []string{"zamc-web"},
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.refreshSecret)
	if err != nil {
		return "", err
	}

	// Store refresh token in Redis if available
	if s.redisClient != nil {
		ctx := context.Background()
		key := fmt.Sprintf("refresh_token:%s:%s", userID, jti)
		err = s.redisClient.Set(ctx, key, "valid", s.refreshTTL).Err()
		if err != nil {
			// Log error but don't fail - token blacklisting is optional
			fmt.Printf("Warning: Failed to store refresh token in Redis: %v\n", err)
		}
	}

	return tokenString, nil
}

// VerifyToken validates and parses a JWT token
func (s *Service) VerifyToken(tokenString string) (*User, error) {
	if len(s.jwtSecret) == 0 {
		return nil, errors.New("JWT secret not configured")
	}

	// Check if token is blacklisted
	if s.isTokenBlacklisted(tokenString) {
		return nil, errors.New("token has been revoked")
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Ensure this is an access token
	if claims.Type != "access" {
		return nil, errors.New("invalid token type")
	}

	user := &User{
		ID:    claims.UserID,
		Email: claims.Email,
		Role:  claims.Role,
	}

	return user, nil
}

// RefreshTokens validates a refresh token and generates a new token pair
func (s *Service) RefreshTokens(refreshTokenString string) (*TokenPair, error) {
	if len(s.refreshSecret) == 0 {
		return nil, errors.New("refresh secret not configured")
	}

	// Parse refresh token
	token, err := jwt.ParseWithClaims(refreshTokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.refreshSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse refresh token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid refresh token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, errors.New("invalid refresh token claims")
	}

	// Ensure this is a refresh token
	if claims.Type != "refresh" {
		return nil, errors.New("invalid token type")
	}

	// Check if refresh token is still valid in Redis
	if s.redisClient != nil && claims.ID != "" {
		ctx := context.Background()
		key := fmt.Sprintf("refresh_token:%s:%s", claims.UserID, claims.ID)
		result := s.redisClient.Get(ctx, key)
		if result.Err() == redis.Nil {
			return nil, errors.New("refresh token has been revoked")
		}
	}

	// Invalidate the old refresh token
	if s.redisClient != nil && claims.ID != "" {
		ctx := context.Background()
		key := fmt.Sprintf("refresh_token:%s:%s", claims.UserID, claims.ID)
		s.redisClient.Del(ctx, key)
	}

	// Generate new token pair
	return s.GenerateTokenPair(claims.UserID, claims.Email, claims.Role)
}

// RevokeToken adds a token to the blacklist
func (s *Service) RevokeToken(tokenString string) error {
	if s.redisClient == nil {
		return errors.New("token revocation requires Redis")
	}

	// Parse token to get expiration
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})

	if err != nil {
		// Even if parsing fails, we should blacklist the token
		return s.blacklistToken(tokenString, time.Hour)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return s.blacklistToken(tokenString, time.Hour)
	}

	// Calculate remaining TTL
	ttl := time.Until(claims.ExpiresAt.Time)
	if ttl <= 0 {
		return nil // Token already expired
	}

	return s.blacklistToken(tokenString, ttl)
}

// RevokeAllUserTokens revokes all tokens for a specific user
func (s *Service) RevokeAllUserTokens(userID string) error {
	if s.redisClient == nil {
		return errors.New("token revocation requires Redis")
	}

	ctx := context.Background()
	
	// Remove all refresh tokens for the user
	pattern := fmt.Sprintf("refresh_token:%s:*", userID)
	keys, err := s.redisClient.Keys(ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to find user tokens: %w", err)
	}

	if len(keys) > 0 {
		err = s.redisClient.Del(ctx, keys...).Err()
		if err != nil {
			return fmt.Errorf("failed to revoke user tokens: %w", err)
		}
	}

	return nil
}

// blacklistToken adds a token to the blacklist with TTL
func (s *Service) blacklistToken(tokenString string, ttl time.Duration) error {
	ctx := context.Background()
	key := fmt.Sprintf("blacklist:%s", tokenString)
	return s.redisClient.Set(ctx, key, "revoked", ttl).Err()
}

// isTokenBlacklisted checks if a token is in the blacklist
func (s *Service) isTokenBlacklisted(tokenString string) bool {
	if s.redisClient == nil {
		return false
	}

	ctx := context.Background()
	key := fmt.Sprintf("blacklist:%s", tokenString)
	result := s.redisClient.Get(ctx, key)
	return result.Err() != redis.Nil
}

// generateJTI generates a unique JWT ID
func (s *Service) generateJTI() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// GetUserFromContext extracts user from context
func (s *Service) GetUserFromContext(ctx interface{}) (*User, bool) {
	user, ok := ctx.(*User)
	return user, ok
}

// ValidateTokenStrength ensures JWT secret meets security requirements
func (s *Service) ValidateTokenStrength() error {
	if len(s.jwtSecret) < 32 {
		return errors.New("JWT secret must be at least 32 bytes (256 bits) for security")
	}
	if len(s.refreshSecret) < 32 {
		return errors.New("refresh secret must be at least 32 bytes (256 bits) for security")
	}
	return nil
} 