package campaign

import (
	"encoding/json"
	"net/http"
	"strings"

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
	Name      string  `json:"name"`
	Message   string  `json:"message"`
	SegmentID *string `json:"segment_id"`
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

	if req.Name == "" || req.Message == "" {
		httputil.Error(w, http.StatusBadRequest, "nome e mensagem obrigatórios")
		return
	}

	c, err := h.svc.Create(r.Context(), companyID, req.Name, req.Message, req.SegmentID)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao criar campanha")
		return
	}

	httputil.JSON(w, http.StatusCreated, c)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	campaigns, err := h.svc.List(r.Context(), companyID)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao listar campanhas")
		return
	}

	httputil.JSON(w, http.StatusOK, campaigns)
}

func (h *Handler) Preview(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/campaigns/")
	id = strings.TrimSuffix(id, "/preview")

	preview, err := h.svc.Preview(r.Context(), id, companyID)
	if err != nil {
		httputil.Error(w, http.StatusNotFound, "campanha não encontrada")
		return
	}

	httputil.JSON(w, http.StatusOK, map[string]string{"preview": preview})
}
