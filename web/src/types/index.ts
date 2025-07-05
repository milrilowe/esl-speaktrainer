export interface Prompt {
  id: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  session_id: string;
  prompt: Prompt;
  transcription: string;
  score: number;
  expected_phonemes: string;
  actual_phonemes: string;
  phoneme_diff: string;
  analysis_details: {
    transcription: string;
    expected_phonemes: string;
    actual_phonemes: string;
    diff: string;
    score: number;
    phoneme_comparison?: any;
  };
  created_at: string;
}
