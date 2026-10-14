import { useCallback, useRef, useEffect } from 'react';

export function useSpeech(initialEnabled: boolean = true) {
  const isEnabledRef = useRef<boolean>(initialEnabled);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    isEnabledRef.current = initialEnabled;
    if (!initialEnabled && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }, [initialEnabled]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        // Look for Portuguese voice
        const ptVoice = voices.find(v => v.lang.startsWith('pt')) || voices[0];
        if (ptVoice) {
          voiceRef.current = ptVoice;
        }
      } catch {}
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if (!isEnabledRef.current) return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, []);

  const speakBall = useCallback((ball: number, letter: string) => {
    speakText(`Letra ${letter}, ${ball}. ${letter} ${ball}`);
  }, [speakText]);

  const toggleSpeech = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
    if (!enabled && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }, []);

  return { speakText, speakBall, toggleSpeech, cancelSpeech };
}
