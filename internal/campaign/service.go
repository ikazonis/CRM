package campaign

import (
	"context"
	"fmt"
	"strings"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, companyID, name, message string, segmentID *string) (Campaign, error) {
	return s.repo.Create(ctx, Campaign{
		CompanyID: companyID,
		SegmentID: segmentID,
		Name:      name,
		Message:   message,
	})
}

func (s *Service) List(ctx context.Context, companyID string) ([]Campaign, error) {
	return s.repo.List(ctx, companyID)
}

func (s *Service) GetByID(ctx context.Context, id, companyID string) (Campaign, error) {
	return s.repo.GetByID(ctx, id, companyID)
}

func (s *Service) Preview(ctx context.Context, id, companyID string) (string, error) {
	c, err := s.repo.GetByID(ctx, id, companyID)
	if err != nil {
		return "", err
	}
	preview := RenderMessage(c.Message, map[string]string{
		"nome": "João Silva",
	})
	return preview, nil
}

func RenderMessage(template string, vars map[string]string) string {
	result := template
	for k, v := range vars {
		result = strings.ReplaceAll(result, fmt.Sprintf("{{%s}}", k), v)
	}
	return result
}
