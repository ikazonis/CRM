package contact

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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	contacts, err := h.svc.List(r.Context(), companyID)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao listar contatos")
		return
	}

	httputil.JSON(w, http.StatusOK, contacts)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	var req struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "payload inválido")
		return
	}

	if req.Name == "" || req.Phone == "" {
		httputil.Error(w, http.StatusBadRequest, "nome e telefone obrigatórios")
		return
	}

	if err := h.svc.Create(r.Context(), companyID, req.Name, req.Phone); err != nil {
		httputil.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	httputil.JSON(w, http.StatusCreated, map[string]string{"message": "contato criado"})
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/contacts/")

	var req struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "payload inválido")
		return
	}

	if err := h.svc.Update(r.Context(), id, companyID, req.Name, req.Phone); err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao atualizar contato")
		return
	}

	httputil.JSON(w, http.StatusOK, map[string]string{"message": "contato atualizado"})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/contacts/")

	if err := h.svc.Delete(r.Context(), id, companyID); err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao deletar contato")
		return
	}

	httputil.JSON(w, http.StatusOK, map[string]string{"message": "contato removido"})
}

func (h *Handler) ImportCSV(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		httputil.Error(w, http.StatusBadRequest, "arquivo não encontrado")
		return
	}
	defer file.Close()

	imported, skipped, err := h.svc.ImportCSV(r.Context(), companyID, file)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao importar CSV")
		return
	}

	httputil.JSON(w, http.StatusOK, map[string]int{
		"imported": imported,
		"skipped":  skipped,
	})
}

func (h *Handler) DeleteAll(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	if err := h.svc.DeleteAll(r.Context(), companyID); err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao limpar contatos")
		return
	}

	httputil.JSON(w, http.StatusOK, map[string]string{"message": "contatos removidos"})
}
