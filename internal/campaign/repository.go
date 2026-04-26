package campaign

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type Campaign struct {
	ID        string    `json:"id"`
	CompanyID string    `json:"company_id"`
	SegmentID *string   `json:"segment_id"`
	Name      string    `json:"name"`
	Message   string    `json:"message"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

func (r *Repository) Create(ctx context.Context, c Campaign) (Campaign, error) {
	err := r.db.QueryRow(ctx, `
		INSERT INTO campaigns (company_id, segment_id, name, message)
		VALUES ($1, $2, $3, $4)
		RETURNING id, company_id, segment_id, name, message, status, created_at
	`, c.CompanyID, c.SegmentID, c.Name, c.Message).Scan(
		&c.ID, &c.CompanyID, &c.SegmentID, &c.Name, &c.Message, &c.Status, &c.CreatedAt,
	)
	return c, err
}

func (r *Repository) List(ctx context.Context, companyID string) ([]Campaign, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, segment_id, name, message, status, created_at
		FROM campaigns
		WHERE company_id = $1
		ORDER BY created_at DESC
	`, companyID)
	if err != nil {
		log.Printf("erro ao listar campanhas: %v", err)
		return nil, err
	}
	defer rows.Close()

	var campaigns []Campaign
	for rows.Next() {
		var c Campaign
		if err := rows.Scan(&c.ID, &c.CompanyID, &c.SegmentID, &c.Name, &c.Message, &c.Status, &c.CreatedAt); err != nil {
			log.Printf("erro ao escanear campanha: %v", err)
			return nil, err
		}
		campaigns = append(campaigns, c)
	}
	return campaigns, nil
}

func (r *Repository) GetByID(ctx context.Context, id, companyID string) (Campaign, error) {
	var c Campaign
	err := r.db.QueryRow(ctx, `
		SELECT id, company_id, segment_id, name, message, status, created_at
		FROM campaigns
		WHERE id = $1 AND company_id = $2
	`, id, companyID).Scan(
		&c.ID, &c.CompanyID, &c.SegmentID, &c.Name, &c.Message, &c.Status, &c.CreatedAt,
	)
	return c, err
}

func (r *Repository) UpdateStatus(ctx context.Context, id, companyID, status string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE campaigns SET status = $1
		WHERE id = $2 AND company_id = $3
	`, status, id, companyID)
	return err
}
