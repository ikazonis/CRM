package contact

import (
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
