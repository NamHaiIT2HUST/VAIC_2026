package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

// CallFptTTS sends text to FPT AI TTS and returns the URL of the generated audio file
func CallFptTTS(text string) (string, error) {
	apiKey := os.Getenv("FPT_AI_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("FPT_AI_KEY is not set in environment")
	}

	url := "https://api.fpt.ai/hmi/tts/v5"

	// Voice options: banmai (Northern Female), leminh (Northern Male), thuminh (Northern Female), myan (Central Female)
	// For hospital announcements, "banmai" is usually very natural.
	payload := []byte(text)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return "", err
	}

	req.Header.Set("api-key", apiKey)
	req.Header.Set("speed", "-1") // slightly slower for clear announcements
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

	// Response is typically: {"async": false, "error": 0, "message": "Successfully", "request_id": "...", "async_url": "..."}
	// Or sometimes just direct binary. The standard v5 API returns a JSON with async_url which takes a few seconds to process.
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	if asyncURL, ok := result["async_url"].(string); ok {
		return asyncURL, nil
	}

	return "", fmt.Errorf("could not find async_url in response")
}
