package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/ikazonis/CRM/pkg/httputil"
)

type contextKey string

const (
	ContextUserID    contextKey = "user_id"
	ContextCompanyID contextKey = "company_id"
)

func (s *Service) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			httputil.Error(w, http.StatusUnauthorized, "token ausente")
			return
		}

		claims, err := s.ParseToken(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			httputil.Error(w, http.StatusUnauthorized, "token inválido")
			return
		}

		ctx := context.WithValue(r.Context(), ContextUserID, claims.UserID)
		ctx = context.WithValue(ctx, ContextCompanyID, claims.CompanyID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
