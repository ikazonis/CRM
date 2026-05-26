package webhook

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var db *pgxpool.Pool

func SetDB(pool *pgxpool.Pool) {
	db = pool
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		mode := r.URL.Query().Get("hub.mode")
		token := r.URL.Query().Get("hub.verify_token")
		challenge := r.URL.Query().Get("hub.challenge")

		if mode == "subscribe" && token == os.Getenv("WEBHOOK_VERIFY_TOKEN") {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(challenge))
			return
		}

		w.WriteHeader(http.StatusForbidden)
		return
	}

	if r.Method == http.MethodPost {
		var payload map[string]any
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		log.Printf("webhook z-api recebido: %+v", payload)

		eventType, _ := payload["type"].(string)
		status, _ := payload["status"].(string)
		phone, _ := payload["phone"].(string)

		if db != nil && phone != "" {
			switch {
			case eventType == "MessageStatusCallback" && status == "RECEIVED":
				_, err := db.Exec(context.Background(), `
					UPDATE campaigns SET delivered_count = delivered_count + 1
					WHERE id = (
						SELECT id FROM campaigns
						WHERE company_id = (
							SELECT company_id FROM contacts WHERE phone = $1 LIMIT 1
						)
						AND status = 'sent'
						ORDER BY created_at DESC
						LIMIT 1
					)
				`, phone)
				if err != nil {
					log.Printf("erro ao atualizar delivered_count: %v", err)
				}

			case eventType == "ReceivedCallback":
				_, err := db.Exec(context.Background(), `
					UPDATE campaigns SET response_count = response_count + 1
					WHERE id = (
						SELECT id FROM campaigns
						WHERE company_id = (
							SELECT company_id FROM contacts WHERE phone = $1 LIMIT 1
						)
						AND status = 'sent'
						ORDER BY created_at DESC
						LIMIT 1
					)
				`, phone)
				if err != nil {
					log.Printf("erro ao atualizar response_count: %v", err)
				}
			}
		}

		w.WriteHeader(http.StatusOK)
		return
	}
}
