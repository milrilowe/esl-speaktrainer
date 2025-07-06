import { useState, useRef, useCallback } from 'react';

interface RecordingInterfaceProps {
  onRecordingComplete: (audioFile: File) => void;
  isAnalyzing: boolean;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'stopped';

export function RecordingInterface({ 
  onRecordingComplete, 
  isAnalyzing, 
  disabled = false 
}: RecordingInterfaceProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError('');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // Let browser choose
      }
      
      console.log('Using MIME type:', mimeType);
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, 
        mimeType ? { mimeType } : undefined
      );
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data collection
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length === 0) {
          setError('No audio data recorded. Please try again.');
          setRecordingState('idle');
          return;
        }
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorder.mimeType || 'audio/webm'
          });
          
          console.log('Created blob, size:', audioBlob.size, 'type:', audioBlob.type);
          
          if (audioBlob.size === 0) {
            setError('Recording failed - no audio data captured.');
            setRecordingState('idle');
            return;
          }
          
          // Create audio URL for playback
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          console.log('Created audio URL:', url);
          
          // Convert to File object - use proper extension
          const extension = audioBlob.type.includes('mp4') ? '.mp4' : 
                          audioBlob.type.includes('ogg') ? '.ogg' : '.webm';
          
          const audioFile = new File([audioBlob], `recording${extension}`, {
            type: audioBlob.type
          });
          
          onRecordingComplete(audioFile);
          
        } catch (err) {
          console.error('Error processing recording:', err);
          setError('Failed to process recording. Please try again.');
          setRecordingState('idle');
        }
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        setRecordingState('idle');
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start(50); // Collect data every 50ms for better quality
      setRecordingState('recording');
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError('Failed to start recording. Please check your microphone and try again.');
        }
      } else {
        setError('Failed to start recording. Please try again.');
      }
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      // Clear timer immediately
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Check the current state before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      setRecordingState('stopped');
    }
  }, [recordingState]);

  const resetRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Cleanup audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
    }
    
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setRecordingState('idle');
    setRecordingTime(0);
    setError('');
    setIsPlaying(false);
  }, [audioUrl]);

  const playRecording = useCallback(() => {
    if (!audioUrl) {
      setError('No recording available to play');
      return;
    }
    
    console.log('Attempting to play:', audioUrl);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const audio = new Audio();
    audioRef.current = audio;
    
    audio.onplay = () => {
      console.log('Audio started playing');
      setIsPlaying(true);
      setError(''); // Clear any previous errors
    };
    
    audio.onpause = () => {
      console.log('Audio paused');
      setIsPlaying(false);
    };
    
    audio.onended = () => {
      console.log('Audio ended');
      setIsPlaying(false);
    };
    
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      setError('Failed to play recording. The audio format may not be supported.');
    };
    
    audio.oncanplaythrough = () => {
      console.log('Audio can play through');
    };
    
    // Set the source and try to load
    audio.src = audioUrl;
    audio.load();
    
    // Try to play
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error('Play promise rejected:', error);
        setIsPlaying(false);
        setError('Failed to play recording. Try clicking play again.');
      });
    }
  }, [audioUrl]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonContent = () => {
    if (isAnalyzing) {
      return (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Analyzing...
        </div>
      );
    }

    switch (recordingState) {
      case 'idle':
        return (
          <div className="flex items-center justify-center">
            <span className="text-2xl mr-2">🎤</span>
            Start Recording
          </div>
        );
      
      case 'recording':
        return (
          <div className="flex items-center justify-center">
            <span className="text-2xl mr-2 animate-pulse">🔴</span>
            Stop Recording ({formatTime(recordingTime)})
          </div>
        );
      
      case 'stopped':
        return (
          <div className="flex items-center justify-center">
            <span className="text-2xl mr-2">✅</span>
            Ready to Analyze
          </div>
        );
      
      default:
        return 'Start Recording';
    }
  };

  const getButtonClass = () => {
    const baseClass = "w-full py-4 px-6 rounded-lg font-semibold transition-colors text-lg";
    
    if (disabled || isAnalyzing) {
      return `${baseClass} bg-gray-600 text-gray-400 cursor-not-allowed`;
    }

    switch (recordingState) {
      case 'idle':
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
      
      case 'recording':
        return `${baseClass} bg-red-600 text-white hover:bg-red-700`;
      
      case 'stopped':
        return `${baseClass} bg-green-600 text-white hover:bg-green-700`;
      
      default:
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
    }
  };

  const handleButtonClick = () => {
    if (disabled || isAnalyzing) return;

    switch (recordingState) {
      case 'idle':
        startRecording();
        break;
      
      case 'recording':
        stopRecording();
        break;
      
      case 'stopped':
        // Recording is already complete, no action needed
        // The file was already passed to parent via onRecordingComplete
        break;
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleButtonClick}
        disabled={disabled || isAnalyzing}
        className={getButtonClass()}
      >
        {getButtonContent()}
      </button>

      {/* Recording status */}
      {recordingState === 'recording' && (
        <div className="p-3 bg-red-900 border border-red-700 rounded-lg">
          <div className="flex items-center text-red-300">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium">
              Recording... {formatTime(recordingTime)}
            </span>
          </div>
          <div className="text-xs text-red-400 mt-1">
            Speak clearly and click "Stop Recording" when done
          </div>
        </div>
      )}

      {/* Completed recording */}
      {recordingState === 'stopped' && !isAnalyzing && (
        <div className="p-3 bg-green-900 border border-green-700 rounded-lg">
          <div className="flex items-center justify-between text-green-300 mb-3">
            <div className="flex items-center">
              <span className="text-lg mr-2">✅</span>
              <span className="text-sm font-medium">
                Recording complete ({formatTime(recordingTime)})
              </span>
            </div>
            <button
              onClick={resetRecording}
              className="text-xs text-green-400 underline hover:no-underline"
            >
              Record again
            </button>
          </div>
          
          {/* Playback controls */}
          {audioUrl && (
            <div className="flex items-center gap-2 pt-2 border-t border-green-700">
              <button
                onClick={isPlaying ? stopPlayback : playRecording}
                className="flex items-center gap-1 px-3 py-1 bg-green-800 text-green-200 rounded text-xs hover:bg-green-700 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <span>⏸️</span>
                    Stop
                  </>
                ) : (
                  <>
                    <span>▶️</span>
                    Play
                  </>
                )}
              </button>
              <span className="text-xs text-green-400">
                Review your recording
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-900 border border-red-700 rounded-lg">
          <div className="text-red-300 font-medium text-sm mb-1">Recording Error</div>
          <div className="text-red-400 text-xs">{error}</div>
          <button
            onClick={resetRecording}
            className="mt-2 text-xs text-red-300 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-gray-500 text-center">
        💡 Make sure to allow microphone access when prompted
      </div>
    </div>
  );
}