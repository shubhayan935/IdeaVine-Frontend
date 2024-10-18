// useSpeechRecognition.js
import { useState, useEffect, useRef } from "react";

function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setHasRecognitionSupport(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const result = event.results[lastResultIndex][0].transcript;
        setTranscript(result);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    } else {
      setHasRecognitionSupport(false);
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
  };
}

export default useSpeechRecognition;
