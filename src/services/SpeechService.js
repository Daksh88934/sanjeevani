export const startListening = (language, onResult, onEnd, onError) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    onError('Speech Recognition API is not supported in this browser. Please use Chrome.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = language; // e.g., 'hi-IN', 'ta-IN', 'en-US'
  recognition.continuous = true; // Key fix: prevents it from stopping on brief pauses
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    onResult(interimTranscript, finalTranscript);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
    onError(`Error: ${event.error}`);
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.start();
  return recognition;
};
