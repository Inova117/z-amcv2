package model

import (
	"fmt"
	"io"
	"strconv"
	"time"
)

// Time scalar implementation
func MarshalTime(t time.Time) string {
	return t.Format(time.RFC3339)
}

func UnmarshalTime(v interface{}) (time.Time, error) {
	switch v := v.(type) {
	case string:
		return time.Parse(time.RFC3339, v)
	case int64:
		return time.Unix(v, 0), nil
	case float64:
		return time.Unix(int64(v), 0), nil
	default:
		return time.Time{}, fmt.Errorf("cannot unmarshal %T into Time", v)
	}
}

// Custom types for database models
type User struct {
	ID        string    `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Name      *string   `json:"name" db:"name"`
	Avatar    *string   `json:"avatar" db:"avatar"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

type Project struct {
	ID          string        `json:"id" db:"id"`
	Name        string        `json:"name" db:"name"`
	Description *string       `json:"description" db:"description"`
	Status      ProjectStatus `json:"status" db:"status"`
	OwnerID     string        `json:"ownerId" db:"owner_id"`
	CreatedAt   time.Time     `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time     `json:"updatedAt" db:"updated_at"`
}

type Board struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description" db:"description"`
	ProjectID   string    `json:"projectId" db:"project_id"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time `json:"updatedAt" db:"updated_at"`
}

type Asset struct {
	ID         string      `json:"id" db:"id"`
	Name       string      `json:"name" db:"name"`
	Type       AssetType   `json:"type" db:"type"`
	URL        *string     `json:"url" db:"url"`
	Status     AssetStatus `json:"status" db:"status"`
	BoardID    string      `json:"boardId" db:"board_id"`
	ApprovedBy *string     `json:"approvedBy" db:"approved_by"`
	ApprovedAt *time.Time  `json:"approvedAt" db:"approved_at"`
	CreatedAt  time.Time   `json:"createdAt" db:"created_at"`
	UpdatedAt  time.Time   `json:"updatedAt" db:"updated_at"`
}

type ChatMessage struct {
	ID        string    `json:"id" db:"id"`
	Content   string    `json:"content" db:"content"`
	UserID    string    `json:"userId" db:"user_id"`
	BoardID   string    `json:"boardId" db:"board_id"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
} 