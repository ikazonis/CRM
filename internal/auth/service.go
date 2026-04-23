package auth

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	db        *pgxpool.Pool
	jwtSecret string
	expiry    time.Duration
}

func NewService(db *pgxpool.Pool, jwtSecret string, expiryHours int) *Service {
	return &Service{
		db:        db,
		jwtSecret: jwtSecret,
		expiry:    time.Duration(expiryHours) * time.Hour,
	}
}

type Claims struct {
	UserID    string `json:"user_id"`
	CompanyID string `json:"company_id"`
	jwt.RegisteredClaims
}

func (s *Service) Register(ctx context.Context, companyName, email, password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var companyID string
	err = tx.QueryRow(ctx,
		`INSERT INTO companies (name) VALUES ($1) RETURNING id`, companyName,
	).Scan(&companyID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO users (company_id, email, password) VALUES ($1, $2, $3)`,
		companyID, email, string(hash),
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *Service) Login(ctx context.Context, email, password string) (string, error) {
	var userID, companyID, hash string
	err := s.db.QueryRow(ctx,
		`SELECT id, company_id, password FROM users WHERE email = $1`, email,
	).Scan(&userID, &companyID, &hash)
	if err != nil {
		return "", errors.New("credenciais inválidas")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return "", errors.New("credenciais inválidas")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		UserID:    userID,
		CompanyID: companyID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	})

	return token.SignedString([]byte(s.jwtSecret))
}

func (s *Service) ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (any, error) {
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("token inválido")
	}
	return token.Claims.(*Claims), nil
}
