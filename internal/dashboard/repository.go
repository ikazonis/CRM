package dashboard

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type Stats struct {
	TotalContacts  int `json:"total_contacts"`
	TotalCampaigns int `json:"total_campaigns"`
	TotalSent      int `json:"total_sent"`
	TotalDelivered int `json:"total_delivered"`
	TotalResponses int `json:"total_responses"`
}

func (r *Repository) GetStats(ctx context.Context, companyID string) (Stats, error) {
	var s Stats

	err := r.db.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM contacts WHERE company_id = $1 AND opted_out = FALSE),
			(SELECT COUNT(*) FROM campaigns WHERE company_id = $1),
			(SELECT COALESCE(SUM(sent_count), 0) FROM campaigns WHERE company_id = $1),
			(SELECT COALESCE(SUM(delivered_count), 0) FROM campaigns WHERE company_id = $1),
			(SELECT COALESCE(SUM(response_count), 0) FROM campaigns WHERE company_id = $1)
	`, companyID).Scan(
		&s.TotalContacts,
		&s.TotalCampaigns,
		&s.TotalSent,
		&s.TotalDelivered,
		&s.TotalResponses,
	)

	return s, err
}
