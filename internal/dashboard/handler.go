package dashboard

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

func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	companyID, ok := r.Context().Value(auth.ContextCompanyID).(string)
	if !ok {
		httputil.Error(w, http.StatusUnauthorized, "não autorizado")
		return
	}

	stats, err := h.svc.GetStats(r.Context(), companyID)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao buscar métricas")
		return
	}

	httputil.JSON(w, http.StatusOK, stats)
}
