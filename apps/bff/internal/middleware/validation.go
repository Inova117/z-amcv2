package middleware

import (
	"context"
	"fmt"
	"html"
	"net/http"
	"regexp"
	"strings"

	"github.com/microcosm-cc/bluemonday"
)

type InputValidator struct {
	policy *bluemonday.Policy
}

type ValidationRule struct {
	Field    string
	Required bool
	MinLen   int
	MaxLen   int
	Pattern  *regexp.Regexp
	Sanitize bool
}

func NewInputValidator() *InputValidator {
	// Create a strict policy for HTML sanitization
	policy := bluemonday.StrictPolicy()
	
	return &InputValidator{
		policy: policy,
	}
}

// ValidateAndSanitizeInput validates and sanitizes user input
func (iv *InputValidator) ValidateAndSanitizeInput(input string, rules ValidationRule) (string, error) {
	// Check if required field is empty
	if rules.Required && strings.TrimSpace(input) == "" {
		return "", fmt.Errorf("field %s is required", rules.Field)
	}

	// Check minimum length
	if len(input) < rules.MinLen {
		return "", fmt.Errorf("field %s must be at least %d characters", rules.Field, rules.MinLen)
	}

	// Check maximum length
	if rules.MaxLen > 0 && len(input) > rules.MaxLen {
		return "", fmt.Errorf("field %s must not exceed %d characters", rules.Field, rules.MaxLen)
	}

	// Validate pattern if provided
	if rules.Pattern != nil && !rules.Pattern.MatchString(input) {
		return "", fmt.Errorf("field %s has invalid format", rules.Field)
	}

	// Sanitize input if requested
	if rules.Sanitize {
		input = iv.SanitizeHTML(input)
	}

	return input, nil
}

// SanitizeHTML removes potentially dangerous HTML content
func (iv *InputValidator) SanitizeHTML(input string) string {
	return iv.policy.Sanitize(input)
}

// SanitizeString performs basic string sanitization
func (iv *InputValidator) SanitizeString(input string) string {
	// HTML escape
	input = html.EscapeString(input)
	
	// Remove null bytes
	input = strings.ReplaceAll(input, "\x00", "")
	
	// Remove control characters except newlines and tabs
	var result strings.Builder
	for _, r := range input {
		if r >= 32 || r == '\n' || r == '\t' || r == '\r' {
			result.WriteRune(r)
		}
	}
	
	return result.String()
}

// ValidateEmail validates email format
func (iv *InputValidator) ValidateEmail(email string) error {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(email) {
		return fmt.Errorf("invalid email format")
	}
	return nil
}

// ValidatePassword validates password strength
func (iv *InputValidator) ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}
	
	// Check for at least one uppercase letter
	if matched, _ := regexp.MatchString(`[A-Z]`, password); !matched {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	
	// Check for at least one lowercase letter
	if matched, _ := regexp.MatchString(`[a-z]`, password); !matched {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}
	
	// Check for at least one digit
	if matched, _ := regexp.MatchString(`[0-9]`, password); !matched {
		return fmt.Errorf("password must contain at least one digit")
	}
	
	// Check for at least one special character
	if matched, _ := regexp.MatchString(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`, password); !matched {
		return fmt.Errorf("password must contain at least one special character")
	}
	
	return nil
}

// ValidateUUID validates UUID format
func (iv *InputValidator) ValidateUUID(uuid string) error {
	uuidRegex := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	if !uuidRegex.MatchString(uuid) {
		return fmt.Errorf("invalid UUID format")
	}
	return nil
}

// DetectSQLInjection detects potential SQL injection attempts
func (iv *InputValidator) DetectSQLInjection(input string) bool {
	// Common SQL injection patterns
	sqlPatterns := []string{
		`(?i)(union\s+select)`,
		`(?i)(select\s+.*\s+from)`,
		`(?i)(insert\s+into)`,
		`(?i)(delete\s+from)`,
		`(?i)(update\s+.*\s+set)`,
		`(?i)(drop\s+table)`,
		`(?i)(create\s+table)`,
		`(?i)(alter\s+table)`,
		`(?i)(\'\s*or\s*\'\s*=\s*\')`,
		`(?i)(\'\s*or\s*1\s*=\s*1)`,
		`(?i)(--\s*$)`,
		`(?i)(/\*.*\*/)`,
		`(?i)(xp_cmdshell)`,
		`(?i)(sp_executesql)`,
	}
	
	for _, pattern := range sqlPatterns {
		if matched, _ := regexp.MatchString(pattern, input); matched {
			return true
		}
	}
	
	return false
}

// DetectXSS detects potential XSS attempts
func (iv *InputValidator) DetectXSS(input string) bool {
	// Common XSS patterns
	xssPatterns := []string{
		`(?i)<script[^>]*>.*?</script>`,
		`(?i)<iframe[^>]*>.*?</iframe>`,
		`(?i)<object[^>]*>.*?</object>`,
		`(?i)<embed[^>]*>`,
		`(?i)<link[^>]*>`,
		`(?i)<meta[^>]*>`,
		`(?i)javascript:`,
		`(?i)vbscript:`,
		`(?i)onload\s*=`,
		`(?i)onerror\s*=`,
		`(?i)onclick\s*=`,
		`(?i)onmouseover\s*=`,
		`(?i)onfocus\s*=`,
		`(?i)onblur\s*=`,
		`(?i)onchange\s*=`,
		`(?i)onsubmit\s*=`,
		`(?i)expression\s*\(`,
		`(?i)@import`,
		`(?i)behavior\s*:`,
	}
	
	for _, pattern := range xssPatterns {
		if matched, _ := regexp.MatchString(pattern, input); matched {
			return true
		}
	}
	
	return false
}

// SecurityValidationMiddleware validates all incoming requests for security threats
func (iv *InputValidator) SecurityValidationMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get security monitor from context if available
			var securityMonitor *SecurityMonitor
			if sm := r.Context().Value("security_monitor"); sm != nil {
				if monitor, ok := sm.(*SecurityMonitor); ok {
					securityMonitor = monitor
				}
			}

			// Parse form data if present
			if err := r.ParseForm(); err != nil {
				http.Error(w, "Invalid form data", http.StatusBadRequest)
				return
			}
			
			// Validate all form values
			for key, values := range r.Form {
				for _, value := range values {
					// Check for SQL injection
					if iv.DetectSQLInjection(value) {
						if securityMonitor != nil {
							securityMonitor.LogSQLInjectionAttempt(r, value)
						}
						http.Error(w, "Potential SQL injection detected", http.StatusBadRequest)
						return
					}
					
					// Check for XSS
					if iv.DetectXSS(value) {
						if securityMonitor != nil {
							securityMonitor.LogXSSAttempt(r, value)
						}
						http.Error(w, "Potential XSS attack detected", http.StatusBadRequest)
						return
					}
					
					// Sanitize the value
					sanitized := iv.SanitizeString(value)
					r.Form[key] = []string{sanitized}
				}
			}
			
			// Add validation context
			ctx := context.WithValue(r.Context(), "validator", iv)
			r = r.WithContext(ctx)
			
			next.ServeHTTP(w, r)
		})
	}
}

// SecurityValidationMiddlewareWithMonitor creates validation middleware with security monitoring
func (iv *InputValidator) SecurityValidationMiddlewareWithMonitor(securityMonitor *SecurityMonitor) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Add security monitor to context
			ctx := context.WithValue(r.Context(), "security_monitor", securityMonitor)
			r = r.WithContext(ctx)
			
			// Parse form data if present
			if err := r.ParseForm(); err != nil {
				http.Error(w, "Invalid form data", http.StatusBadRequest)
				return
			}
			
			// Validate all form values
			for key, values := range r.Form {
				for _, value := range values {
					// Check for SQL injection
					if iv.DetectSQLInjection(value) {
						securityMonitor.LogSQLInjectionAttempt(r, value)
						http.Error(w, "Potential SQL injection detected", http.StatusBadRequest)
						return
					}
					
					// Check for XSS
					if iv.DetectXSS(value) {
						securityMonitor.LogXSSAttempt(r, value)
						http.Error(w, "Potential XSS attack detected", http.StatusBadRequest)
						return
					}
					
					// Sanitize the value
					sanitized := iv.SanitizeString(value)
					r.Form[key] = []string{sanitized}
				}
			}
			
			// Add validation context
			ctx = context.WithValue(ctx, "validator", iv)
			r = r.WithContext(ctx)
			
			next.ServeHTTP(w, r)
		})
	}
}

// GetValidatorFromContext retrieves the validator from request context
func GetValidatorFromContext(ctx context.Context) *InputValidator {
	if validator, ok := ctx.Value("validator").(*InputValidator); ok {
		return validator
	}
	return NewInputValidator()
} 