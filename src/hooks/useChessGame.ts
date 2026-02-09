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
import { chessSounds } from '../utils/sounds';

export interface UseChessGameReturn {
  gameState: GameState;
  selectedSquare: Square | null;
  legalMoves: Square[];
  pendingPromotion: PendingPromotion | null;
  gameStatus: GameStatus;
  kingInCheck: Square | null;
  lastMove: { from: Square; to: Square } | null;
  isFlipped: boolean;
  soundEnabled: boolean;

  selectSquare: (square: Square) => void;
  makeMove: (to: Square) => void;
  handleDragMove: (from: Square, to: Square) => void;
  selectPromotion: (pieceType: PromotablePiece) => void;
  newGame: () => void;
  undoMove: () => void;
  flipBoard: () => void;
  toggleSound: () => void;
  navigateMove: (direction: 'first' | 'prev' | 'next' | 'last') => void;
  exportPGN: () => string;
}

function squaresEqual(a: Square | null, b: Square | null): boolean {
  if (a === null || b === null) return a === b;
  return a.file === b.file && a.rank === b.rank;
}

export function useChessGame(): UseChessGameReturn {
  const engineRef = useRef<ChessEngine | null>(null);
  
  if (engineRef.current === null) {
    engineRef.current = new ChessEngine();
  }
  
  const engine = engineRef.current;

  const [gameState, setGameState] = useState<GameState>(() => engine.getState());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const unsubscribe = engine.subscribe(event => {
      switch (event.type) {
        case 'move-made': {
          setGameState(event.newState);
          setSelectedSquare(null);
          setLastMove({ from: event.move.move.from, to: event.move.move.to });
          
          // Play appropriate sound
          if (soundEnabled) {
            if (event.move.isCheckmate) {
              chessSounds.checkmate();
            } else if (event.move.isCheck) {
              chessSounds.check();
            } else if (event.move.isCastling) {
              chessSounds.castle();
            } else if (event.move.move.promotion) {
              chessSounds.promote();
            } else if (event.move.captured) {
              chessSounds.capture();
            } else {
              chessSounds.move();
            }
          }
          break;
        }
        case 'game-started':
          setGameState(event.state);
          setSelectedSquare(null);
          setLastMove(null);
          if (soundEnabled) chessSounds.gameStart();
          break;
        case 'move-undone':
          setGameState(event.previousState);
          setSelectedSquare(null);
          setPendingPromotion(null);
          // Update last move after undo
          const history = event.previousState.moveHistory;
          if (history.length > 0) {
            const lastRecord = history[history.length - 1];
            setLastMove({ from: lastRecord.move.from, to: lastRecord.move.to });
          } else {
            setLastMove(null);
          }
          break;
      }
    });

    return unsubscribe;
  }, [engine, soundEnabled]);

  const gameStatus = useMemo(() => engine.getGameStatus(), [gameState]);

  const kingInCheck = useMemo(() => {
    if (gameStatus.type === 'active' && gameStatus.inCheck) {
      return getKingSquare(gameState.board, gameState.currentPlayer);
    }
    return null;
  }, [gameState, gameStatus]);

  const legalMoves = useMemo(() => {
    if (!selectedSquare || pendingPromotion) {
      return [];
    }
    
    const moves = engine.getLegalMoves(selectedSquare);
    return moves.map(move => move.to);
  }, [selectedSquare, pendingPromotion, engine, gameState]);

  const executeMove = useCallback((from: Square, to: Square) => {
    const currentStatus = engine.getGameStatus();
    if (currentStatus.type !== 'active') return false;

    const currentState = engine.getState();
    const moves = engine.getLegalMoves(from);
    const targetMove = moves.find(m => m.to.file === to.file && m.to.rank === to.rank);

    if (!targetMove) {
      if (soundEnabled) chessSounds.illegal();
      return false;
    }

    // Check for pawn promotion
    const piece = getPiece(currentState.board, from);
    if (piece?.type === 'pawn') {
      const promotionRank = currentState.currentPlayer === 'white' ? 8 : 1;
      if (to.rank === promotionRank) {
        setPendingPromotion({
          from,
          to,
          color: currentState.currentPlayer,
        });
        return true;
      }
    }

    engine.makeMove(targetMove);
    return true;
  }, [engine, soundEnabled]);

  const selectSquare = useCallback((square: Square) => {
    const currentStatus = engine.getGameStatus();
    if (pendingPromotion || currentStatus.type !== 'active') {
      return;
    }

    const currentState = engine.getState();
    const piece = getPiece(currentState.board, square);
    const currentPlayer = currentState.currentPlayer;

    if (!selectedSquare) {
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare(square);
      }
      return;
    }

    if (squaresEqual(selectedSquare, square)) {
      setSelectedSquare(null);
      return;
    }

    // Try to execute move
    const moved = executeMove(selectedSquare, square);
    
    if (!moved && piece && piece.color === currentPlayer) {
      // Switch selection to another piece
      setSelectedSquare(square);
    } else if (!moved) {
      setSelectedSquare(null);
    }
  }, [selectedSquare, pendingPromotion, engine, executeMove]);

  const handleDragMove = useCallback((from: Square, to: Square) => {
    executeMove(from, to);
  }, [executeMove]);

  const makeMove = useCallback((to: Square) => {
    if (!selectedSquare || pendingPromotion) return;
    executeMove(selectedSquare, to);
  }, [selectedSquare, pendingPromotion, executeMove]);

  const selectPromotion = useCallback((pieceType: PromotablePiece) => {
    if (!pendingPromotion) return;

    const move: Move = {
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: pieceType,
    };

    engine.makeMove(move);
    setPendingPromotion(null);
  }, [pendingPromotion, engine]);

  const newGame = useCallback(() => {
    engine.newGame();
    setSelectedSquare(null);
    setPendingPromotion(null);
    setLastMove(null);
  }, [engine]);

  const undoMove = useCallback(() => {
    engine.undoMove();
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [engine]);

  const flipBoard = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      chessSounds.setEnabled(!prev);
      return !prev;
    });
  }, []);

  const navigateMove = useCallback((direction: 'first' | 'prev' | 'next' | 'last') => {
    // For now, just a placeholder - would need view-only state to implement fully
    console.log('Navigate:', direction);
  }, []);

  const exportPGN = useCallback((): string => {
    const history = gameState.moveHistory;
    if (history.length === 0) return '';

    const moves: string[] = [];
    history.forEach((record, idx) => {
      const moveNum = Math.floor(idx / 2) + 1;
      const notation = getMoveNotation(record);
      
      if (idx % 2 === 0) {
        moves.push(`${moveNum}. ${notation}`);
      } else {
        moves[moves.length - 1] += ` ${notation}`;
      }
    });

    let result = '*';
    if (gameStatus.type === 'checkmate') {
      result = gameStatus.winner === 'white' ? '1-0' : '0-1';
    } else if (gameStatus.type === 'draw') {
      result = '1/2-1/2';
    }

    return `[Event "Casual Game"]\n[Date "${new Date().toISOString().split('T')[0]}"]\n[Result "${result}"]\n\n${moves.join(' ')} ${result}`;
  }, [gameState.moveHistory, gameStatus]);

  return {
    gameState,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    gameStatus,
    kingInCheck,
    lastMove,
    isFlipped,
    soundEnabled,
    selectSquare,
    makeMove,
    handleDragMove,
    selectPromotion,
    newGame,
    undoMove,
    flipBoard,
    toggleSound,
    navigateMove,
    exportPGN,
  };
}

function getMoveNotation(record: import('../engine/types').MoveRecord): string {
  const { move, piece, captured, isCheck, isCheckmate, isCastling } = record;

  if (isCastling) {
    const notation = isCastling === 'kingside' ? 'O-O' : 'O-O-O';
    if (isCheckmate) return notation + '#';
    if (isCheck) return notation + '+';
    return notation;
  }

  let notation = '';
  const pieceLetters: Record<string, string> = {
    king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: ''
  };
  
  notation += pieceLetters[piece.type];
  if (piece.type === 'pawn' && captured) {
    notation += move.from.file;
  }
  if (captured) notation += 'x';
  notation += `${move.to.file}${move.to.rank}`;
  if (move.promotion) {
    notation += '=' + pieceLetters[move.promotion];
  }
  if (isCheckmate) notation += '#';
  else if (isCheck) notation += '+';

  return notation;
}

export default useChessGame;
