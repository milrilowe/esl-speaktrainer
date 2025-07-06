import { useState } from 'react';
import type { Prompt } from '@/types';

interface Props {
  selectedPrompt: Prompt | null;
  customText: string;
  onPromptSelect: (prompt: Prompt) => void;
  onCustomTextChange: (text: string) => void;
  onRandomPrompt: () => void;
  isLoadingRandom: boolean;
}

export function PromptSelector({
  selectedPrompt,
  customText,
  onPromptSelect,
  onCustomTextChange,
  onRandomPrompt,
  isLoadingRandom
}: Props) {
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleRandomClick = () => {
    setIsCustomMode(false);
    onRandomPrompt();
  };

  const handleCustomClick = () => {
    setIsCustomMode(true);
    // Clear any selected prompt when switching to custom mode
    if (selectedPrompt) {
      onPromptSelect(null as any);
    }
  };

  const handleCustomTextSubmit = () => {
    if (customText.trim()) {
      // Create a temporary prompt object for custom text
      const customPrompt: Prompt = {
        id: 'custom',
        text: customText.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      onPromptSelect(customPrompt);
    }
  };

  return (
    <div className="space-y-4">
      {/* Prompt Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleRandomClick}
          disabled={isLoadingRandom}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoadingRandom ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            '🎲 Random Prompt'
          )}
        </button>
        
        <button
          onClick={handleCustomClick}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
            isCustomMode
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ✏️ Custom Prompt
        </button>
      </div>

      {/* Current Prompt Display */}
      {selectedPrompt && !isCustomMode && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-600 font-medium mb-1">Practice this:</div>
          <div className="text-lg text-blue-900 font-medium">
            "{selectedPrompt.text}"
          </div>
        </div>
      )}

      {/* Custom Text Input */}
      {isCustomMode && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your custom text to practice:
            </label>
            <textarea
              value={customText}
              onChange={(e) => onCustomTextChange(e.target.value)}
              placeholder="Type the text you want to practice..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              rows={3}
            />
          </div>
          
          {customText.trim() && (
            <button
              onClick={handleCustomTextSubmit}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Use This Text
            </button>
          )}
        </div>
      )}

      {/* Custom Prompt Display */}
      {selectedPrompt && isCustomMode && selectedPrompt.id === 'custom' && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-sm text-purple-600 font-medium mb-1">Your custom prompt:</div>
          <div className="text-lg text-purple-900 font-medium">
            "{selectedPrompt.text}"
          </div>
        </div>
      )}

      {/* Default state - show grey placeholder */}
      {!selectedPrompt && !isCustomMode && !isLoadingRandom && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-gray-500 text-center italic">
            Click "Random Prompt" to get started, or create your own custom prompt
          </div>
        </div>
      )}
    </div>
  );
}