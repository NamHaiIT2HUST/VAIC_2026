package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

type FptService struct {
	apiKey string
}

func NewFptService(apiKey string) *FptService {
	return &FptService{apiKey: apiKey}
}

func (s *FptService) TextToSpeech(text string) (string, error) {
	if s.apiKey == "" {
		return "", fmt.Errorf("FPT_AI_KEY is not set")
	}

	url := "https://api.fpt.ai/hmi/tts/v5"
	payload := []byte(text)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return "", err
	}

	req.Header.Set("api-key", s.apiKey)
	req.Header.Set("speed", "-1")
	req.Header.Set("voice", "banmai")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("FPT AI error: %s", string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	if asyncURL, ok := result["async_url"].(string); ok {
		return asyncURL, nil
	}

	return "", fmt.Errorf("could not find async_url in response")
}
