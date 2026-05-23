import * as React from "react";

// Loose Web Speech API typings
type SR = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export type VoiceCapture = {
  supported: boolean;
  listening: boolean;
  transcript: string;
  audioBlob: Blob | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
};

export function useVoiceCapture(): VoiceCapture {
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const recogRef = React.useRef<SR | null>(null);
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const finalRef = React.useRef("");

  const supported = !!getSpeechRecognition();

  const stop = React.useCallback(async () => {
    try { recogRef.current?.stop(); } catch { /* noop */ }
    try { mediaRef.current?.stop(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setListening(false);
  }, []);

  const start = React.useCallback(async () => {
    finalRef.current = "";
    setTranscript("");
    setAudioBlob(null);
    chunksRef.current = [];

    // MediaRecorder for raw audio
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setAudioBlob(blob);
      };
      mr.start();
    } catch (err) {
      console.warn("Microphone unavailable", err);
    }

    // Web Speech for live transcript
    const Ctor = getSpeechRecognition();
    if (Ctor) {
      const r = new Ctor();
      r.continuous = true;
      r.interimResults = true;
      r.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
      r.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finalRef.current += res[0].transcript;
          else interim += res[0].transcript;
        }
        setTranscript((finalRef.current + " " + interim).trim());
      };
      r.onerror = () => { /* swallow */ };
      r.onend = () => { /* handled by stop() */ };
      recogRef.current = r;
      try { r.start(); } catch { /* noop */ }
    }

    setListening(true);
  }, []);

  const reset = React.useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setAudioBlob(null);
  }, []);

  React.useEffect(() => () => { void stop(); }, [stop]);

  return { supported, listening, transcript, audioBlob, start, stop, reset };
}