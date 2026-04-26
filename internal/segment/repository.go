package segment

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type Segment struct {
	ID           string `json:"id"`
	CompanyID    string `json:"company_id"`
	Name         string `json:"name"`
	InactiveDays int    `json:"inactive_days"`
	CreatedAt    string `json:"created_at"`
}

func (r *Repository) Create(ctx context.Context, s Segment) (Segment, error) {
	err := r.db.QueryRow(ctx, `
		INSERT INTO segments (company_id, name, inactive_days)
		VALUES ($1, $2, $3)
		RETURNING id, company_id, name, inactive_days, created_at
	`, s.CompanyID, s.Name, s.InactiveDays).Scan(
		&s.ID, &s.CompanyID, &s.Name, &s.InactiveDays, &s.CreatedAt,
	)
	return s, err
}

func (r *Repository) List(ctx context.Context, companyID string) ([]Segment, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, name, inactive_days, created_at
		FROM segments
		WHERE company_id = $1
		ORDER BY created_at DESC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var segments []Segment
	for rows.Next() {
		var s Segment
		if err := rows.Scan(&s.ID, &s.CompanyID, &s.Name, &s.InactiveDays, &s.CreatedAt); err != nil {
			return nil, err
		}
		segments = append(segments, s)
	}
	return segments, nil
}

func (r *Repository) GetContacts(ctx context.Context, companyID string, inactiveDays int) ([]string, error) {
	cutoff := time.Now().AddDate(0, 0, -inactiveDays)
	rows, err := r.db.Query(ctx, `
		SELECT phone FROM contacts
		WHERE company_id = $1
		AND opted_out = FALSE
		AND (last_msg_at IS NULL OR last_msg_at < $2)
	`, companyID, cutoff)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var phones []string
	for rows.Next() {
		var phone string
		if err := rows.Scan(&phone); err != nil {
			return nil, err
		}
		phones = append(phones, phone)
	}
	return phones, nil
}
