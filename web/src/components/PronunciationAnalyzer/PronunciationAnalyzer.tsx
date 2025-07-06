import { analyzeAudio, fetchRandomPrompt } from "@/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AnalysisResults, PromptSelector } from "./components";
import type { Prompt } from "@/types";

export default function PronunciationAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [customText, setCustomText] = useState<string>('');

  // Random prompt query
  const randomPromptQuery = useQuery({
    queryKey: ['random-prompt'],
    queryFn: fetchRandomPrompt,
    enabled: false, // Don't auto-fetch, we'll trigger manually
  });

  // Auto-load random prompt on page load
  useEffect(() => {
    randomPromptQuery.refetch();
  }, []);

  // Set the prompt when random prompt is fetched
  useEffect(() => {
    if (randomPromptQuery.data) {
      setSelectedPrompt(randomPromptQuery.data);
    }
  }, [randomPromptQuery.data]);

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: ({ file, promptId }: { file: File; promptId: string }) => 
      analyzeAudio(file, promptId),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile || !selectedPrompt) {
      alert('Please select both an audio file and a prompt');
      return;
    }

    analysisMutation.mutate({
      file: selectedFile,
      promptId: selectedPrompt.id
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setCustomText('');
    analysisMutation.reset();
    // Don't reset the prompt - keep it for next attempt
  };

  const handleRandomPrompt = () => {
    randomPromptQuery.refetch();
  };

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
  };

  // Show loading state for initial random prompt fetch
  if (randomPromptQuery.isLoading && !selectedPrompt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading your first prompt...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SpeakTrainer
          </h1>
          <p className="text-gray-600">
            Practice pronunciation and get instant feedback
          </p>
        </div>

        {/* Main Interface */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Practice Session
          </h2>

          <div className="space-y-6">
            {/* Prompt Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose what to practice:
              </label>
              <PromptSelector
                selectedPrompt={selectedPrompt}
                customText={customText}
                onPromptSelect={handlePromptSelect}
                onCustomTextChange={handleCustomTextChange}
                onRandomPrompt={handleRandomPrompt}
                isLoadingRandom={randomPromptQuery.isFetching}
              />
            </div>

            {/* File Upload - Only show if we have a prompt */}
            {selectedPrompt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload your audio recording:
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={analysisMutation.isPending}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            )}

            {/* Actions - Only show if we have both prompt and file */}
            {selectedPrompt && selectedFile && (
              <div className="flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={analysisMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {analysisMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </div>
                  ) : (
                    'Analyze Pronunciation'
                  )}
                </button>
                
                <button
                  onClick={handleReset}
                  disabled={analysisMutation.isPending}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Error Display */}
            {randomPromptQuery.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 font-semibold mb-1">Failed to Load Prompt</div>
                <div className="text-red-600 text-sm">
                  {randomPromptQuery.error.message}
                </div>
                <button
                  onClick={handleRandomPrompt}
                  className="mt-2 text-sm text-red-700 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {analysisMutation.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 font-semibold mb-1">Analysis Failed</div>
                <div className="text-red-600 text-sm">
                  {analysisMutation.error.message}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {analysisMutation.data && (
          <AnalysisResults result={analysisMutation.data} />
        )}
      </div>
    </div>
  );
}