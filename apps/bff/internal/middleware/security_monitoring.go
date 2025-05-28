package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-redis/redis/v8"
)

type SecurityEvent struct {
	Type        string            `json:"type"`
	Severity    string            `json:"severity"`
	Timestamp   time.Time         `json:"timestamp"`
	ClientIP    string            `json:"client_ip"`
	UserAgent   string            `json:"user_agent"`
	UserID      string            `json:"user_id,omitempty"`
	Endpoint    string            `json:"endpoint"`
	Method      string            `json:"method"`
	Details     map[string]string `json:"details"`
	RiskScore   int               `json:"risk_score"`
}

type SecurityMonitor struct {
	redisClient *redis.Client
	alertThresholds map[string]int
}

func NewSecurityMonitor(redisClient *redis.Client) *SecurityMonitor {
	return &SecurityMonitor{
		redisClient: redisClient,
		alertThresholds: map[string]int{
			"failed_auth":        5,  // 5 failed attempts in 5 minutes
			"sql_injection":      1,  // Any SQL injection attempt
			"xss_attempt":        1,  // Any XSS attempt
			"rate_limit_hit":     10, // 10 rate limit hits in 5 minutes
			"suspicious_activity": 3,  // 3 suspicious activities in 10 minutes
		},
	}
}

// SecurityMonitoringMiddleware tracks security events
func (sm *SecurityMonitor) SecurityMonitoringMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			
			// Create a response writer wrapper to capture status code
			wrapper := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
			
			// Process request
			next.ServeHTTP(wrapper, r)
			
			// Log security events based on response
			sm.logSecurityEvent(r, wrapper, time.Since(start))
		})
	}
}

// LogFailedAuthentication logs failed authentication attempts
func (sm *SecurityMonitor) LogFailedAuthentication(r *http.Request, reason string) {
	event := SecurityEvent{
		Type:      "failed_auth",
		Severity:  "warning",
		Timestamp: time.Now(),
		ClientIP:  sm.getClientIP(r),
		UserAgent: r.UserAgent(),
		Endpoint:  r.URL.Path,
		Method:    r.Method,
		Details: map[string]string{
			"reason": reason,
		},
		RiskScore: 3,
	}
	
	sm.recordEvent(event)
	sm.checkAlertThresholds("failed_auth", event.ClientIP)
}

// LogSQLInjectionAttempt logs SQL injection attempts
func (sm *SecurityMonitor) LogSQLInjectionAttempt(r *http.Request, payload string) {
	event := SecurityEvent{
		Type:      "sql_injection",
		Severity:  "critical",
		Timestamp: time.Now(),
		ClientIP:  sm.getClientIP(r),
		UserAgent: r.UserAgent(),
		Endpoint:  r.URL.Path,
		Method:    r.Method,
		Details: map[string]string{
			"payload": payload,
		},
		RiskScore: 10,
	}
	
	sm.recordEvent(event)
	sm.triggerImmediateAlert(event)
}

// LogXSSAttempt logs XSS attempts
func (sm *SecurityMonitor) LogXSSAttempt(r *http.Request, payload string) {
	event := SecurityEvent{
		Type:      "xss_attempt",
		Severity:  "critical",
		Timestamp: time.Now(),
		ClientIP:  sm.getClientIP(r),
		UserAgent: r.UserAgent(),
		Endpoint:  r.URL.Path,
		Method:    r.Method,
		Details: map[string]string{
			"payload": payload,
		},
		RiskScore: 9,
	}
	
	sm.recordEvent(event)
	sm.triggerImmediateAlert(event)
}

// LogRateLimitHit logs rate limit violations
func (sm *SecurityMonitor) LogRateLimitHit(r *http.Request, limit string) {
	event := SecurityEvent{
		Type:      "rate_limit_hit",
		Severity:  "warning",
		Timestamp: time.Now(),
		ClientIP:  sm.getClientIP(r),
		UserAgent: r.UserAgent(),
		Endpoint:  r.URL.Path,
		Method:    r.Method,
		Details: map[string]string{
			"limit_type": limit,
		},
		RiskScore: 2,
	}
	
	sm.recordEvent(event)
	sm.checkAlertThresholds("rate_limit_hit", event.ClientIP)
}

// LogSuspiciousActivity logs suspicious activities
func (sm *SecurityMonitor) LogSuspiciousActivity(r *http.Request, activity string, details map[string]string) {
	event := SecurityEvent{
		Type:      "suspicious_activity",
		Severity:  "warning",
		Timestamp: time.Now(),
		ClientIP:  sm.getClientIP(r),
		UserAgent: r.UserAgent(),
		Endpoint:  r.URL.Path,
		Method:    r.Method,
		Details:   details,
		RiskScore: 5,
	}
	
	if event.Details == nil {
		event.Details = make(map[string]string)
	}
	event.Details["activity"] = activity
	
	sm.recordEvent(event)
	sm.checkAlertThresholds("suspicious_activity", event.ClientIP)
}

// LogTokenRevocation logs token revocation events
func (sm *SecurityMonitor) LogTokenRevocation(userID, reason string, r *http.Request) {
	event := SecurityEvent{
		Type:      "token_revocation",
		Severity:  "info",
		Timestamp: time.Now(),
		ClientIP:  sm.getClientIP(r),
		UserAgent: r.UserAgent(),
		UserID:    userID,
		Endpoint:  r.URL.Path,
		Method:    r.Method,
		Details: map[string]string{
			"reason": reason,
		},
		RiskScore: 1,
	}
	
	sm.recordEvent(event)
}

// recordEvent stores the security event
func (sm *SecurityMonitor) recordEvent(event SecurityEvent) {
	if sm.redisClient == nil {
		// Fallback to standard logging
		eventJSON, _ := json.Marshal(event)
		log.Printf("SECURITY_EVENT: %s", string(eventJSON))
		return
	}
	
	ctx := context.Background()
	
	// Store individual event
	eventKey := fmt.Sprintf("security_event:%d:%s", event.Timestamp.Unix(), event.Type)
	eventJSON, err := json.Marshal(event)
	if err != nil {
		log.Printf("Failed to marshal security event: %v", err)
		return
	}
	
	// Store with 24 hour TTL
	err = sm.redisClient.Set(ctx, eventKey, eventJSON, 24*time.Hour).Err()
	if err != nil {
		log.Printf("Failed to store security event: %v", err)
	}
	
	// Update counters for alerting
	counterKey := fmt.Sprintf("security_counter:%s:%s", event.Type, event.ClientIP)
	sm.redisClient.Incr(ctx, counterKey)
	sm.redisClient.Expire(ctx, counterKey, 10*time.Minute)
	
	// Store in time-series for analysis
	timeSeriesKey := fmt.Sprintf("security_timeseries:%s", event.Type)
	sm.redisClient.ZAdd(ctx, timeSeriesKey, &redis.Z{
		Score:  float64(event.Timestamp.Unix()),
		Member: eventJSON,
	})
	sm.redisClient.Expire(ctx, timeSeriesKey, 7*24*time.Hour) // Keep for 7 days
}

// checkAlertThresholds checks if alert thresholds are exceeded
func (sm *SecurityMonitor) checkAlertThresholds(eventType, clientIP string) {
	if sm.redisClient == nil {
		return
	}
	
	threshold, exists := sm.alertThresholds[eventType]
	if !exists {
		return
	}
	
	ctx := context.Background()
	counterKey := fmt.Sprintf("security_counter:%s:%s", eventType, clientIP)
	
	count, err := sm.redisClient.Get(ctx, counterKey).Int()
	if err != nil {
		return
	}
	
	if count >= threshold {
		sm.triggerAlert(eventType, clientIP, count, threshold)
	}
}

// triggerAlert sends an alert for threshold violations
func (sm *SecurityMonitor) triggerAlert(eventType, clientIP string, count, threshold int) {
	alert := map[string]interface{}{
		"type":        "security_threshold_exceeded",
		"event_type":  eventType,
		"client_ip":   clientIP,
		"count":       count,
		"threshold":   threshold,
		"timestamp":   time.Now(),
		"severity":    "high",
	}
	
	alertJSON, _ := json.Marshal(alert)
	log.Printf("SECURITY_ALERT: %s", string(alertJSON))
	
	// Store alert
	if sm.redisClient != nil {
		ctx := context.Background()
		alertKey := fmt.Sprintf("security_alert:%d", time.Now().Unix())
		sm.redisClient.Set(ctx, alertKey, alertJSON, 24*time.Hour)
		
		// Publish to alert channel
		sm.redisClient.Publish(ctx, "security_alerts", alertJSON)
	}
}

// triggerImmediateAlert sends immediate alerts for critical events
func (sm *SecurityMonitor) triggerImmediateAlert(event SecurityEvent) {
	alert := map[string]interface{}{
		"type":      "immediate_security_alert",
		"event":     event,
		"timestamp": time.Now(),
		"severity":  "critical",
	}
	
	alertJSON, _ := json.Marshal(alert)
	log.Printf("CRITICAL_SECURITY_ALERT: %s", string(alertJSON))
	
	// Store alert and publish immediately
	if sm.redisClient != nil {
		ctx := context.Background()
		alertKey := fmt.Sprintf("critical_alert:%d", time.Now().Unix())
		sm.redisClient.Set(ctx, alertKey, alertJSON, 24*time.Hour)
		
		// Publish to critical alert channel
		sm.redisClient.Publish(ctx, "critical_security_alerts", alertJSON)
	}
}

// logSecurityEvent logs general security events based on request/response
func (sm *SecurityMonitor) logSecurityEvent(r *http.Request, w *responseWriter, duration time.Duration) {
	// Log slow requests as potential DoS attempts
	if duration > 10*time.Second {
		sm.LogSuspiciousActivity(r, "slow_request", map[string]string{
			"duration": duration.String(),
		})
	}
	
	// Log 4xx errors as potential probing attempts
	if w.statusCode >= 400 && w.statusCode < 500 {
		sm.LogSuspiciousActivity(r, "client_error", map[string]string{
			"status_code": fmt.Sprintf("%d", w.statusCode),
		})
	}
	
	// Log suspicious user agents
	userAgent := strings.ToLower(r.UserAgent())
	suspiciousAgents := []string{"sqlmap", "nmap", "nikto", "burp", "owasp", "scanner"}
	for _, agent := range suspiciousAgents {
		if strings.Contains(userAgent, agent) {
			sm.LogSuspiciousActivity(r, "suspicious_user_agent", map[string]string{
				"user_agent": r.UserAgent(),
			})
			break
		}
	}
}

// getClientIP extracts the real client IP
func (sm *SecurityMonitor) getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP in the chain
		if idx := strings.Index(xff, ","); idx > 0 {
			return strings.TrimSpace(xff[:idx])
		}
		return strings.TrimSpace(xff)
	}
	
	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	
	// Fall back to RemoteAddr
	if idx := strings.LastIndex(r.RemoteAddr, ":"); idx > 0 {
		return r.RemoteAddr[:idx]
	}
	return r.RemoteAddr
}

// GetSecurityMetrics returns security metrics for monitoring
func (sm *SecurityMonitor) GetSecurityMetrics() map[string]interface{} {
	if sm.redisClient == nil {
		return map[string]interface{}{"error": "Redis not available"}
	}
	
	ctx := context.Background()
	metrics := make(map[string]interface{})
	
	// Get event counts by type
	for eventType := range sm.alertThresholds {
		pattern := fmt.Sprintf("security_counter:%s:*", eventType)
		keys, err := sm.redisClient.Keys(ctx, pattern).Result()
		if err == nil {
			metrics[fmt.Sprintf("%s_count", eventType)] = len(keys)
		}
	}
	
	// Get recent alerts
	alertKeys, err := sm.redisClient.Keys(ctx, "security_alert:*").Result()
	if err == nil {
		metrics["recent_alerts"] = len(alertKeys)
	}
	
	return metrics
}

// responseWriter wrapper to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
} 