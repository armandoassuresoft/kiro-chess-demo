import type {
  Color,
  GameState,
  GameStatus,
  Move,
  MoveError,
  MoveRecord,
  Result,
  Square,
  UndoError,
  GameEvent,
  GameEventListener,
  Unsubscribe,
  Piece,
} from './types';
import { INITIAL_BOARD, cloneBoard, getPiece } from './boardUtils';
import { generateLegalMovesForPiece, isLegalMove } from './moveValidator';
import { getGameStatus, isCheck, isCheckmate } from './gameStateChecker';
import {
  executeMove,
  updateCastlingRights,
  calculateEnPassantTarget,
  requiresPromotion,
  isValidPromotion,
} from './moveExecutor';

/**
 * Generate a position hash for threefold repetition detection.
 * The hash includes: board position, current player, castling rights, en passant target.
 * Requirements: 13.5
 */
function generatePositionHash(state: GameState): string {
  const boardStr = state.board
    .map(rank =>
      rank
        .map(piece => (piece ? `${piece.color[0]}${piece.type[0]}` : '--'))
        .join('')
    )
    .join('/');

  const castlingStr = [
    state.castlingRights.whiteKingside ? 'K' : '',
    state.castlingRights.whiteQueenside ? 'Q' : '',
    state.castlingRights.blackKingside ? 'k' : '',
    state.castlingRights.blackQueenside ? 'q' : '',
  ].join('');

  const epStr = state.enPassantTarget
    ? `${state.enPassantTarget.file}${state.enPassantTarget.rank}`
    : '-';

  return `${boardStr}|${state.currentPlayer}|${castlingStr || '-'}|${epStr}`;
}

/**
 * Create the initial game state.
 * Requirements: 2.1, 12.2
 */
function createInitialState(): GameState {
  const state: GameState = {
    board: cloneBoard(INITIAL_BOARD),
    currentPlayer: 'white',
    castlingRights: {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    },
    enPassantTarget: null,
    halfMoveClock: 0,
    fullMoveNumber: 1,
    moveHistory: [],
    positionHistory: [],
  };

  // Add initial position to history
  state.positionHistory.push(generatePositionHash(state));

  return state;
}


/**
 * Deep clone a game state for immutability.
 */
function cloneGameState(state: GameState): GameState {
  return {
    board: cloneBoard(state.board),
    currentPlayer: state.currentPlayer,
    castlingRights: { ...state.castlingRights },
    enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null,
    halfMoveClock: state.halfMoveClock,
    fullMoveNumber: state.fullMoveNumber,
    moveHistory: [...state.moveHistory],
    positionHistory: [...state.positionHistory],
  };
}

/**
 * ChessEngine class - the main orchestrator for the chess game.
 * Manages game state, validates moves, and emits events.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.2, 14.5
 */
export class ChessEngine {
  private state: GameState;
  private listeners: Set<GameEventListener>;

  constructor() {
    this.state = createInitialState();
    this.listeners = new Set();
  }

  /**
   * Get the current game state.
   * Requirements: 14.2
   */
  getState(): GameState {
    return cloneGameState(this.state);
  }

  /**
   * Get the current player.
   * Requirements: 2.1, 2.4
   */
  getCurrentPlayer(): Color {
    return this.state.currentPlayer;
  }

  /**
   * Get the current game status.
   */
  getGameStatus(): GameStatus {
    return getGameStatus(this.state);
  }

  /**
   * Get all legal moves for a piece at a given square.
   * Requirements: 11.4
   */
  getLegalMoves(square: Square): Move[] {
    const status = this.getGameStatus();
    if (status.type !== 'active') {
      return [];
    }
    return generateLegalMovesForPiece(this.state, square);
  }

  /**
   * Make a move on the board.
   * Requirements: 2.2, 2.3, 2.5, 11.1, 11.2, 11.3
   */
  makeMove(move: Move): Result<GameState, MoveError> {
    // Check if game is over
    const status = this.getGameStatus();
    if (status.type !== 'active') {
      return { ok: false, error: { type: 'game-over' } };
    }

    // Get the piece at the source square
    const piece = getPiece(this.state.board, move.from);
    if (!piece) {
      return { ok: false, error: { type: 'no-piece', square: move.from } };
    }

    // Check if it's the correct player's turn
    if (piece.color !== this.state.currentPlayer) {
      return {
        ok: false,
        error: {
          type: 'wrong-color',
          expected: this.state.currentPlayer,
          actual: piece.color,
        },
      };
    }

    // Check if promotion is required but not specified
    if (requiresPromotion(move, piece) && !move.promotion) {
      return {
        ok: false,
        error: { type: 'illegal-move', reason: 'Promotion piece must be specified' },
      };
    }

    // Validate promotion piece
    if (!isValidPromotion(move, piece)) {
      return {
        ok: false,
        error: { type: 'illegal-move', reason: 'Invalid promotion piece' },
      };
    }

    // Check if the move is legal
    if (!isLegalMove(this.state, move)) {
      return {
        ok: false,
        error: { type: 'illegal-move', reason: 'Move is not legal' },
      };
    }

    // Store previous state for undo
    const previousState = cloneGameState(this.state);

    // Execute the move
    const { newBoard, capturedPiece, isEnPassant, isCastling } = executeMove(
      this.state.board,
      move,
      this.state.enPassantTarget
    );

    // Update castling rights
    const newCastlingRights = updateCastlingRights(
      this.state.castlingRights,
      move,
      piece,
      capturedPiece
    );

    // Calculate en passant target for next move
    const newEnPassantTarget = calculateEnPassantTarget(move, piece);

    // Update half-move clock (reset on pawn move or capture)
    const newHalfMoveClock =
      piece.type === 'pawn' || capturedPiece ? 0 : this.state.halfMoveClock + 1;

    // Update full move number (increments after black's move)
    const newFullMoveNumber =
      this.state.currentPlayer === 'black'
        ? this.state.fullMoveNumber + 1
        : this.state.fullMoveNumber;

    // Switch player
    const newCurrentPlayer: Color =
      this.state.currentPlayer === 'white' ? 'black' : 'white';

    // Create new state
    const newState: GameState = {
      board: newBoard,
      currentPlayer: newCurrentPlayer,
      castlingRights: newCastlingRights,
      enPassantTarget: newEnPassantTarget,
      halfMoveClock: newHalfMoveClock,
      fullMoveNumber: newFullMoveNumber,
      moveHistory: [...this.state.moveHistory],
      positionHistory: [...this.state.positionHistory],
    };

    // Check if the move results in check or checkmate
    const isCheckAfterMove = isCheck(newState, newCurrentPlayer);
    const isCheckmateAfterMove = isCheckmate(newState);

    // Create move record
    const moveRecord: MoveRecord = {
      move,
      piece,
      captured: capturedPiece || undefined,
      isCheck: isCheckAfterMove,
      isCheckmate: isCheckmateAfterMove,
      isCastling: isCastling || undefined,
      isEnPassant,
      previousState,
    };

    // Add move to history
    newState.moveHistory.push(moveRecord);

    // Add position hash to history
    newState.positionHistory.push(generatePositionHash(newState));

    // Update state
    this.state = newState;

    // Emit move-made event
    this.emit({ type: 'move-made', move: moveRecord, newState: cloneGameState(this.state) });

    // Check for game over
    const newStatus = this.getGameStatus();
    if (newStatus.type !== 'active') {
      this.emit({ type: 'game-over', status: newStatus });
    }

    return { ok: true, value: cloneGameState(this.state) };
  }


  /**
   * Start a new game, resetting to initial state.
   * Requirements: 12.2
   */
  newGame(): GameState {
    this.state = createInitialState();
    this.emit({ type: 'game-started', state: cloneGameState(this.state) });
    return cloneGameState(this.state);
  }

  /**
   * Undo the last move.
   * Requirements: 12.4, 12.5
   */
  undoMove(): Result<GameState, UndoError> {
    if (this.state.moveHistory.length === 0) {
      return { ok: false, error: { type: 'no-moves-to-undo' } };
    }

    // Get the last move record
    const lastMoveRecord = this.state.moveHistory[this.state.moveHistory.length - 1];

    // Restore the previous state
    this.state = cloneGameState(lastMoveRecord.previousState);

    // Emit move-undone event
    this.emit({ type: 'move-undone', previousState: cloneGameState(this.state) });

    return { ok: true, value: cloneGameState(this.state) };
  }

  /**
   * Check if undo is available.
   * Requirements: 12.5
   */
  canUndo(): boolean {
    return this.state.moveHistory.length > 0;
  }

  /**
   * Subscribe to game events.
   * Requirements: 14.5
   */
  subscribe(listener: GameEventListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit an event to all listeners.
   */
  private emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Serialize the game state to JSON.
   * Requirements: 14.3
   */
  toJSON(): string {
    return JSON.stringify(gameStateToJSON(this.state));
  }

  /**
   * Load game state from JSON.
   * Requirements: 14.3
   */
  fromJSON(json: string): Result<GameState, { type: 'invalid-json'; message: string }> {
    try {
      const parsed = JSON.parse(json);
      const state = gameStateFromJSON(parsed);
      this.state = state;
      this.emit({ type: 'game-started', state: cloneGameState(this.state) });
      return { ok: true, value: cloneGameState(this.state) };
    } catch (e) {
      return {
        ok: false,
        error: {
          type: 'invalid-json',
          message: e instanceof Error ? e.message : 'Unknown error',
        },
      };
    }
  }
}

/**
 * Serializable representation of game state (without circular references).
 */
interface SerializedGameState {
  board: (SerializedPiece | null)[][];
  currentPlayer: Color;
  castlingRights: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  enPassantTarget: { file: string; rank: number } | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  positionHistory: string[];
}

interface SerializedPiece {
  type: string;
  color: Color;
}

/**
 * Convert game state to a serializable format.
 * Requirements: 14.3
 */
export function gameStateToJSON(state: GameState): SerializedGameState {
  return {
    board: state.board.map(rank =>
      rank.map(piece =>
        piece ? { type: piece.type, color: piece.color } : null
      )
    ),
    currentPlayer: state.currentPlayer,
    castlingRights: { ...state.castlingRights },
    enPassantTarget: state.enPassantTarget
      ? { file: state.enPassantTarget.file, rank: state.enPassantTarget.rank }
      : null,
    halfMoveClock: state.halfMoveClock,
    fullMoveNumber: state.fullMoveNumber,
    positionHistory: [...state.positionHistory],
  };
}

/**
 * Convert serialized format back to game state.
 * Requirements: 14.3
 */
export function gameStateFromJSON(json: SerializedGameState): GameState {
  return {
    board: json.board.map(rank =>
      rank.map(piece =>
        piece ? { type: piece.type as Piece['type'], color: piece.color } : null
      )
    ),
    currentPlayer: json.currentPlayer,
    castlingRights: { ...json.castlingRights },
    enPassantTarget: json.enPassantTarget
      ? { file: json.enPassantTarget.file as Square['file'], rank: json.enPassantTarget.rank as Square['rank'] }
      : null,
    halfMoveClock: json.halfMoveClock,
    fullMoveNumber: json.fullMoveNumber,
    moveHistory: [], // Move history is not serialized (contains circular refs)
    positionHistory: [...json.positionHistory],
  };
}

// Export helper functions for testing
export { generatePositionHash, createInitialState, cloneGameState };
