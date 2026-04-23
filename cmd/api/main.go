package main

import (
	"log"
	"net/http"

	"github.com/ikazonis/CRM/internal/auth"
	"github.com/ikazonis/CRM/internal/config"
	"github.com/ikazonis/CRM/internal/contact"
	"github.com/ikazonis/CRM/internal/db"
)

func main() {
	cfg := config.Load()
	pool := db.Connect(cfg.DatabaseURL)
	defer pool.Close()

	authSvc := auth.NewService(pool, cfg.JWTSecret, cfg.JWTExpiryHours)
	authHandler := auth.NewHandler(authSvc)

	contactRepo := contact.NewRepository(pool)
	contactSvc := contact.NewService(contactRepo)
	contactHandler := contact.NewHandler(contactSvc)

	mux := http.NewServeMux()

	// público
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("POST /register", authHandler.Register)
	mux.HandleFunc("POST /login", authHandler.Login)

	// protegido
	protected := http.NewServeMux()
	protected.HandleFunc("GET /contacts", contactHandler.List)
	protected.HandleFunc("POST /contacts/import", contactHandler.ImportCSV)

	mux.Handle("/", authSvc.Middleware(protected))

	log.Printf("server listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, mux))
}
