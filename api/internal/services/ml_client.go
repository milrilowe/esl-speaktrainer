package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

type MLClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

type AnalysisRequest struct {
	ExpectedText string
	AudioData    []byte
	Filename     string
}

type AnalysisResponse struct {
	Transcription     string                 `json:"transcription"`
	ExpectedPhonemes  string                 `json:"expected_phonemes"`
	ActualPhonemes    string                 `json:"actual_phonemes"`
	Diff              string                 `json:"diff"`
	Score             int                    `json:"score"`
	PhonemeComparison map[string]interface{} `json:"phoneme_comparison,omitempty"`
}

type TranscriptionResponse struct {
	Transcription string `json:"transcription"`
}

func NewMLClient(baseURL string) *MLClient {
	return &MLClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *MLClient) AnalyzePronunciation(req AnalysisRequest) (*AnalysisResponse, error) {
	// Create multipart form
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add expected_text field
	if err := writer.WriteField("expected_text", req.ExpectedText); err != nil {
		return nil, fmt.Errorf("failed to write expected_text field: %w", err)
	}

	// Add audio file
	part, err := writer.CreateFormFile("audio_file", req.Filename)
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err := part.Write(req.AudioData); err != nil {
		return nil, fmt.Errorf("failed to write audio data: %w", err)
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/analyze", c.BaseURL)
	httpReq, err := http.NewRequest("POST", url, &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", writer.FormDataContentType())

	// Make request
	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to ML service: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ML service returned error %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var analysisResp AnalysisResponse
	if err := json.Unmarshal(body, &analysisResp); err != nil {
		return nil, fmt.Errorf("failed to parse ML service response: %w", err)
	}

	return &analysisResp, nil
}

func (c *MLClient) Transcribe(audioData []byte, filename string) (*TranscriptionResponse, error) {
	// Create multipart form
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add audio file
	part, err := writer.CreateFormFile("audio_file", filename)
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err := part.Write(audioData); err != nil {
		return nil, fmt.Errorf("failed to write audio data: %w", err)
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/transcribe", c.BaseURL)
	httpReq, err := http.NewRequest("POST", url, &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", writer.FormDataContentType())

	// Make request
	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to ML service: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ML service returned error %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var transcriptionResp TranscriptionResponse
	if err := json.Unmarshal(body, &transcriptionResp); err != nil {
		return nil, fmt.Errorf("failed to parse ML service response: %w", err)
	}

	return &transcriptionResp, nil
}