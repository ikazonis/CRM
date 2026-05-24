package message

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type Service struct {
	instanceID string
	token      string
	httpClient *http.Client
}

func NewService() *Service {
	return &Service{
		instanceID: os.Getenv("ZAPI_INSTANCE_ID"),
		token:      os.Getenv("ZAPI_TOKEN"),
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

type SendResult struct {
	Phone   string
	Success bool
	Error   string
}

func (s *Service) SendText(ctx context.Context, phone, text string) error {
	url := fmt.Sprintf(
		"https://api.z-api.io/instances/%s/token/%s/send-text",
		s.instanceID, s.token,
	)

	body := map[string]string{
		"phone":   phone,
		"message": text,
	}

	data, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("zapi retornou status %d", resp.StatusCode)
	}

	return nil
}

func (s *Service) SendCampaign(ctx context.Context, phones []string, messageTemplate string, names map[string]string) []SendResult {
	results := make([]SendResult, 0, len(phones))

	for _, phone := range phones {
		name := names[phone]
		if name == "" {
			name = "cliente"
		}

		text := strings.ReplaceAll(messageTemplate, "{{nome}}", name)

		err := s.SendText(ctx, phone, text)
		result := SendResult{Phone: phone, Success: err == nil}
		if err != nil {
			result.Error = err.Error()
		}
		results = append(results, result)

		// rate limiting — 1 segundo entre mensagens
		time.Sleep(1 * time.Second)
	}

	return results
}
