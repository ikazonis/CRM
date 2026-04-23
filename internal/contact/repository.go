package contact

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

type Contact struct {
	ID        string
	CompanyID string
	Name      string
	Phone     string
}

func (r *Repository) Upsert(ctx context.Context, c Contact) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO contacts (company_id, name, phone)
		VALUES ($1, $2, $3)
		ON CONFLICT (company_id, phone) DO UPDATE SET name = EXCLUDED.name
	`, c.CompanyID, c.Name, c.Phone)
	return err
}

func (r *Repository) ListByCompany(ctx context.Context, companyID string) ([]Contact, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, name, phone
		FROM contacts
		WHERE company_id = $1
		ORDER BY name
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []Contact
	for rows.Next() {
		var c Contact
		if err := rows.Scan(&c.ID, &c.CompanyID, &c.Name, &c.Phone); err != nil {
			return nil, err
		}
		contacts = append(contacts, c)
	}
	return contacts, nil
}
