import { useCallback, useRef, useEffect } from 'react';

export function useSpeech(initialEnabled: boolean = true) {
  const isEnabledRef = useRef<boolean>(initialEnabled);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isSupportedRef = useRef<boolean>(typeof window !== 'undefined' && 'speechSynthesis' in window);

  useEffect(() => {
    isEnabledRef.current = initialEnabled;
    if (!initialEnabled && isSupportedRef.current) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        // Voice synthesizer could not be cancelled; ignore gracefully
      }
    }
  }, [initialEnabled]);

  useEffect(() => {
    if (!isSupportedRef.current) return;

    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        // Look for Portuguese voice
        const ptVoice = voices.find((v) => v.lang.startsWith('pt')) || voices[0];
        if (ptVoice) {
          voiceRef.current = ptVoice;
        }
      } catch (err) {
        // Voice enumeration not permitted or supported in this browser context
        voiceRef.current = null;
      }
    };

    loadVoices();
    try {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } catch (err) {
      // onvoiceschanged event hook unsupported
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if (isSupportedRef.current) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        // Synthesizer cancel error handled safely
      }
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!isEnabledRef.current || !isSupportedRef.current) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          // Playback interrupted or device audio route change handled without crashing UI
        }
      };
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      // Audio subsystem temporarily unavailable; disable speech gracefully
      isEnabledRef.current = false;
    }
  }, []);

  const speakBall = useCallback((ball: number, letter: string) => {
    speakText(`Letra ${letter}, ${ball}. ${letter} ${ball}`);
  }, [speakText]);

  const toggleSpeech = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
    if (!enabled && isSupportedRef.current) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        // Synthesizer cancel on toggle handled safely
      }
    }
  }, []);

  return { speakText, speakBall, toggleSpeech, cancelSpeech };
}
