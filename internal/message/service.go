package message

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type Service struct {
	instanceID  string
	token       string
	clientToken string
	httpClient  *http.Client
}

func NewService() *Service {
	return &Service{
		instanceID:  os.Getenv("ZAPI_INSTANCE_ID"),
		token:       os.Getenv("ZAPI_TOKEN"),
		clientToken: os.Getenv("ZAPI_CLIENT_TOKEN"),
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}
}

type SendResult struct {
	Phone   string
	Success bool
	Error   string
}

func (s *Service) SendText(ctx context.Context, phone, text string) error {
	//	url := fmt.Sprintf(
	//		"https://api.z-api.io/instances/%s/token/%s/send-text",
	//		s.instanceID, s.token,
	//	)
	url := fmt.Sprintf(
		"https://api.z-api.io/instances/%s/token/%s/send-messages",
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
	req.Header.Set("Client-Token", s.clientToken)

	log.Printf("enviando para %s via Z-API", phone)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		log.Printf("erro HTTP ao enviar para %s: %v", phone, err)
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("resposta Z-API para %s: status=%d body=%s", phone, resp.StatusCode, string(respBody))

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("zapi retornou status %d: %s", resp.StatusCode, string(respBody))
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

		time.Sleep(1 * time.Second)
	}

	return results
}
