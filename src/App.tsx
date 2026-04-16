import { useState } from "react";
import { AnimatePresence } from "motion/react";
import Splash from "./components/Splash";
import Store from "./components/Store";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-game-primary selection:text-slate-950">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <Splash key="splash" onComplete={() => setShowSplash(false)} />
        ) : (
          <Store key="store" />
        )}
      </AnimatePresence>
    </div>
  );
}

