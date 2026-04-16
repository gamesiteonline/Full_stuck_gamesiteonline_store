import { Game, Platform, Emulator, Guide } from "./types";
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
    id: `${platform}-${startId + index}`,
    title: item.title,
    platform: platform,
    rating: item.rating || 4.5,
    downloads: item.downloads || '1M',
    size: item.size,
    image: item.cover || item.image,
    description: item.description || `Experience the classic ${item.title} on ${platform}. High-quality graphics and smooth gameplay.`,
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
export const EMULATORS: Emulator[] = [...emulatorData, ...getStoredEmulators()];

export const PRO_TIPS = [
  { category: "Performance", title: "Enable Vulkan", text: "In PPSSPP and RPCS3, Vulkan usually provides 20-30% better performance than OpenGL on modern GPUs." },
  { category: "Performance", title: "Shader Pre-compilation", text: "Always enable shader pre-compilation to avoid stuttering during gameplay in modern emulators." },
  { category: "Storage", title: "Use CHD Format", text: "Convert your PS1 and PS2 ISOs to CHD format to save up to 50% storage space without losing quality." },
  { category: "Graphics", title: "Upscaling", text: "Most emulators allow 2x or 3x internal resolution. This makes old games look like modern HD remasters." },
  { category: "Controls", title: "Bluetooth Latency", text: "If using a wireless controller, ensure your PC's Bluetooth drivers are updated to minimize input lag." },
  { category: "System", title: "BIOS Files", text: "Keep your BIOS files in a dedicated folder. Most emulators require them for high compatibility." },
  { category: "Performance", title: "Close Background Apps", text: "Browsers like Chrome can eat up RAM needed for heavy emulators like RPCS3 or Xenia." },
  { category: "Save States", title: "Multiple Slots", text: "Always use multiple save state slots. One corrupted save could lose hours of progress." },
  { category: "Network", title: "Wired Connection", text: "For Netplay or downloading large ROMs, a wired Ethernet connection is always superior to Wi-Fi." },
  { category: "Battery", title: "Power Settings", text: "On laptops, ensure your power plan is set to 'High Performance' while gaming." },
  { category: "Audio", title: "Latency Settings", text: "If audio crackles, try increasing the audio buffer size in the emulator settings." },
  { category: "Mobile", title: "Thermal Throttling", text: "Gaming on mobile for long periods causes heat. Use a phone cooler for consistent FPS." },
  { category: "PC", title: "GPU Drivers", text: "Keep your NVIDIA/AMD drivers updated. Emulator developers often optimize for the latest versions." },
  { category: "Nintendo", title: "Firmware Keys", text: "Switch emulators like Ryujinx require 'prod.keys'. Ensure you dump them from your own console." },
  { category: "Xbox", title: "Xenia Canary", text: "For Xbox 360, the 'Canary' build often has experimental fixes that improve many games." },
  { category: "PS3", title: "RPCS3 Patches", text: "Check the 'Manage Patches' menu in RPCS3 to enable 60FPS mods for many 30FPS locked games." },
  { category: "General", title: "Read the Wiki", text: "Almost every major emulator has a compatibility wiki. Check it before reporting bugs." },
  { category: "Safety", title: "Verified Sources", text: "Only download ROMs from trusted sources to avoid malware and corrupted files." },
  { category: "Display", title: "Integer Scaling", text: "Use integer scaling for pixel art games to keep them looking sharp on high-res monitors." },
  { category: "Retro", title: "CRT Shaders", text: "Enable CRT shaders (like Scanlines) to give old games that authentic retro arcade feel." },
  { category: "Performance", title: "Threaded Optimization", text: "Enable Threaded Optimization in NVIDIA Control Panel for a significant boost in emulator performance." },
  { category: "Storage", title: "Compressed ROMs", text: "Many emulators support .zip or .7z files directly. Keep your library compressed to save space." },
  { category: "Controls", title: "Deadzone Tuning", text: "If your character moves on their own, increase the 'Analog Deadzone' in your controller settings." },
  { category: "Graphics", title: "Anisotropic Filtering", text: "Force 16x Anisotropic Filtering for much clearer textures at a distance with almost no performance hit." },
  { category: "System", title: "DirectX vs Vulkan", text: "On older Windows systems, DirectX 11 might be more stable, but Vulkan is the future for performance." },
  { category: "Save States", title: "Auto-Save", text: "Enable 'Save State on Exit' so you can resume exactly where you left off every time." },
  { category: "Audio", title: "DSP Plugins", text: "Some emulators support DSP plugins to simulate the unique sound chips of old hardware." },
  { category: "Mobile", title: "Touch Controls", text: "Customize your touch layout to put buttons where your fingers naturally rest for better comfort." },
  { category: "PC", title: "Overclocking", text: "Slightly overclocking your CPU can help with demanding emulators like RPCS3 or Yuzu." },
  { category: "Nintendo", title: "Motion Controls", text: "Use your phone as a motion controller for Switch or Wii games using specialized apps." },
  { category: "Xbox", title: "XMP Profiles", text: "Ensure your RAM is running at its rated speed (XMP/DOCP) for better CPU-bound emulator performance." },
  { category: "PS2", title: "PCSX2 Nightly", text: "Always use the Nightly builds of PCSX2 for the latest features and best game compatibility." },
  { category: "General", title: "Controller Profiles", text: "Create different controller profiles for different genres (e.g., Fighting vs. Racing)." },
  { category: "Safety", title: "Checksums", text: "Use MD5 or SHA1 checksums to verify your ROMs are 'Redump' or 'No-Intro' certified." },
  { category: "Display", title: "Refresh Rate", text: "Match your monitor's refresh rate to the console's native rate (e.g., 60Hz for NTSC) to avoid judter." },
  { category: "Retro", title: "Save Battery", text: "For real hardware, remember that internal save batteries eventually die. Back up your saves!" }
];

export const OFFICIAL_PRODUCTS = [
  { 
    name: "Emulator Guide App", 
    url: "https://gamesite-online.youware.app", 
    description: "Full emulator guides, ￥zRj4fMLrLXyC￥",
    icon: "Globe"
  },
  { 
    name: "Online Game Play", 
    url: "https://gamesiteonline1.pythonanywhere.com", 
    description: "Play your favorite games online instantly.",
    icon: "Zap"
  }
];

export const APP_THEMES = [
  { name: "Cyber Neon", primary: "#00f2ff", secondary: "#7000ff", accent: "#ff00c8", type: "neon", bg: "bg-slate-950" },
  { name: "Deep Sea", primary: "#3b82f6", secondary: "#1e3a8a", accent: "#60a5fa", type: "dark", bg: "bg-slate-950" },
  { name: "Emerald City", primary: "#10b981", secondary: "#064e3b", accent: "#34d399", type: "dark", bg: "bg-slate-950" },
  { name: "Sunset Blaze", primary: "#f59e0b", secondary: "#7c2d12", accent: "#fbbf24", type: "dark", bg: "bg-slate-950" },
  { name: "Royal Purple", primary: "#a855f7", secondary: "#4c1d95", accent: "#c084fc", type: "dark", bg: "bg-slate-950" },
  { name: "Snow White", primary: "#3b82f6", secondary: "#e2e8f0", accent: "#1e293b", type: "light", bg: "bg-slate-50" },
  { name: "Soft Rose", primary: "#ec4899", secondary: "#fbcfe8", accent: "#9d174d", type: "light", bg: "bg-rose-50" },
  { name: "Midnight Gold", primary: "#fbbf24", secondary: "#1e1b4b", accent: "#fef3c7", type: "dark", bg: "bg-slate-950" },
  { name: "Matrix", primary: "#00ff41", secondary: "#003b00", accent: "#008f11", type: "neon", bg: "bg-black" },
  { name: "Vaporwave", primary: "#ff71ce", secondary: "#01cdfe", accent: "#05ffa1", type: "neon", bg: "bg-[#2d1b4e]" }
];

