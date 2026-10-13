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
  pattern_name?: string | null;
  line_index?: number | null;
  winning_cells?: WinningCell[];
  winning_numbers?: (number | string)[];
  on_ball?: number | null;
  prize_title?: string | null;
  timestamp?: number;
}

export interface GameLogEntry {
  id: string;
  event_type: 'ball_drawn' | 'bingo_awarded' | 'bingo_tiebreaker';
  order: number;
  timestamp: number;
  ball?: number | null;
  letter?: string | null;
  player_id?: string | null;
  player_name?: string | null;
  card_id?: string | null;
  win_type?: string | null;
  pattern_name?: string | null;
  winning_numbers?: (number | string)[];
  prize_title?: string | null;
  on_ball?: number | null;
  details?: string | null;
}

export interface ContestCandidate {
  player_id: string;
  player_name: string;
  card_id: string;
  win_type: string;
  pattern_name?: string | null;
  line_index?: number | null;
  winning_numbers?: (number | string)[];
  chosen_stone?: number | null;
  stone_picked_at?: number | null;
  prize_title?: string | null;
}

export interface BingoContest {
  id: string;
  ball: number;
  target_prize_id?: string | null;
  target_prize_title?: string | null;
  status: 'window' | 'tiebreaker' | 'resolved';
  duration_seconds: number;
  window_start_time: number;
  window_end_time: number;
  candidates: ContestCandidate[];
  available_stones?: number[];
  winner_player_id?: string | null;
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
  game_log: GameLogEntry[];
  active_contest?: BingoContest | null;
  contest_window_seconds?: number;
}

export interface WSMessage<T = any> {
  type: string;
  payload?: T;
  timestamp?: number;
}
