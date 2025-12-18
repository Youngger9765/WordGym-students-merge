import { speak, stopSpeech } from '../utils/speechUtils';

export function useSpeech() {
  return {
    speak,
    stopSpeech
  };
}