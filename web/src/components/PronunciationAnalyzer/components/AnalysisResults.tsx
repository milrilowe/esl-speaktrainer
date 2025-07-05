import type { AnalysisResult } from '@/types';

interface Props {
    result: AnalysisResult;
}

export function AnalysisResults({ result }: Props) {
  function renderPhonemeComparison(diff: string) {
    return diff.split('').map((char, index) => (
      <span
        key={index}
        className={`inline-block w-6 h-6 text-center text-sm font-mono ${
          char === '✅' ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {char}
      </span>
    ));
  };

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h2>
      
      {/* Score */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}%
          </div>
          <div className="text-gray-600 mt-1">Pronunciation Score</div>
        </div>
      </div>

      {/* Expected vs Actual */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Expected Text</h3>
          <div className="p-3 bg-blue-50 rounded border text-gray-800">
            "{result.prompt.text}"
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">What You Said</h3>
          <div className="p-3 bg-yellow-50 rounded border text-gray-800">
            "{result.transcription}"
          </div>
        </div>
      </div>

      {/* Phoneme Analysis */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Phoneme Analysis</h3>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Expected Phonemes:</div>
            <div className="p-2 bg-gray-100 rounded font-mono text-sm">
              {result.expected_phonemes}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Your Phonemes:</div>
            <div className="p-2 bg-gray-100 rounded font-mono text-sm">
              {result.actual_phonemes}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">
              Comparison (✅ = correct, ❌ = incorrect):
            </div>
            <div className="p-2 bg-gray-100 rounded">
              {renderPhonemeComparison(result.phoneme_diff)}
            </div>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="text-xs text-gray-500 border-t pt-3">
        Session ID: {result.session_id} | 
        Analyzed: {new Date(result.created_at).toLocaleString()}
      </div>
    </div>
  );
};