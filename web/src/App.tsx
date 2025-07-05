import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import PronunciationAnalyzer from './components/PronunciationAnalyzer/PronunciationAnalyzer';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PronunciationAnalyzer />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}