package auth

import (
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	ID    string `json:"sub"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type Service struct {
	jwtSecret string
}

func NewService(jwtSecret string) *Service {
	return &Service{
		jwtSecret: jwtSecret,
	}
}

func (s *Service) VerifyToken(tokenString string) (*User, error) {
	if s.jwtSecret == "" {
		return nil, errors.New("JWT secret not configured")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	user := &User{}
	
	if sub, ok := claims["sub"].(string); ok {
		user.ID = sub
	} else {
		return nil, errors.New("missing or invalid sub claim")
	}

	if email, ok := claims["email"].(string); ok {
		user.Email = email
	}

	if role, ok := claims["role"].(string); ok {
		user.Role = role
	}

	return user, nil
}

func (s *Service) GetUserFromContext(ctx interface{}) (*User, bool) {
	user, ok := ctx.(*User)
	return user, ok
} 