import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  GameState,
  GameStatus,
  Square,
  Move,
  PromotablePiece,
  PendingPromotion,
} from '../engine/types';
import { ChessEngine } from '../engine/chessEngine';
import { getPiece, getKingSquare } from '../engine/boardUtils';

/**
 * Return type for the useChessGame hook.
 * Requirements: 1.5, 1.6, 2.1, 2.2, 2.3
 */
export interface UseChessGameReturn {
  gameState: GameState;
  selectedSquare: Square | null;
  legalMoves: Square[];
  pendingPromotion: PendingPromotion | null;
  gameStatus: GameStatus;
  kingInCheck: Square | null;

  selectSquare: (square: Square) => void;
  makeMove: (to: Square) => void;
  selectPromotion: (pieceType: PromotablePiece) => void;
  newGame: () => void;
  undoMove: () => void;
}

/**
 * Compare two squares for equality.
 */
function squaresEqual(a: Square | null, b: Square | null): boolean {
  if (a === null || b === null) return a === b;
  return a.file === b.file && a.rank === b.rank;
}

/**
 * useChessGame hook - bridges UI with the chess engine.
 * Manages piece selection, move execution, and game state.
 * Requirements: 1.5, 1.6, 2.1, 2.2, 2.3
 */
export function useChessGame(): UseChessGameReturn {
  // Use ref to maintain engine instance across renders
  const engineRef = useRef<ChessEngine | null>(null);
  
  // Initialize engine on first render
  if (engineRef.current === null) {
    engineRef.current = new ChessEngine();
  }
  
  const engine = engineRef.current;

  // Game state
  const [gameState, setGameState] = useState<GameState>(() => engine.getState());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  // Subscribe to engine events
  useEffect(() => {
    const unsubscribe = engine.subscribe(event => {
      switch (event.type) {
        case 'move-made':
        case 'game-started':
          setGameState(event.type === 'move-made' ? event.newState : event.state);
          setSelectedSquare(null);
          break;
        case 'move-undone':
          setGameState(event.previousState);
          setSelectedSquare(null);
          setPendingPromotion(null);
          break;
      }
    });

    return unsubscribe;
  }, [engine]);

  // Compute game status
  const gameStatus = useMemo(() => engine.getGameStatus(), [gameState]);

  // Compute king in check square for UI highlighting
  const kingInCheck = useMemo(() => {
    if (gameStatus.type === 'active' && gameStatus.inCheck) {
      return getKingSquare(gameState.board, gameState.currentPlayer);
    }
    return null;
  }, [gameState, gameStatus]);

  // Compute legal moves for selected piece
  const legalMoves = useMemo(() => {
    if (!selectedSquare || pendingPromotion) {
      return [];
    }
    
    const moves = engine.getLegalMoves(selectedSquare);
    return moves.map(move => move.to);
  }, [selectedSquare, pendingPromotion, engine, gameState]);

  /**
   * Handle square selection.
   * - If no piece is selected and clicked square has current player's piece, select it
   * - If a piece is selected and clicked square is a legal move, execute the move
   * - If a piece is selected and clicked square has current player's piece, switch selection
   * - Otherwise, deselect
   * Requirements: 1.5, 1.6
   */
  const selectSquare = useCallback((square: Square) => {
    // Don't allow selection during pending promotion or if game is over
    const currentStatus = engine.getGameStatus();
    if (pendingPromotion || currentStatus.type !== 'active') {
      return;
    }

    // Read current state directly from engine to avoid stale state issues
    const currentState = engine.getState();
    const piece = getPiece(currentState.board, square);
    const currentPlayer = currentState.currentPlayer;

    // If no piece is currently selected
    if (!selectedSquare) {
      // Select if it's the current player's piece
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare(square);
      }
      return;
    }

    // If clicking the same square, deselect
    if (squaresEqual(selectedSquare, square)) {
      setSelectedSquare(null);
      return;
    }

    // Check if the clicked square is a legal move destination
    const moves = engine.getLegalMoves(selectedSquare);
    const targetMove = moves.find(m => m.to.file === square.file && m.to.rank === square.rank);

    if (targetMove) {
      // Check if this is a pawn promotion move
      const selectedPiece = getPiece(currentState.board, selectedSquare);
      if (selectedPiece?.type === 'pawn') {
        const promotionRank = currentPlayer === 'white' ? 8 : 1;
        if (square.rank === promotionRank) {
          // Set pending promotion state
          setPendingPromotion({
            from: selectedSquare,
            to: square,
            color: currentPlayer,
          });
          return;
        }
      }

      // Execute the move
      engine.makeMove(targetMove);
    } else if (piece && piece.color === currentPlayer) {
      // Switch selection to another piece of the same color
      setSelectedSquare(square);
    } else {
      // Deselect
      setSelectedSquare(null);
    }
  }, [selectedSquare, pendingPromotion, engine]);

  /**
   * Execute a move to the target square.
   * This is called when clicking on a legal move destination.
   * Requirements: 2.2, 2.3
   */
  const makeMove = useCallback((to: Square) => {
    const currentStatus = engine.getGameStatus();
    if (!selectedSquare || pendingPromotion || currentStatus.type !== 'active') {
      return;
    }

    const currentState = engine.getState();
    const moves = engine.getLegalMoves(selectedSquare);
    const targetMove = moves.find(m => m.to.file === to.file && m.to.rank === to.rank);

    if (targetMove) {
      // Check if this is a pawn promotion move
      const selectedPiece = getPiece(currentState.board, selectedSquare);
      if (selectedPiece?.type === 'pawn') {
        const promotionRank = currentState.currentPlayer === 'white' ? 8 : 1;
        if (to.rank === promotionRank) {
          setPendingPromotion({
            from: selectedSquare,
            to,
            color: currentState.currentPlayer,
          });
          return;
        }
      }

      engine.makeMove(targetMove);
    }
  }, [selectedSquare, pendingPromotion, engine]);

  /**
   * Handle promotion piece selection.
   * Requirements: 6.2, 6.3
   */
  const selectPromotion = useCallback((pieceType: PromotablePiece) => {
    if (!pendingPromotion) {
      return;
    }

    const move: Move = {
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: pieceType,
    };

    engine.makeMove(move);
    setPendingPromotion(null);
  }, [pendingPromotion, engine]);

  /**
   * Start a new game.
   * Requirements: 12.2
   */
  const newGame = useCallback(() => {
    engine.newGame();
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [engine]);

  /**
   * Undo the last move.
   * Requirements: 12.4, 12.5
   */
  const undoMove = useCallback(() => {
    engine.undoMove();
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [engine]);

  return {
    gameState,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    gameStatus,
    kingInCheck,
    selectSquare,
    makeMove,
    selectPromotion,
    newGame,
    undoMove,
  };
}

export default useChessGame;
