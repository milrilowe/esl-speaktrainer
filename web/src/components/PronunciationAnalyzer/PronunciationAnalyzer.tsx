// This should replace the existing PronunciationAnalyzer component
import { analyzeAudio, fetchRandomPrompt } from "@/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Prompt, AnalysisResult } from "@/types";

// Import the dark theme RecordingInterface component
import { RecordingInterface } from "./components/RecordingInterface";

export default function PronunciationAnalyzer() {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [customText, setCustomText] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Random prompt query
  const randomPromptQuery = useQuery({
    queryKey: ['random-prompt'],
    queryFn: fetchRandomPrompt,
    enabled: false,
  });

  // Auto-load random prompt on page load
  useEffect(() => {
    randomPromptQuery.refetch();
  }, []);

  // Set the prompt when random prompt is fetched
  useEffect(() => {
    if (randomPromptQuery.data) {
      setSelectedPrompt(randomPromptQuery.data);
      setIsCustomMode(false);
    }
  }, [randomPromptQuery.data]);

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: ({ file, expectedText }: { file: File; expectedText: string }) => 
      analyzeAudio(file, expectedText),
    onSuccess: (data) => {
      setAnalysisResult(data);
    }
  });

  const handleRecordingComplete = (audioFile: File) => {
    setRecordedFile(audioFile);
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
    setAnalysisResult(null);
    analysisMutation.reset();
  };

  const handleRandomPrompt = () => {
    randomPromptQuery.refetch();
    handleReset();
    setCustomText('');
  };

  const handleCustomPrompt = () => {
    if (customText.trim()) {
      const customPrompt: Prompt = {
        id: 'custom',
        text: customText.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSelectedPrompt(customPrompt);
      setIsCustomMode(true);
      handleReset();
    }
  };

  // Function to analyze word-by-word accuracy
  const getWordAnalysis = () => {
    if (!analysisResult) return [];
    
    const expectedWords = selectedPrompt?.text.toLowerCase().split(/\s+/) || [];
    const actualWords = analysisResult.transcription.toLowerCase().split(/\s+/) || [];
    
    return expectedWords.map((expectedWord, index) => {
      const actualWord = actualWords[index] || '';
      
      // Simple word matching logic
      if (actualWord === expectedWord) {
        return { word: expectedWord, status: 'correct' };
      } else if (actualWord && expectedWord.includes(actualWord) || actualWord.includes(expectedWord)) {
        return { word: expectedWord, status: 'partial' };
      } else {
        return { word: expectedWord, status: 'incorrect' };
      }
    });
  };

  const renderPromptText = () => {
    if (!selectedPrompt) return null;

    const wordAnalysis = getWordAnalysis();
    
    if (analysisResult && wordAnalysis.length > 0) {
      // Show analysis overlay
      return (
        <div className="text-4xl leading-relaxed font-mono">
          {wordAnalysis.map((item, index) => (
            <span
              key={index}
              className={`${
                item.status === 'correct' 
                  ? 'text-green-500 bg-green-50' 
                  : item.status === 'partial'
                  ? 'text-yellow-500 bg-yellow-50'
                  : 'text-red-500 bg-red-50'
              } px-1 py-0.5 rounded mr-2 mb-2 inline-block`}
            >
              {item.word}
            </span>
          ))}
        </div>
      );
    }

    // Show normal prompt
    return (
      <div className="text-4xl leading-relaxed text-gray-600 font-mono">
        {selectedPrompt.text}
      </div>
    );
  };

  const getScoreDisplay = () => {
    if (!analysisResult) return null;
    
    return (
      <div className="text-center mt-8 space-y-2">
        <div className={`text-6xl font-bold ${
          analysisResult.score >= 80 ? 'text-green-500' : 
          analysisResult.score >= 60 ? 'text-yellow-500' : 'text-red-500'
        }`}>
          {analysisResult.score}%
        </div>
        <div className="text-gray-500">Accuracy Score</div>
        <div className="text-sm text-gray-400">
          You said: "{analysisResult.transcription}"
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-300 mb-2">SpeakTrainer</h1>
        <div className="text-gray-500 text-sm">Practice pronunciation • Get instant feedback</div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Custom Text Input (only show when in custom mode) */}
        {isCustomMode && !selectedPrompt && (
          <div className="text-center mb-8">
            <div className="max-w-2xl mx-auto">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your custom text here..."
                className="w-full p-4 text-xl bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                rows={4}
              />
              <div className="flex gap-3 mt-4 justify-center">
                <button
                  onClick={handleCustomPrompt}
                  disabled={!customText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Use This Text
                </button>
                <button
                  onClick={() => {
                    setIsCustomMode(false);
                    setCustomText('');
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Prompt Display */}
        {selectedPrompt && (
          <div className="text-center mb-8 min-h-[200px] flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-4">
              {renderPromptText()}
            </div>
          </div>
        )}

        {/* Score Display */}
        {getScoreDisplay()}

        {/* Control Buttons */}
        <div className="text-center mb-8">
          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={handleRandomPrompt}
              disabled={randomPromptQuery.isFetching}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:bg-gray-800"
            >
              {randomPromptQuery.isFetching ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : (
                '🎲 Random'
              )}
            </button>
            
            <button
              onClick={() => {
                setIsCustomMode(true);
                setSelectedPrompt(null);
                handleReset();
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              ✏️ Custom
            </button>
          </div>
        </div>

        {/* Recording Interface */}
        {selectedPrompt && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <RecordingInterface
                onRecordingComplete={handleRecordingComplete}
                isAnalyzing={analysisMutation.isPending}
                disabled={false}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedPrompt && (
          <div className="text-center space-y-4">
            {recordedFile && !analysisResult && (
              <button
                onClick={handleAnalyze}
                disabled={analysisMutation.isPending}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {analysisMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  'Analyze Pronunciation'
                )}
              </button>
            )}

            {(analysisResult || recordedFile) && (
              <div>
                <button
                  onClick={handleReset}
                  disabled={analysisMutation.isPending}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {(randomPromptQuery.error || analysisMutation.error) && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="p-4 bg-red-900 border border-red-700 rounded-lg">
              <div className="text-red-300 font-semibold mb-1">Error</div>
              <div className="text-red-200 text-sm">
                {randomPromptQuery.error?.message || analysisMutation.error?.message}
              </div>
              {randomPromptQuery.error && (
                <button
                  onClick={handleRandomPrompt}
                  className="mt-2 text-sm text-red-300 underline hover:no-underline"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Initial loading state */}
        {randomPromptQuery.isLoading && !selectedPrompt && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading your first prompt...</div>
          </div>
        )}
      </div>

      {/* Footer space */}
      <div className="h-16"></div>
    </div>
  );
}