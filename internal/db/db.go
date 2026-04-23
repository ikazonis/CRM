package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(databaseURL string) *pgxpool.Pool {
	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("erro ao criar pool de conexão: %v", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("erro ao conectar no banco: %v", err)
	}

	log.Println("banco de dados conectado")
	return pool
}
