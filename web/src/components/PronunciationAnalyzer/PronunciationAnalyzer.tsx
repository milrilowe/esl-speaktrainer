import { analyzeAudio, fetchRandomPrompt } from "@/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AnalysisResults } from "./components";
import { PromptSelector } from "./components/PromptSelector";
import { RecordingInterface } from "./components/RecordingInterface";
import type { Prompt } from "@/types";

export default function PronunciationAnalyzer() {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [customText, setCustomText] = useState<string>('');
  const [recordedFile, setRecordedFile] = useState<File | null>(null);

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
    mutationFn: ({ file, expectedText }: { file: File; expectedText: string }) => 
      analyzeAudio(file, expectedText),
  });

  const handleRecordingComplete = (audioFile: File) => {
    setRecordedFile(audioFile);
    // Don't auto-submit anymore - let user play back and verify first
  };

  const handleAnalyze = () => {
    if (!recordedFile || !selectedPrompt) {
      alert('Please record your pronunciation first');
      return;
    }

    analysisMutation.mutate({
      file: recordedFile,
      expectedText: selectedPrompt.text
    });
  };

  const handleReset = () => {
    setRecordedFile(null);
    setCustomText('');
    analysisMutation.reset();
    // Don't reset the prompt - keep it for next attempt
  };

  const handleRandomPrompt = () => {
    randomPromptQuery.refetch();
    // Clear any previous recording/analysis when getting new prompt
    setRecordedFile(null);
    analysisMutation.reset();
  };

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    // Clear any previous recording/analysis when changing prompt
    setRecordedFile(null);
    analysisMutation.reset();
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

            {/* Recording Interface - Only show if we have a prompt */}
            {selectedPrompt && (
              <RecordingInterface
                onRecordingComplete={handleRecordingComplete}
                isAnalyzing={analysisMutation.isPending}
                disabled={false}
              />
            )}

            {/* Analyze Button - Only show if we have a recording */}
            {recordedFile && selectedPrompt && !analysisMutation.data && (
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={analysisMutation.isPending}
                  className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {analysisMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </div>
                  ) : (
                    'Analyze My Pronunciation'
                  )}
                </button>
              </div>
            )}

            {/* Reset Button - Only show if we have results or are analyzing */}
            {(analysisMutation.data || analysisMutation.isPending || recordedFile) && (
              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  disabled={analysisMutation.isPending}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Start Over
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