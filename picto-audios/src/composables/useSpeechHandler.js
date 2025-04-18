import { useSpeech } from "./useSpeech";

export function useSpeechHandler() {
  // Always use the native speech synthesis functionality
  return useSpeech();
}
