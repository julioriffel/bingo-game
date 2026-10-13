export interface BingoCell {
  number: number;
  letter: string;
  row: number;
  col: number;
  is_free: boolean;
  marked: boolean;
}

export interface WinningCell {
  row: number;
  col: number;
  number: number;
}

export interface WinningPattern {
  pattern_id: string;
  pattern_type: 'row' | 'col' | 'diag_main' | 'diag_anti' | 'blackout';
  pattern_name?: string;
  line_index?: number;
  winning_cells: WinningCell[];
}

export interface BingoCard {
  id: string;
  grid: BingoCell[][];
  hash: string;
  claimed_patterns?: string[];
  winning_patterns?: WinningPattern[];
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
  pattern_id?: string | null;
  pattern_type?: 'row' | 'col' | 'diag_main' | 'diag_anti' | 'blackout' | null;
  line_index?: number | null;
  winning_cells?: WinningCell[];
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
