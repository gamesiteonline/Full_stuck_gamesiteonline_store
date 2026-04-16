export const SOURCE_CODE: Record<string, string> = {
  "App.tsx": `import { useState } from "react";
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
}`,
  "constants.ts": `import { Game, Platform, Emulator, Guide } from "./types";
import ppssppData from "./data/ppssppgames.json";
import pcData from "./data/pcgames.json";
import psData from "./data/psgames.json";
import ps2Data from "./data/ps2games.json";
import ps3Data from "./data/ps3games.json";
import ps4Data from "./data/ps4games.json";
import xboxData from "./data/xboxgames.json";
import nintendoData from "./data/nintendogames.json";
import emulatorData from "./data/emulators.json";
import guidesData from "./data/guides.json";

export const PLATFORMS: Platform[] = ['PC', 'PPSSPP', 'PS', 'PS2', 'PS3', 'PS4', 'Xbox', 'Nintendo'];

export const GUIDES: Guide[] = guidesData;

const mapToGame = (data: any[], platform: Platform, startId: number): Game[] => {
  return data.map((item, index) => ({
    id: \`\${platform}-\${startId + index}\`,
    title: item.title,
    platform: platform,
    rating: item.rating || 4.5,
    downloads: item.downloads || '1M',
    size: item.size,
    image: item.cover || item.image,
    description: item.description || \`Experience the classic \${item.title} on \${platform}. High-quality graphics and smooth gameplay.\`,
    category: item.category || 'Action',
    downloadUrl: item.link || item.downloadUrl
  }));
};

const baseGames: Game[] = [
  ...mapToGame(pcData, 'PC', 100),
  ...mapToGame(ppssppData, 'PPSSPP', 200),
  ...mapToGame(psData, 'PS', 300),
  ...mapToGame(ps2Data, 'PS2', 400),
  ...mapToGame(ps3Data, 'PS3', 500),
  ...mapToGame(ps4Data, 'PS4', 600),
  ...mapToGame(xboxData, 'Xbox', 700),
  ...mapToGame(nintendoData, 'Nintendo', 800)
];

const getStoredGames = (): Game[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('custom_games');
  return stored ? JSON.parse(stored) : [];
};

const getStoredEmulators = (): Emulator[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('custom_emulators');
  return stored ? JSON.parse(stored) : [];
};

export const GAMES: Game[] = [...baseGames, ...getStoredGames()];
export const EMULATORS: Emulator[] = [...emulatorData, ...getStoredEmulators()];`,
  "types.ts": `export type Platform = 'PC' | 'PPSSPP' | 'PS2' | 'PS3' | 'PS4' | 'PS' | 'Xbox' | 'Nintendo';

export interface Game {
  id: string;
  title: string;
  platform: Platform;
  rating: number;
  downloads: string;
  size: string;
  image: string;
  downloadUrl?: string;
  description: string;
  category: string;
  screenshots?: string[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export interface Emulator {
  id: string;
  name: string;
  platform: string;
  version: string;
  description: string;
  downloadUrl: string;
  icon: string;
  category: string;
}

export interface Guide {
  id: string;
  emulator: string;
  platform: string;
  steps: string[];
  tips: string[];
}`,
  "index.css": `@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

:root {
  --game-primary: #00f2ff;
  --game-secondary: #7000ff;
  --game-accent: #ff00c8;
}

@theme {
  --font-sans: "Outfit", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  
  --color-game-primary: var(--game-primary);
  --color-game-secondary: var(--game-secondary);
  --color-game-accent: var(--game-accent);
}

@layer base {
  body {
    @apply bg-slate-950 text-white overflow-x-hidden;
    font-family: var(--font-sans);
  }
}

@layer utilities {
  .glass {
    @apply bg-white/10 backdrop-blur-xl border border-white/20;
  }
  
  .glass-dark {
    @apply bg-black/40 backdrop-blur-2xl border border-white/10;
  }

  .text-glow {
    text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
  }

  .perspective-1000 {
    perspective: 1000px;
  }

  .preserve-3d {
    transform-style: preserve-3d;
  }

  .backface-hidden {
    backface-visibility: hidden;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}`,
  "package.json": `{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^1.29.0",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "lucide-react": "^0.546.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^6.2.0",
    "express": "^4.21.2",
    "dotenv": "^17.2.3",
    "motion": "^12.23.24"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0",
    "@types/express": "^4.17.21"
  }
}`
};
