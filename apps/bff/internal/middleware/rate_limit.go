package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/go-redis/redis_rate/v10"
)

type RateLimiter struct {
	limiter *redis_rate.Limiter
}

type RateLimitConfig struct {
	RequestsPerMinute int
	BurstSize         int
	WindowSize        time.Duration
}

func NewRateLimiter(redisClient *redis.Client) *RateLimiter {
	return &RateLimiter{
		limiter: redis_rate.NewLimiter(redisClient),
	}
}

// RateLimitMiddleware creates a rate limiting middleware
func (rl *RateLimiter) RateLimitMiddleware(config RateLimitConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			
			// Get client identifier (IP + User ID if available)
			key := rl.getClientKey(r)
			
			// Apply rate limit
			limit := redis_rate.PerMinute(config.RequestsPerMinute)
			res, err := rl.limiter.Allow(ctx, key, limit)
			if err != nil {
				http.Error(w, "Rate limiting error", http.StatusInternalServerError)
				return
			}

			// Set rate limit headers
			w.Header().Set("X-RateLimit-Limit", strconv.Itoa(config.RequestsPerMinute))
			w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(res.Remaining))
			w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(res.ResetAfter.Unix(), 10))

			// Check if rate limit exceeded
			if res.Allowed == 0 {
				w.Header().Set("Retry-After", strconv.FormatInt(int64(res.RetryAfter.Seconds()), 10))
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// AuthRateLimitMiddleware applies stricter rate limiting for authentication endpoints
func (rl *RateLimiter) AuthRateLimitMiddleware() func(http.Handler) http.Handler {
	config := RateLimitConfig{
		RequestsPerMinute: 5,  // Very strict for auth
		BurstSize:         3,
		WindowSize:        time.Minute,
	}
	return rl.RateLimitMiddleware(config)
}

// APIRateLimitMiddleware applies standard rate limiting for API endpoints
func (rl *RateLimiter) APIRateLimitMiddleware() func(http.Handler) http.Handler {
	config := RateLimitConfig{
		RequestsPerMinute: 100,
		BurstSize:         20,
		WindowSize:        time.Minute,
	}
	return rl.RateLimitMiddleware(config)
}

// GraphQLRateLimitMiddleware applies rate limiting for GraphQL queries
func (rl *RateLimiter) GraphQLRateLimitMiddleware() func(http.Handler) http.Handler {
	config := RateLimitConfig{
		RequestsPerMinute: 60,
		BurstSize:         10,
		WindowSize:        time.Minute,
	}
	return rl.RateLimitMiddleware(config)
}

// getClientKey generates a unique key for rate limiting based on IP and user
func (rl *RateLimiter) getClientKey(r *http.Request) string {
	// Get client IP
	ip := rl.getClientIP(r)
	
	// Try to get user ID from context
	if user := r.Context().Value("user"); user != nil {
		if userID, ok := user.(string); ok {
			return fmt.Sprintf("rate_limit:user:%s", userID)
		}
	}
	
	// Fall back to IP-based rate limiting
	return fmt.Sprintf("rate_limit:ip:%s", ip)
}

// getClientIP extracts the real client IP from request headers
func (rl *RateLimiter) getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header (from load balancer/proxy)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP in the chain
		if idx := len(xff); idx > 0 {
			if commaIdx := 0; commaIdx < idx {
				for i, char := range xff {
					if char == ',' {
						commaIdx = i
						break
					}
				}
				if commaIdx > 0 {
					return xff[:commaIdx]
				}
			}
			return xff
		}
	}
	
	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	
	// Fall back to RemoteAddr
	return r.RemoteAddr
}

// IsRateLimited checks if a client is currently rate limited
func (rl *RateLimiter) IsRateLimited(ctx context.Context, key string, requestsPerMinute int) (bool, error) {
	limit := redis_rate.PerMinute(requestsPerMinute)
	res, err := rl.limiter.Allow(ctx, key, limit)
	if err != nil {
		return false, err
	}
	return res.Allowed == 0, nil
} 