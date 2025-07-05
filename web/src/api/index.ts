import type { AnalysisResult, Prompt } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const fetchPrompts = async (): Promise<{ prompts: Prompt[] }> => {
  const response = await fetch(`${API_BASE_URL}/prompts`);
  if (!response.ok) {
    throw new Error('Failed to fetch prompts');
  }
  return response.json();
};

export const analyzeAudio = async (audioFile: File, promptId: string): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('audio_file', audioFile);
  formData.append('prompt_id', promptId);

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