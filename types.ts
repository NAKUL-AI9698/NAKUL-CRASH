export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  PAUSED = 'PAUSED'
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  speed?: number;
  type?: 'player' | 'enemy' | 'pickup';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 to 1
  color: string;
  size: number;
}

export interface GameSettings {
  difficulty: 'EASY' | 'HARD';
  musicEnabled: boolean;
}