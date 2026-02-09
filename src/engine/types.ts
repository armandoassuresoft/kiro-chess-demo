// Colors
export type Color = 'white' | 'black';

// Piece types
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PromotablePiece = 'queen' | 'rook' | 'bishop' | 'knight';

// Board coordinates
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Square {
  file: File;
  rank: Rank;
}

// Piece representation
export interface Piece {
  type: PieceType;
  color: Color;
}

// Board as 8x8 array (rank-major order)
export type Board = (Piece | null)[][];

// Castling rights
export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

// Game state
export interface GameState {
  board: Board;
  currentPlayer: Color;
  castlingRights: CastlingRights;
  enPassantTarget: Square | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  moveHistory: MoveRecord[];
  positionHistory: string[];
}

// Move representation
export interface Move {
  from: Square;
  to: Square;
  promotion?: PromotablePiece;
}

export interface MoveRecord {
  move: Move;
  piece: Piece;
  captured?: Piece;
  isCheck: boolean;
  isCheckmate: boolean;
  isCastling?: 'kingside' | 'queenside';
  isEnPassant: boolean;
  previousState: GameState;
}

export type MoveType =
  | 'normal'
  | 'capture'
  | 'castling-kingside'
  | 'castling-queenside'
  | 'en-passant'
  | 'promotion'
  | 'promotion-capture';

// Game status
export type DrawReason =
  | 'stalemate'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move-rule';

export type GameStatus =
  | { type: 'active'; inCheck: boolean }
  | { type: 'checkmate'; winner: Color }
  | { type: 'draw'; reason: DrawReason };

// Error types
export type MoveError =
  | { type: 'no-piece'; square: Square }
  | { type: 'wrong-color'; expected: Color; actual: Color }
  | { type: 'illegal-move'; reason: string }
  | { type: 'would-be-in-check' }
  | { type: 'game-over' };

export type UndoError = { type: 'no-moves-to-undo' };

// Result type
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Event types
export type GameEvent =
  | { type: 'move-made'; move: MoveRecord; newState: GameState }
  | { type: 'move-undone'; previousState: GameState }
  | { type: 'game-started'; state: GameState }
  | { type: 'game-over'; status: GameStatus };

export type GameEventListener = (event: GameEvent) => void;
export type Unsubscribe = () => void;

// Pending promotion state
export interface PendingPromotion {
  from: Square;
  to: Square;
  color: Color;
}
