package segment

import (
	"context"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, companyID, name string, inactiveDays int) (Segment, error) {
	return s.repo.Create(ctx, Segment{
		CompanyID:    companyID,
		Name:         name,
		InactiveDays: inactiveDays,
	})
}

func (s *Service) List(ctx context.Context, companyID string) ([]Segment, error) {
	return s.repo.List(ctx, companyID)
}

func (s *Service) GetContacts(ctx context.Context, companyID string, inactiveDays int) ([]string, error) {
	return s.repo.GetContacts(ctx, companyID, inactiveDays)
}
