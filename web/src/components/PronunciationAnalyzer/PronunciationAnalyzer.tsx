import { analyzeAudio, fetchPrompts } from "@/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AnalysisResults } from "./components";

export default function PronunciationAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch prompts
  const { 
    data: promptsData, 
    isLoading: promptsLoading, 
    error: promptsError 
  } = useQuery({
    queryKey: ['prompts'],
    queryFn: fetchPrompts
  });

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: ({ file, promptId }: { file: File; promptId: string }) => 
      analyzeAudio(file, promptId),
    onSuccess: () => {
      // Optionally refetch sessions or other data
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
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
    if (!selectedFile || !selectedPromptId) {
      alert('Please select both an audio file and a prompt');
      return;
    }

    analysisMutation.mutate({
      file: selectedFile,
      promptId: selectedPromptId
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedPromptId('');
    analysisMutation.reset();
  };

  if (promptsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading prompts...</div>
        </div>
      </div>
    );
  }

  if (promptsError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Prompts</h2>
          <p className="text-gray-700">{promptsError.message}</p>
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

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Analyze Your Pronunciation
          </h2>

          <div className="space-y-6">
            {/* Prompt Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a prompt to practice:
              </label>
              <select
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={analysisMutation.isPending}
              >
                <option value="">Select a prompt...</option>
                {promptsData?.prompts.map((prompt) => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.text}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
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

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || !selectedPromptId || analysisMutation.isPending}
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
              
              {(selectedFile || analysisMutation.data || analysisMutation.error) && (
                <button
                  onClick={handleReset}
                  disabled={analysisMutation.isPending}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Error Display */}
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