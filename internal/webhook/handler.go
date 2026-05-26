package webhook

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

var db *pgxpool.Pool

func SetDB(pool *pgxpool.Pool) {
	db = pool
}

func normalizePhone(phone string) string {
	// remove @lid, @s.whatsapp.net etc
	if idx := strings.Index(phone, "@"); idx != -1 {
		phone = phone[:idx]
	}
	// adiciona 55 se não tiver
	if !strings.HasPrefix(phone, "55") {
		phone = "55" + phone
	}
	return phone
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
		rawPhone, _ := payload["phone"].(string)
		phone := normalizePhone(rawPhone)

		log.Printf("webhook processando: type=%s status=%s phone=%s", eventType, status, phone)

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
				} else {
					log.Printf("delivered_count atualizado para phone=%s", phone)
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
				} else {
					log.Printf("response_count atualizado para phone=%s", phone)
				}
			}
		}

		w.WriteHeader(http.StatusOK)
		return
	}
}
