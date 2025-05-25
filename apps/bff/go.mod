module github.com/zerionstudio/zamc-v2/apps/bff

go 1.23.0

toolchain go1.24.3

require (
	github.com/99designs/gqlgen v0.17.45
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/google/uuid v1.6.0
	github.com/gorilla/websocket v1.5.1
	github.com/joho/godotenv v1.5.1
	github.com/lib/pq v1.10.9
	github.com/nats-io/nats.go v1.31.0
	github.com/vektah/gqlparser/v2 v2.5.11
)

require (
	github.com/agnivade/levenshtein v1.1.1 // indirect
	github.com/cpuguy83/go-md2man/v2 v2.0.2 // indirect
	github.com/hashicorp/golang-lru/v2 v2.0.7 // indirect
	github.com/klauspost/compress v1.17.0 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/nats-io/nkeys v0.4.5 // indirect
	github.com/nats-io/nuid v1.0.1 // indirect
	github.com/russross/blackfriday/v2 v2.1.0 // indirect
	github.com/sosodev/duration v1.2.0 // indirect
	github.com/urfave/cli/v2 v2.27.1 // indirect
	github.com/xrash/smetrics v0.0.0-20201216005158-039620a65673 // indirect
	golang.org/x/crypto v0.38.0 // indirect
	golang.org/x/mod v0.17.0 // indirect
	golang.org/x/net v0.40.0 // indirect
	golang.org/x/sync v0.14.0 // indirect
	golang.org/x/sys v0.33.0 // indirect
	golang.org/x/text v0.25.0 // indirect
	golang.org/x/tools v0.21.1-0.20240508182429-e35e4ccd0d2d // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

replace github.com/zerionstudio/zamc-v2/apps/bff => .

replace github.com/zerionstudio/zamc-v2/apps/bff/graph => ./graph

replace github.com/zerionstudio/zamc-v2/apps/bff/graph/model => ./graph/model

replace github.com/zerionstudio/zamc-v2/apps/bff/internal/auth => ./internal/auth

replace github.com/zerionstudio/zamc-v2/apps/bff/internal/database => ./internal/database

replace github.com/zerionstudio/zamc-v2/apps/bff/internal/nats => ./internal/nats

replace github.com/zerionstudio/zamc-v2/apps/bff/graph/generated => ./graph/generated
