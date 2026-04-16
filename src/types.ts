export type Platform = 'PC' | 'PPSSPP' | 'PS2' | 'PS3' | 'PS4' | 'PS' | 'Xbox' | 'Nintendo';

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
}
