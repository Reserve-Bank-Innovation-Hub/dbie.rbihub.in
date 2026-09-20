// Package db holds the connection pool. This service only reads: the pool connects as the reader role, and every
// session is read-only with a statement timeout, so a bad query can neither write nor run away.
package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

// DB wraps the database connection pool.
type DB struct {
	Pool *pgxpool.Pool
}

// NewDB creates the pool and checks the connection.
func NewDB(databaseURL string) (*DB, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database URL: %w", err)
	}
	config.MaxConns = 10
	config.MinConns = 2
	config.ConnConfig.RuntimeParams["default_transaction_read_only"] = "on"
	config.ConnConfig.RuntimeParams["statement_timeout"] = "60000" // ms: a full CSV of the largest table takes well under this
	config.ConnConfig.RuntimeParams["application_name"] = "dbie-data-api"

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	log.Info().Msg("Database connection established")
	return &DB{Pool: pool}, nil
}

// Close closes the pool.
func (db *DB) Close() {
	db.Pool.Close()
}
