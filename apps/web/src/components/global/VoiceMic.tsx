import { useState, useRef } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceMicProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
  size?: "sm" | "md";
}

declare global {
  interface Window { webkitSpeechRecognition: any; SpeechRecognition: any; }
}

export function VoiceMic({ onTranscript, language = "en-IN", className, size = "md" }: VoiceMicProps) {
  const [recording, setRecording] = useState(false);
  const [supported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recRef = useRef<any>(null);

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = language === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  };

  const stop = () => { recRef.current?.stop(); setRecording(false); };

  if (!supported) return null;

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnSize  = size === "sm" ? "w-7 h-7" : "w-8 h-8";

  return (
    <button type="button" onClick={recording ? stop : start}
      className={cn("flex items-center justify-center rounded-full border transition-all relative", btnSize,
        recording ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse" : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5",
        className)}>
      <AnimatePresence mode="wait">
        {recording ? (
          <motion.span key="stop" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
            <Square className={cn(iconSize, "fill-current")} />
          </motion.span>
        ) : (
          <motion.span key="mic" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
            <Mic className={iconSize} />
          </motion.span>
        )}
      </AnimatePresence>
      {recording && (
        <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-40 pointer-events-none" />
      )}
    </button>
  );
}
