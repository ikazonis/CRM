package contact

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"

	"github.com/ikazonis/CRM/pkg/validate"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, companyID string) ([]Contact, error) {
	return s.repo.ListByCompany(ctx, companyID)
}

func (s *Service) ListPaginated(ctx context.Context, companyID, search string, page, pageSize int) (ListResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return s.repo.ListPaginated(ctx, companyID, search, page, pageSize)
}

func (s *Service) Create(ctx context.Context, companyID, name, phone string) error {
	normalized, ok := validate.NormalizePhone(phone)
	if !ok {
		return fmt.Errorf("telefone inválido")
	}
	return s.repo.Upsert(ctx, Contact{
		CompanyID: companyID,
		Name:      name,
		Phone:     normalized,
	})
}

func (s *Service) Update(ctx context.Context, id, companyID, name, phone string) error {
	normalized, ok := validate.NormalizePhone(phone)
	if !ok {
		return fmt.Errorf("telefone inválido")
	}
	return s.repo.Update(ctx, id, companyID, name, normalized)
}

func (s *Service) Delete(ctx context.Context, id, companyID string) error {
	return s.repo.Delete(ctx, id, companyID)
}

func (s *Service) DeleteAll(ctx context.Context, companyID string) error {
	return s.repo.DeleteAll(ctx, companyID)
}

func (s *Service) ImportCSV(ctx context.Context, companyID string, r io.Reader) (int, int, error) {
	reader := csv.NewReader(r)
	reader.TrimLeadingSpace = true

	if _, err := reader.Read(); err != nil {
		return 0, 0, err
	}

	var imported, skipped int
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			skipped++
			continue
		}
		if len(record) < 2 {
			skipped++
			continue
		}

		name := record[0]
		phone, ok := validate.NormalizePhone(record[1])
		if !ok {
			skipped++
			continue
		}

		if err := s.repo.Upsert(ctx, Contact{
			CompanyID: companyID,
			Name:      name,
			Phone:     phone,
		}); err != nil {
			skipped++
			continue
		}
		imported++
	}

	return imported, skipped, nil
}
