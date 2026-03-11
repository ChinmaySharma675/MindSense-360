import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onSuccess: (score: number, emotionLabel: string) => void;
}

interface AnalysisResult {
  voice_score: number;
  emotion_label: string;
  characteristics: {
    speechPattern: string;
    energyLevel: string;
    consistency: string;
    indication: string;
  };
  analysis: {
    duration: number;
    energy_level: number;
    variance: number;
    peak_count: number;
  };
}

export function VoiceRecorder({ onSuccess }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average level
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255 * 100);
    }
    
    if (isRecording) {
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        await processRecording();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Auto-stop after 15 seconds
          if (prev >= 15) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      // Start audio level animation
      updateAudioLevel();
      
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone access required',
        description: 'Please allow microphone access to record your voice.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clean up timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setAudioLevel(0);
    }
  };

  const processRecording = async () => {
    if (chunksRef.current.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No audio recorded',
        description: 'Please try recording again.',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Create audio blob
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      
      // Convert to audio buffer for analysis
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get audio data as Float32Array
      const audioData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      // Convert to array for JSON serialization
      const audioArray = Array.from(audioData);
      
      console.log(`Sending ${audioArray.length} samples at ${sampleRate}Hz`);
      
      // Send to edge function for analysis
      const { data, error } = await supabase.functions.invoke('analyze-voice', {
        body: {
          audioData: audioArray,
          sampleRate,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Analysis response:', data);

      // Validate response data
      if (!data || typeof data.voice_score !== 'number') {
        throw new Error('Invalid response from analysis service');
      }

      // Handle both old and new response formats
      const analysisData: AnalysisResult = {
        voice_score: data.voice_score,
        emotion_label: data.emotion_label || 'neutral',
        characteristics: data.characteristics || {
          speechPattern: 'Analyzed',
          energyLevel: data.analysis?.energy_level ? 
            (data.analysis.energy_level < 30 ? 'low' : data.analysis.energy_level > 70 ? 'high' : 'normal') : 
            'normal',
          consistency: 'Measured',
          indication: `Stress level: ${Math.round(data.voice_score * 100)}%`
        },
        analysis: data.analysis || {
          duration: 0,
          energy_level: 0,
          variance: 0,
          peak_count: 0
        }
      };

      // Store analysis result
      setAnalysisResult(analysisData);

      // Show success message
      const indication = analysisData.characteristics.indication;
      const emotionLabel = analysisData.emotion_label.replace(/_/g, ' ');
      
      toast({
        title: 'Voice analyzed!',
        description: `${indication} - ${emotionLabel}`,
      });

      onSuccess(data.voice_score, data.emotion_label || 'neutral');
      
      // Clean up audio context
      await audioContext.close();
      
    } catch (error: any) {
      console.error('Error processing voice:', error);
      
      // Determine error message
      let errorMessage = 'Failed to analyze voice recording';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }
      
      toast({
        variant: 'destructive',
        title: 'Analysis failed',
        description: errorMessage,
      });
      
      // Reset state on error
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
      chunksRef.current = [];
    }
  };

  const getEmotionColor = (score: number) => {
    if (score <= 0.30) return 'text-success';
    if (score <= 0.60) return 'text-warning';
    return 'text-destructive';
  };

  const getEmotionIcon = (score: number) => {
    if (score <= 0.30) return '😌';
    if (score <= 0.40) return '😐';
    if (score <= 0.60) return '😟';
    if (score <= 0.80) return '😰';
    return '😱';
  };

  const formatEmotionLabel = (label: string) => {
    return label.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="h-5 w-5 text-primary" />
          Voice Stress Analysis
        </CardTitle>
        <CardDescription>
          Record a 10-15 second voice sample for stress detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording visualization */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className={cn(
            "relative w-24 h-24 rounded-full flex items-center justify-center transition-all",
            isRecording 
              ? "bg-destructive/20 animate-pulse-soft" 
              : "bg-muted"
          )}>
            {isRecording && audioLevel > 20 && (
              <div className="absolute inset-0 rounded-full bg-primary/30 scale-110 transition-transform duration-100 ease-out" />
            )}
            {isAnalyzing ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : isRecording ? (
              <Volume2 className="h-10 w-10 text-destructive" />
            ) : (
              <Mic className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          
          {isRecording && (
            <div className="mt-4 text-center">
              <p className="text-2xl font-mono font-bold text-foreground">
                {recordingTime}s / 15s
              </p>
              <Progress value={(recordingTime / 15) * 100} className="w-48 mt-2" />
            </div>
          )}
          
          {isAnalyzing && (
            <p className="mt-4 text-sm text-muted-foreground">
              Analyzing voice patterns...
            </p>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && !isRecording && !isAnalyzing && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Analysis Results</h3>
              <span className="text-2xl">{getEmotionIcon(analysisResult.voice_score)}</span>
            </div>
            
            <div className="space-y-3">
              {/* Emotion State */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Emotional State:</span>
                <span className={cn("font-bold text-base", getEmotionColor(analysisResult.voice_score))}>
                  {formatEmotionLabel(analysisResult.emotion_label || 'neutral')}
                </span>
              </div>
              
              {/* Stress Level */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Stress Level:</span>
                  <span className={cn("font-semibold", getEmotionColor(analysisResult.voice_score))}>
                    {Math.round(analysisResult.voice_score * 100)}%
                  </span>
                </div>
                <Progress 
                  value={analysisResult.voice_score * 100} 
                  className="h-2"
                />
              </div>

              {/* Characteristics */}
              {analysisResult.characteristics && (
                <div className="pt-2 border-t space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Speech Pattern</p>
                      <p className="font-medium">{analysisResult.characteristics.speechPattern || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Consistency</p>
                      <p className="font-medium">{analysisResult.characteristics.consistency || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-xs">Indication</p>
                    <p className="font-medium text-sm">{analysisResult.characteristics.indication || 'Analysis complete'}</p>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              {analysisResult.analysis && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 space-y-1 pl-2 border-l-2">
                    <p>Duration: {analysisResult.analysis.duration || 0}s</p>
                    <p>Energy Level: {analysisResult.analysis.energy_level || 0}/100</p>
                    {analysisResult.analysis.variance !== undefined && (
                      <p>Variance: {analysisResult.analysis.variance}%</p>
                    )}
                    {analysisResult.analysis.peak_count !== undefined && (
                      <p>Peak Count: {analysisResult.analysis.peak_count}</p>
                    )}
                  </div>
                </details>
              )}
            </div>

            <Button 
              onClick={() => setAnalysisResult(null)} 
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              Record Again
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!isRecording && !isAnalyzing && !analysisResult && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>📝 <strong>Tips for best results:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Speak naturally about your day</li>
              <li>Find a quiet environment</li>
              <li>Record for 10-15 seconds</li>
            </ul>
          </div>
        )}

        {/* Action button */}
        {!analysisResult && (isRecording ? (
          <Button 
            onClick={stopRecording} 
            variant="destructive" 
            className="w-full"
            disabled={isAnalyzing}
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        ) : (
          <Button 
            onClick={startRecording} 
            className="w-full"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        ))}

        {/* Privacy note */}
        <p className="text-xs text-muted-foreground text-center">
          🔒 Your voice is analyzed locally and never stored. Only the stress score is saved.
        </p>
      </CardContent>
    </Card>
  );
}