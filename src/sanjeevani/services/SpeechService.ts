/**
 * SpeechService — ports src/services/SpeechService.js (logic unchanged).
 */

type RecognitionLike = any;

const getSpeechRecognition = (): RecognitionLike | null => {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
};

export const startListening = (
  language: string,
  onResult: (interim: string, final: string) => void,
  onEnd: () => void,
  onError: (error: string) => void,
): RecognitionLike | null => {
  const SpeechRecognition = getSpeechRecognition();

  if (!SpeechRecognition) {
    onError("Speech Recognition API is not supported in this browser. Please use Chrome.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    onResult(interimTranscript, finalTranscript);
  };

  recognition.onerror = (event: any) => {
    console.error("Speech recognition error", event.error);
    onError(`Error: ${event.error}`);
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.start();
  return recognition;
};
