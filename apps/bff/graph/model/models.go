package model

import (
	"fmt"
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

// Database models with DB suffix to avoid conflicts with GraphQL generated models
type UserDB struct {
	ID        string    `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Name      *string   `json:"name" db:"name"`
	Avatar    *string   `json:"avatar" db:"avatar"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

type ProjectDB struct {
	ID          string        `json:"id" db:"id"`
	Name        string        `json:"name" db:"name"`
	Description *string       `json:"description" db:"description"`
	Status      ProjectStatus `json:"status" db:"status"`
	OwnerID     string        `json:"ownerId" db:"owner_id"`
	CreatedAt   time.Time     `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time     `json:"updatedAt" db:"updated_at"`
}

type BoardDB struct {
	ID          string    `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description" db:"description"`
	ProjectID   string    `json:"projectId" db:"project_id"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time `json:"updatedAt" db:"updated_at"`
}

type AssetDB struct {
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

type ChatMessageDB struct {
	ID        string    `json:"id" db:"id"`
	Content   string    `json:"content" db:"content"`
	UserID    string    `json:"userId" db:"user_id"`
	BoardID   string    `json:"boardId" db:"board_id"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

// Conversion functions from DB models to GraphQL models
func (u *UserDB) ToGraphQL() *User {
	return &User{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		Avatar:    u.Avatar,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

func (p *ProjectDB) ToGraphQL() *Project {
	return &Project{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		Status:      p.Status,
		OwnerID:     p.OwnerID,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

func (b *BoardDB) ToGraphQL() *Board {
	return &Board{
		ID:          b.ID,
		Name:        b.Name,
		Description: b.Description,
		ProjectID:   b.ProjectID,
		CreatedAt:   b.CreatedAt,
		UpdatedAt:   b.UpdatedAt,
	}
}

func (a *AssetDB) ToGraphQL() *Asset {
	return &Asset{
		ID:         a.ID,
		Name:       a.Name,
		Type:       a.Type,
		URL:        a.URL,
		Status:     a.Status,
		BoardID:    a.BoardID,
		ApprovedAt: a.ApprovedAt,
		CreatedAt:  a.CreatedAt,
		UpdatedAt:  a.UpdatedAt,
	}
}

func (c *ChatMessageDB) ToGraphQL() *ChatMessage {
	return &ChatMessage{
		ID:        c.ID,
		Content:   c.Content,
		UserID:    c.UserID,
		BoardID:   c.BoardID,
		CreatedAt: c.CreatedAt,
	}
} 