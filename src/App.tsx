import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Power, Globe, Sparkles, MessageCircleCode } from "lucide-react";
import { LiveSession, SessionState } from "./lib/live-session";

export default function App() {
  const [state, setState] = useState<SessionState>("DISCONNECTED");
  const sessionRef = useRef<LiveSession | null>(null);

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      sessionRef.current = new LiveSession(apiKey, (newState) => {
        setState(newState);
      });
    }

    return () => {
      sessionRef.current?.disconnect();
    };
  }, []);

  const toggleSession = () => {
    if (state === "DISCONNECTED") {
      sessionRef.current?.connect();
    } else {
      sessionRef.current?.disconnect();
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case "CONNECTING": return "text-yellow-400 shadow-yellow-500/50";
      case "CONNECTED": return "text-green-400 shadow-green-500/50";
      case "LISTENING": return "text-blue-400 shadow-blue-500/50";
      case "SPEAKING": return "text-pink-400 shadow-pink-500/50";
      default: return "text-gray-500 shadow-gray-500/50";
    }
  };

  const getStatusText = () => {
    switch (state) {
      case "CONNECTING": return "Connecting to Zoya...";
      case "CONNECTED": return "Zoya is here.";
      case "LISTENING": return "Zoya is listening...";
      case "SPEAKING": return "Zoya is talking...";
      default: return "Zoya is sleeping.";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-1000 opacity-20 ${
          state === "SPEAKING" ? "bg-pink-500" : 
          state === "LISTENING" ? "bg-blue-500" : 
          state === "CONNECTED" ? "bg-green-500" : "bg-purple-900"
        }`} />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-12 flex flex-col items-center gap-2"
      >
        <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          ZOYA
        </h1>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-medium">
          Advanced AI Persona
        </p>
      </motion.div>

      {/* Main Interaction Area */}
      <div className="relative flex flex-col items-center justify-center gap-12">
        
        {/* Visualizer / Core */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {state !== "DISCONNECTED" && (
              <>
                {/* Outer Rings */}
                <motion.div
                  key="ring-1"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 0.1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute inset-0 border border-white rounded-full"
                />
                <motion.div
                  key="ring-2"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.05 }}
                  exit={{ scale: 1, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: 1 }}
                  className="absolute inset-0 border border-white rounded-full"
                />
              </>
            )}
          </AnimatePresence>

          {/* Central Core */}
          <motion.button
            onClick={toggleSession}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative z-10 w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
              state === "DISCONNECTED" ? "bg-gray-900 border border-gray-800" : "bg-black border-2 border-white/20"
            }`}
          >
            <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
              state === "SPEAKING" ? "bg-pink-500/30" : 
              state === "LISTENING" ? "bg-blue-500/30" : 
              state === "CONNECTED" ? "bg-green-500/30" : "bg-transparent"
            }`} />
            
            {state === "DISCONNECTED" ? (
              <Power className="w-16 h-16 text-gray-600" />
            ) : (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: state === "SPEAKING" ? [20, 60, 20] : 
                              state === "LISTENING" ? [10, 30, 10] : [5, 10, 5]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5 + i * 0.1,
                      ease: "easeInOut"
                    }}
                    className={`w-1.5 rounded-full ${
                      state === "SPEAKING" ? "bg-pink-500" : 
                      state === "LISTENING" ? "bg-blue-500" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.button>
        </div>

        {/* Status Text */}
        <motion.div 
          key={state}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2"
        >
          <span className={`text-sm font-medium tracking-widest uppercase ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest">
              <Mic className="w-3 h-3" />
              <span>Voice Live</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest">
              <Globe className="w-3 h-3" />
              <span>Web Tools</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className="absolute bottom-8 text-[10px] text-gray-600 uppercase tracking-[0.4em] text-center max-w-xs leading-relaxed"
      >
        Zoya is a witty AI persona. Conversations are real-time and voice-only.
      </motion.div>

      {/* Action Indicators */}
      <div className="absolute bottom-24 flex gap-8">
        <motion.div 
          animate={state === "SPEAKING" ? { scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-2"
        >
          <Sparkles className={`w-5 h-5 ${state === "SPEAKING" ? "text-pink-500" : "text-gray-800"}`} />
        </motion.div>
        <motion.div 
          animate={state === "LISTENING" ? { scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-2"
        >
          <MessageCircleCode className={`w-5 h-5 ${state === "LISTENING" ? "text-blue-500" : "text-gray-800"}`} />
        </motion.div>
      </div>
    </div>
  );
}
