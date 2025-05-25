package graph

import (
	"github.com/zerionstudio/zamc-v2/apps/bff/internal/auth"
	"github.com/zerionstudio/zamc-v2/apps/bff/internal/database"
	"github.com/zerionstudio/zamc-v2/apps/bff/internal/nats"


)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	DB          *database.DB
	NatsConn    *nats.Conn
	AuthService *auth.Service
} 