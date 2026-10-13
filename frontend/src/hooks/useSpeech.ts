import { useCallback, useRef, useEffect } from 'react';

export function useSpeech() {
  const isEnabledRef = useRef<boolean>(true);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Look for Portuguese voice
      const ptVoice = voices.find(v => v.lang.startsWith('pt')) || voices[0];
      if (ptVoice) {
        voiceRef.current = ptVoice;
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !isEnabledRef.current) return;
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
  }, []);

  return { speakText, speakBall, toggleSpeech };
}
