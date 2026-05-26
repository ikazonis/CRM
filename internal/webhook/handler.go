package webhook

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

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
		w.WriteHeader(http.StatusOK)
		return
	}
}
