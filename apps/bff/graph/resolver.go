package graph

import (
	"zamcv2bff/internal/auth"
	"zamcv2bff/internal/database"
	"zamcv2bff/internal/nats"


)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	DB          *database.DB
	NatsConn    *nats.Conn
	AuthService *auth.Service
} 