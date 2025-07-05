export function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          SpeakTrainer Web App
        </h1>
        <p className="text-gray-600 mb-4">
          React app is running successfully!
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            API URL: {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
          </p>
          <p className="text-sm text-gray-500">
            Environment: {import.meta.env.MODE}
          </p>
        </div>
      </div>
    </div>
  )
}