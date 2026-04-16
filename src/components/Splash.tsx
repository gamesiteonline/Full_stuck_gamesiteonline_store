import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface SplashProps {
  onComplete: () => void;
  key?: string;
}

export default function Splash({ onComplete }: SplashProps) {
  const [text, setText] = useState("");
  const fullText = "GAME SITE ONLINE STORE";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setText(
        fullText
          .split("")
          .map((char, index) => {
            if (index < iteration) {
              return fullText[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("")
      );

      if (iteration >= fullText.length) {
        clearInterval(interval);
        setTimeout(onComplete, 1500);
      }

      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 overflow-hidden"
    >
      {/* Background 3D elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-game-primary/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 270, 180, 90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-game-secondary/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-full border-4 border-game-primary rounded-xl flex items-center justify-center preserve-3d"
            >
              <span className="text-4xl font-bold text-game-primary text-glow">G</span>
            </motion.div>
            <div className="absolute inset-0 border-4 border-game-secondary rounded-xl rotate-45 opacity-50" />
          </div>
        </motion.div>

        <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-white">
          {text.split("").map((char, i) => (
            <motion.span
              key={i}
              className={i < text.length ? "text-game-primary" : "text-white/20"}
              animate={{
                color: i < Math.floor(text.length) ? "#00f2ff" : "#ffffff",
                textShadow: i < Math.floor(text.length) ? "0 0 15px #00f2ff" : "none"
              }}
            >
              {char}
            </motion.span>
          ))}
        </h1>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-1 bg-gradient-to-r from-game-primary via-game-secondary to-game-accent mt-4 rounded-full max-w-xs mx-auto shadow-[0_0_15px_rgba(0,242,255,0.5)]"
        />
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-slate-400 font-medium tracking-widest text-xs uppercase"
        >
          Initializing Systems...
        </motion.p>
      </div>
    </motion.div>
  );
}
