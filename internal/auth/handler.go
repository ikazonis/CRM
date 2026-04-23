package auth

import (
	"encoding/json"
	"net/http"

	"github.com/ikazonis/CRM/pkg/httputil"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

type registerRequest struct {
	CompanyName string `json:"company_name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "payload inválido")
		return
	}

	if req.CompanyName == "" || req.Email == "" || req.Password == "" {
		httputil.Error(w, http.StatusBadRequest, "campos obrigatórios faltando")
		return
	}

	if err := h.svc.Register(r.Context(), req.CompanyName, req.Email, req.Password); err != nil {
		httputil.Error(w, http.StatusInternalServerError, "erro ao registrar")
		return
	}

	httputil.JSON(w, http.StatusCreated, map[string]string{"message": "usuário criado"})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "payload inválido")
		return
	}

	token, err := h.svc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		httputil.Error(w, http.StatusUnauthorized, err.Error())
		return
	}

	httputil.JSON(w, http.StatusOK, map[string]string{"token": token})
}
