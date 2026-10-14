import { useCallback, useRef, useEffect } from 'react';

export function useAudio(soundEnabled: boolean = true) {
  const isEnabledRef = useRef<boolean>(soundEnabled);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    isEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // 1. Stamp / Click Sound
  const playStamp = useCallback(() => {
    if (!isEnabledRef.current) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);

      // Haptic feedback if supported and sound is enabled
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch {
      // AudioContext policy fallback
    }
  }, [getAudioContext]);

  // 2. Ball Drop Sound
  const playBallDrop = useCallback(() => {
    if (!isEnabledRef.current) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [getAudioContext]);

  // 3. Victory Fanfare
  const playVictory = useCallback(() => {
    if (!isEnabledRef.current) return;
    try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });

      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    } catch {}
  }, [getAudioContext]);

  // 4. Subtle Thud Error
  const playError = useCallback(() => {
    if (!isEnabledRef.current) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [getAudioContext]);

  return { playStamp, playBallDrop, playVictory, playError, setSoundEnabled };
}
