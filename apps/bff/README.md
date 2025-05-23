# ZAMC GraphQL Backend-for-Frontend (BFF)

A GraphQL API service built with Go and gqlgen that serves as a Backend-for-Frontend between the React frontend and Supabase.

## Features

- **GraphQL API** with queries, mutations, and subscriptions
- **Supabase Integration** for PostgreSQL database and JWT authentication
- **NATS Pub/Sub** for real-time board updates
- **WebSocket Support** for GraphQL subscriptions
- **CORS Configuration** for frontend integration
- **Health Check Endpoint** for monitoring

## Architecture

```
Frontend (React) → GraphQL BFF (Go) → Supabase (PostgreSQL + Auth)
                                   ↓
                              NATS (Pub/Sub)
```

## Prerequisites

- Go 1.21 or higher
- PostgreSQL (via Supabase)
- NATS Server
- Supabase account and project

## Installation

1. **Install Go dependencies:**
   ```bash
   cd apps/bff
   go mod download
   ```

2. **Install gqlgen CLI (optional, for code generation):**
   ```bash
   go install github.com/99designs/gqlgen@latest
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your actual values:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_key_here
   SUPABASE_JWT_SECRET=your_jwt_secret_here
   DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
   NATS_URL=nats://localhost:4222
   PORT=8080
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ENVIRONMENT=development
   ```

4. **Set up the database schema:**
   ```bash
   psql -d your_database_url -f schema.sql
   ```

5. **Start NATS server:**
   ```bash
   # Install NATS server if not already installed
   # https://docs.nats.io/running-a-nats-service/introduction/installation
   nats-server
   ```

## Running the Server

```bash
go run main.go
```

The server will start on `http://localhost:8080` with:
- GraphQL Playground: `http://localhost:8080/`
- GraphQL API: `http://localhost:8080/query`
- Health Check: `http://localhost:8080/health`

## API Documentation

### Authentication

All requests require a valid Supabase JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Queries

#### Get Current User
```graphql
query {
  me {
    id
    email
    name
    avatar
    createdAt
    updatedAt
  }
}
```

#### Get Projects
```graphql
query {
  projects {
    id
    name
    description
    status
    owner {
      id
      email
    }
    boards {
      id
      name
    }
    createdAt
    updatedAt
  }
}
```

#### Get Specific Project
```graphql
query GetProject($id: ID!) {
  project(id: $id) {
    id
    name
    description
    status
    boards {
      id
      name
      assets {
        id
        name
        status
      }
    }
  }
}
```

#### Get Board
```graphql
query GetBoard($id: ID!) {
  board(id: $id) {
    id
    name
    description
    project {
      id
      name
    }
    assets {
      id
      name
      type
      url
      status
      approvedBy {
        id
        email
      }
      approvedAt
    }
  }
}
```

#### Get Chat Messages
```graphql
query GetChatMessages($boardId: ID!, $limit: Int, $offset: Int) {
  chatMessages(boardId: $boardId, limit: $limit, offset: $offset) {
    id
    content
    user {
      id
      email
      name
    }
    createdAt
  }
}
```

### Mutations

#### Approve Asset
```graphql
mutation ApproveAsset($assetId: ID!) {
  approveAsset(assetId: $assetId) {
    id
    status
    approvedBy {
      id
      email
    }
    approvedAt
  }
}
```

#### Send Chat Message
```graphql
mutation SendMessage($boardId: ID!, $content: String!) {
  chat(boardId: $boardId, content: $content) {
    id
    content
    user {
      id
      email
    }
    createdAt
  }
}
```

#### Create Project
```graphql
mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    id
    name
    description
    status
    createdAt
  }
}
```

#### Create Board
```graphql
mutation CreateBoard($input: CreateBoardInput!) {
  createBoard(input: $input) {
    id
    name
    description
    projectId
    createdAt
  }
}
```

#### Upload Asset
```graphql
mutation UploadAsset($input: UploadAssetInput!) {
  uploadAsset(input: $input) {
    id
    name
    type
    url
    status
    boardId
    createdAt
  }
}
```

### Subscriptions

#### Board Updates
```graphql
subscription BoardUpdates($boardId: ID!) {
  boardUpdated(boardId: $boardId) {
    ... on Asset {
      id
      name
      status
      type
    }
    ... on ChatMessage {
      id
      content
      user {
        id
        email
      }
      createdAt
    }
  }
}
```

## Development

### Code Generation

To regenerate GraphQL code after schema changes:
```bash
go run github.com/99designs/gqlgen generate
```

### Project Structure

```
apps/bff/
├── graph/
│   ├── generated/          # Generated GraphQL code
│   ├── model/             # GraphQL models
│   ├── schema.graphqls    # GraphQL schema
│   ├── schema.resolvers.go # Resolver implementations
│   └── resolver.go        # Main resolver struct
├── internal/
│   ├── auth/              # JWT authentication
│   ├── config/            # Configuration management
│   ├── database/          # Database connection
│   └── nats/              # NATS pub/sub
├── main.go                # Server entry point
├── gqlgen.yml            # gqlgen configuration
├── schema.sql            # Database schema
└── README.md             # This file
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `DATABASE_URL` | PostgreSQL connection string | Local Supabase |
| `NATS_URL` | NATS server URL | `nats://localhost:4222` |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_SERVICE_KEY` | Supabase service key | Required |
| `SUPABASE_JWT_SECRET` | JWT signing secret | Required |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173,http://localhost:3000` |
| `ENVIRONMENT` | Environment name | `development` |

## Deployment

1. **Build the binary:**
   ```bash
   go build -o zamc-bff main.go
   ```

2. **Run with production environment:**
   ```bash
   ENVIRONMENT=production ./zamc-bff
   ```

3. **Docker deployment:**
   ```dockerfile
   FROM golang:1.21-alpine AS builder
   WORKDIR /app
   COPY . .
   RUN go build -o zamc-bff main.go

   FROM alpine:latest
   RUN apk --no-cache add ca-certificates
   WORKDIR /root/
   COPY --from=builder /app/zamc-bff .
   CMD ["./zamc-bff"]
   ```

## Contributing

1. Make changes to the GraphQL schema in `graph/schema.graphqls`
2. Run `go run github.com/99designs/gqlgen generate` to regenerate code
3. Implement resolvers in `graph/schema.resolvers.go`
4. Test your changes
5. Submit a pull request

## License

MIT License 