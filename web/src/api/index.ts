import type { AnalysisResult, Prompt } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const fetchPrompts = async (): Promise<{ prompts: Prompt[] }> => {
  const response = await fetch(`${API_BASE_URL}/prompts`);
  if (!response.ok) {
    throw new Error('Failed to fetch prompts');
  }
  return response.json();
};

// New function for random prompt
export const fetchRandomPrompt = async (): Promise<Prompt> => {
  const response = await fetch(`${API_BASE_URL}/prompts/random`);
  if (!response.ok) {
    throw new Error('Failed to fetch random prompt');
  }
  const data = await response.json();
  // The API returns { id, text }, we need to create a full Prompt object
  return {
    id: data.id,
    text: data.text,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// New function to create custom prompt
export const createCustomPrompt = async (text: string): Promise<Prompt> => {
  const response = await fetch(`${API_BASE_URL}/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create custom prompt');
  }
  
  return response.json();
};

export const analyzeAudio = async (audioFile: File, expectedText: string): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('expected_text', expectedText);

  const response = await fetch(`${API_BASE_URL}/sessions/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Analysis failed');
  }

  return response.json();
};