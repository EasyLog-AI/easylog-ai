'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAudioAmplitudeOptions {
  enabled: boolean;
  smoothingFactor?: number;
}

export const useAudioAmplitude = ({
  enabled,
  smoothingFactor = 0.8
}: UseAudioAmplitudeOptions) => {
  const [amplitude, setAmplitude] = useState(0);
  const animationFrameRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const microphoneRef = useRef<MediaStreamAudioSourceNode>();
  const streamRef = useRef<MediaStream>();
  const dataArrayRef = useRef<Uint8Array>();

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setAmplitude(0);
  }, []);

  const startAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = smoothingFactor;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;

      microphone.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      const analyzeAmplitude = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate RMS amplitude
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i] * dataArrayRef.current[i];
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);

        // Normalize to 0-1 range and apply some scaling for better visual effect
        const normalizedAmplitude = Math.min(rms / 128, 1);
        const scaledAmplitude = Math.pow(normalizedAmplitude, 0.5); // Square root for better responsiveness

        setAmplitude(scaledAmplitude);

        animationFrameRef.current = requestAnimationFrame(analyzeAmplitude);
      };

      analyzeAmplitude();
    } catch (error) {
      console.warn('Failed to access microphone for audio analysis:', error);
      setAmplitude(0);
    }
  }, [smoothingFactor]);

  useEffect(() => {
    if (enabled) {
      void startAnalysis();
    } else {
      cleanup();
    }

    return cleanup;
  }, [enabled, startAnalysis, cleanup]);

  return amplitude;
};
