package message

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/ikazonis/CRM/internal/auth"
	"github.com/ikazonis/CRM/internal/campaign"
	"github.com/ikazonis/CRM/internal/contact"
	"github.com/ikazonis/CRM/pkg/httputil"
)

type Handler struct {
	svc          *Service
	campaignRepo *campaign.Repository
	contactRepo  *contact.Repository
}

func NewHandler(svc *Service, campaignRepo *campaign.Repository, contactRepo *contact.Repository) *Handler {
	return &Handler{
		svc:          svc,
		campaignRepo: campaignRepo,
		contactRepo:  contactRepo,
	}
}

func (h *Handler) Send(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/campaigns/")
	id = strings.TrimSuffix(id, "/send")

	log.Printf("disparando campanha %s para empresa %s", id, companyID)

	c, err := h.campaignRepo.GetByID(r.Context(), id, companyID)
	if err != nil {
		log.Printf("erro ao buscar campanha: %v", err)
		httputil.Error(w, http.StatusNotFound, "campanha não encontrada")
		return
	}

	contacts, err := h.contactRepo.ListByCompany(r.Context(), companyID)
	if err != nil {
		log.Printf("erro ao buscar contatos: %v", err)
		httputil.Error(w, http.StatusInternalServerError, "erro ao buscar contatos")
		return
	}

	log.Printf("total de contatos: %d", len(contacts))

	phones := make([]string, 0, len(contacts))
	names := make(map[string]string)
	for _, ct := range contacts {
		phones = append(phones, ct.Phone)
		names[ct.Phone] = ct.Name
	}

	go func() {
		log.Printf("iniciando disparo para %d contatos", len(phones))
		results := h.svc.SendCampaign(context.Background(), phones, c.Message, names)
		sent := 0
		for _, r := range results {
			if r.Success {
				sent++
			} else {
				log.Printf("erro ao enviar para %s: %s", r.Phone, r.Error)
			}
		}
		log.Printf("disparo concluído: %d/%d enviados", sent, len(phones))
		h.campaignRepo.UpdateStatus(context.Background(), id, companyID, "sent")
		h.campaignRepo.UpdateSentCount(context.Background(), id, companyID, sent)
	}()

	httputil.JSON(w, http.StatusOK, map[string]any{
		"message": "disparo iniciado",
		"total":   len(phones),
	})
}

func (h *Handler) SendTest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Phone   string `json:"phone"`
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "payload inválido")
		return
	}

	log.Printf("enviando mensagem de teste para %s", req.Phone)

	if err := h.svc.SendText(r.Context(), req.Phone, req.Message); err != nil {
		log.Printf("erro ao enviar: %v", err)
		httputil.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	httputil.JSON(w, http.StatusOK, map[string]string{"message": "mensagem enviada"})
}
