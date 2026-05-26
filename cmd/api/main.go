package main

import (
	"log"
	"net/http"

	"github.com/ikazonis/CRM/internal/auth"
	"github.com/ikazonis/CRM/internal/campaign"
	"github.com/ikazonis/CRM/internal/config"
	"github.com/ikazonis/CRM/internal/contact"
	"github.com/ikazonis/CRM/internal/dashboard"
	"github.com/ikazonis/CRM/internal/db"
	"github.com/ikazonis/CRM/internal/message"
	"github.com/ikazonis/CRM/internal/segment"
	"github.com/ikazonis/CRM/internal/webhook"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	cfg := config.Load()
	pool := db.Connect(cfg.DatabaseURL)
	defer pool.Close()

	webhook.SetDB(pool)

	authSvc := auth.NewService(pool, cfg.JWTSecret, cfg.JWTExpiryHours)
	authHandler := auth.NewHandler(authSvc)

	contactRepo := contact.NewRepository(pool)
	contactSvc := contact.NewService(contactRepo)
	contactHandler := contact.NewHandler(contactSvc)

	segmentRepo := segment.NewRepository(pool)
	segmentSvc := segment.NewService(segmentRepo)
	segmentHandler := segment.NewHandler(segmentSvc)

	campaignRepo := campaign.NewRepository(pool)
	campaignSvc := campaign.NewService(campaignRepo)
	campaignHandler := campaign.NewHandler(campaignSvc)

	dashboardRepo := dashboard.NewRepository(pool)
	dashboardSvc := dashboard.NewService(dashboardRepo)
	dashboardHandler := dashboard.NewHandler(dashboardSvc)

	messageSvc := message.NewService()
	messageHandler := message.NewHandler(messageSvc, campaignRepo, contactRepo)

	mux := http.NewServeMux()

	// público
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("POST /register", authHandler.Register)
	mux.HandleFunc("POST /login", authHandler.Login)
	mux.HandleFunc("/webhook/whatsapp", webhook.Handler)

	// protegido
	protected := http.NewServeMux()
	protected.HandleFunc("GET /contacts", contactHandler.List)
	protected.HandleFunc("POST /contacts", contactHandler.Create)
	protected.HandleFunc("POST /contacts/import", contactHandler.ImportCSV)
	protected.HandleFunc("PUT /contacts/{id}", contactHandler.Update)
	protected.HandleFunc("DELETE /contacts/{id}", contactHandler.Delete)
	protected.HandleFunc("GET /segments", segmentHandler.List)
	protected.HandleFunc("POST /segments", segmentHandler.Create)
	protected.HandleFunc("POST /segments/contacts", segmentHandler.Contacts)
	protected.HandleFunc("GET /campaigns", campaignHandler.List)
	protected.HandleFunc("POST /campaigns", campaignHandler.Create)
	protected.HandleFunc("GET /campaigns/{id}/preview", campaignHandler.Preview)
	protected.HandleFunc("POST /campaigns/{id}/send", messageHandler.Send)
	protected.HandleFunc("PUT /campaigns/{id}", campaignHandler.Update)
	protected.HandleFunc("DELETE /campaigns/{id}", campaignHandler.Delete)
	protected.HandleFunc("POST /messages/test", messageHandler.SendTest)
	protected.HandleFunc("GET /dashboard", dashboardHandler.Stats)

	mux.Handle("/", authSvc.Middleware(protected))

	log.Printf("server listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, corsMiddleware(mux)))
}
