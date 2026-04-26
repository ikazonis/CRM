package main

import (
	"log"
	"net/http"

	"github.com/ikazonis/CRM/internal/auth"
	"github.com/ikazonis/CRM/internal/campaign"
	"github.com/ikazonis/CRM/internal/config"
	"github.com/ikazonis/CRM/internal/contact"
	"github.com/ikazonis/CRM/internal/db"
	"github.com/ikazonis/CRM/internal/segment"
)

func main() {
	cfg := config.Load()
	pool := db.Connect(cfg.DatabaseURL)
	defer pool.Close()

	// auth
	authSvc := auth.NewService(pool, cfg.JWTSecret, cfg.JWTExpiryHours)
	authHandler := auth.NewHandler(authSvc)

	// contacts
	contactRepo := contact.NewRepository(pool)
	contactSvc := contact.NewService(contactRepo)
	contactHandler := contact.NewHandler(contactSvc)

	// segments
	segmentRepo := segment.NewRepository(pool)
	segmentSvc := segment.NewService(segmentRepo)
	segmentHandler := segment.NewHandler(segmentSvc)

	// campaigns
	campaignRepo := campaign.NewRepository(pool)
	campaignSvc := campaign.NewService(campaignRepo)
	campaignHandler := campaign.NewHandler(campaignSvc)

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
	protected.HandleFunc("GET /segments", segmentHandler.List)
	protected.HandleFunc("POST /segments", segmentHandler.Create)
	protected.HandleFunc("POST /segments/contacts", segmentHandler.Contacts)
	protected.HandleFunc("GET /campaigns", campaignHandler.List)
	protected.HandleFunc("POST /campaigns", campaignHandler.Create)
	protected.HandleFunc("GET /campaigns/{id}/preview", campaignHandler.Preview)

	mux.Handle("/", authSvc.Middleware(protected))

	log.Printf("server listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, mux))
}
