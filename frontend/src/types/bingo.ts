export interface BingoCell {
  number: number;
  letter: string;
  row: number;
  col: number;
  is_free: boolean;
  marked: boolean;
}

export interface BingoCard {
  id: string;
  grid: BingoCell[][];
  hash: string;
}

export interface Prize {
  id: string;
  title: string;
  description?: string;
  order: number;
  winner_id?: string | null;
  winner_name?: string | null;
  won_at?: number | null;
}

export interface Player {
  id: string;
  name: string;
  is_host: boolean;
  connected: boolean;
}

export interface WinnerInfo {
  player_id: string;
  player_name: string;
  card_id: string;
  win_type: string;
  drawn_count: number;
  prize_title?: string | null;
  timestamp?: number;
}

export interface PublicRoom {
  code: string;
  name: string;
  host_name: string;
  status: 'lobby' | 'playing' | 'paused' | 'finished';
  win_condition: 'line' | 'blackout' | 'multi_stage';
  player_count: number;
  max_cards: number;
  prizes_count?: number;
  prizes?: Prize[];
}

export interface GameState {
  code: string;
  status: 'lobby' | 'playing' | 'paused' | 'finished';
  stage: 'waiting' | 'line' | 'blackout' | 'completed';
  drawn_balls: number[];
  last_drawn_ball: number | null;
  draw_interval: number;
  draw_mode: 'auto' | 'manual';
  winners: WinnerInfo[];
  prizes: Prize[];
}

export interface WSMessage<T = any> {
  type: string;
  payload?: T;
  timestamp?: number;
}
