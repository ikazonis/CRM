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
	ID        string `json:"id"`
	CompanyID string `json:"company_id"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
}

type ListResult struct {
	Contacts []Contact `json:"contacts"`
	Total    int       `json:"total"`
	Page     int       `json:"page"`
	PageSize int       `json:"page_size"`
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

func (r *Repository) ListPaginated(ctx context.Context, companyID, search string, page, pageSize int) (ListResult, error) {
	offset := (page - 1) * pageSize

	var total int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM contacts
		WHERE company_id = $1
		AND opted_out = FALSE
		AND ($2 = '' OR name ILIKE '%' || $2 || '%' OR phone ILIKE '%' || $2 || '%')
	`, companyID, search).Scan(&total)
	if err != nil {
		return ListResult{}, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, name, phone
		FROM contacts
		WHERE company_id = $1
		AND opted_out = FALSE
		AND ($2 = '' OR name ILIKE '%' || $2 || '%' OR phone ILIKE '%' || $2 || '%')
		ORDER BY name
		LIMIT $3 OFFSET $4
	`, companyID, search, pageSize, offset)
	if err != nil {
		return ListResult{}, err
	}
	defer rows.Close()

	var contacts []Contact
	for rows.Next() {
		var c Contact
		if err := rows.Scan(&c.ID, &c.CompanyID, &c.Name, &c.Phone); err != nil {
			return ListResult{}, err
		}
		contacts = append(contacts, c)
	}

	return ListResult{
		Contacts: contacts,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (r *Repository) Update(ctx context.Context, id, companyID, name, phone string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE contacts SET name = $1, phone = $2
		WHERE id = $3 AND company_id = $4
	`, name, phone, id, companyID)
	return err
}

func (r *Repository) Delete(ctx context.Context, id, companyID string) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM contacts WHERE id = $1 AND company_id = $2
	`, id, companyID)
	return err
}

func (r *Repository) DeleteAll(ctx context.Context, companyID string) error {
	_, err := r.db.Exec(ctx, `
		DELETE FROM contacts WHERE company_id = $1
	`, companyID)
	return err
}
