package contact

import (
	"context"
	"encoding/csv"
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

func (s *Service) ImportCSV(ctx context.Context, companyID string, r io.Reader) (int, int, error) {
	reader := csv.NewReader(r)
	reader.TrimLeadingSpace = true

	// pula cabeçalho
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

func (s *Service) DeleteAll(ctx context.Context, companyID string) error {
	return s.repo.DeleteAll(ctx, companyID)
}
