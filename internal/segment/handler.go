package segment

import (
	"encoding/json"
	"net/http"

	"github.com/ikazonis/CRM/internal/auth"
	"github.com/ikazonis/CRM/pkg/httputil"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

type createRequest struct {
	Name         string `json:"name"`
	InactiveDays int    `json:"inactive_days"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "payload inválido")
		return
	}

	if req.Name == "" || req.InactiveDays == 0 {
		httputil.Error(w, http.StatusBadRequest, "nome e dias obrigatórios")
		return
	}

	s, err := h.svc.Create(r.Context(), companyID, req.Name, req.InactiveDays)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao criar segmento")
		return
	}

	httputil.JSON(w, http.StatusCreated, s)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	segments, err := h.svc.List(r.Context(), companyID)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao listar segmentos")
		return
	}

	httputil.JSON(w, http.StatusOK, segments)
}

func (h *Handler) Contacts(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	var req struct {
		InactiveDays int `json:"inactive_days"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "payload inválido")
		return
	}

	phones, err := h.svc.GetContacts(r.Context(), companyID, req.InactiveDays)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao buscar contatos")
		return
	}

	httputil.JSON(w, http.StatusOK, map[string]any{
		"total":  len(phones),
		"phones": phones,
	})
}
