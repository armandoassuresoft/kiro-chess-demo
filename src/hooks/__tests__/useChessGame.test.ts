import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useChessGame } from '../useChessGame';
import type { Square } from '../../engine/types';

// Helper function to make a move (select piece, then select destination)
function makeMove(
  result: { current: ReturnType<typeof useChessGame> },
  from: Square,
  to: Square
) {
  act(() => {
    result.current.selectSquare(from);
  });
  act(() => {
    result.current.selectSquare(to);
  });
}

describe('useChessGame', () => {
  describe('Initial State', () => {
    it('starts with white to move', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.gameState.currentPlayer).toBe('white');
    });

    it('starts with no selected square', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.selectedSquare).toBeNull();
    });

    it('starts with no legal moves displayed', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.legalMoves).toHaveLength(0);
    });

    it('starts with no pending promotion', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.pendingPromotion).toBeNull();
    });

    it('starts with active game status', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.gameStatus.type).toBe('active');
    });

    it('starts with no king in check', () => {
      const { result } = renderHook(() => useChessGame());
      expect(result.current.kingInCheck).toBeNull();
    });
  });

  describe('Piece Selection', () => {
    it('selects a piece when clicking on current player piece', () => {
      const { result } = renderHook(() => useChessGame());
      const e2: Square = { file: 'e', rank: 2 };

      act(() => {
        result.current.selectSquare(e2);
      });

      expect(result.current.selectedSquare).toEqual(e2);
    });

    it('shows legal moves when a piece is selected', () => {
      const { result } = renderHook(() => useChessGame());
      const e2: Square = { file: 'e', rank: 2 };

      act(() => {
        result.current.selectSquare(e2);
      });

      // e2 pawn can move to e3 and e4
      expect(result.current.legalMoves).toContainEqual({ file: 'e', rank: 3 });
      expect(result.current.legalMoves).toContainEqual({ file: 'e', rank: 4 });
    });

    it('does not select opponent pieces', () => {
      const { result } = renderHook(() => useChessGame());
      const e7: Square = { file: 'e', rank: 7 }; // Black pawn

      act(() => {
        result.current.selectSquare(e7);
      });

      expect(result.current.selectedSquare).toBeNull();
    });

    it('does not select empty squares', () => {
      const { result } = renderHook(() => useChessGame());
      const e4: Square = { file: 'e', rank: 4 }; // Empty square

      act(() => {
        result.current.selectSquare(e4);
      });

      expect(result.current.selectedSquare).toBeNull();
    });

    it('deselects when clicking the same square', () => {
      const { result } = renderHook(() => useChessGame());
      const e2: Square = { file: 'e', rank: 2 };

      act(() => {
        result.current.selectSquare(e2);
      });
      expect(result.current.selectedSquare).toEqual(e2);

      act(() => {
        result.current.selectSquare(e2);
      });
      expect(result.current.selectedSquare).toBeNull();
    });

    it('switches selection when clicking another friendly piece', () => {
      const { result } = renderHook(() => useChessGame());
      const e2: Square = { file: 'e', rank: 2 };
      const d2: Square = { file: 'd', rank: 2 };

      act(() => {
        result.current.selectSquare(e2);
      });
      expect(result.current.selectedSquare).toEqual(e2);

      act(() => {
        result.current.selectSquare(d2);
      });
      expect(result.current.selectedSquare).toEqual(d2);
    });

    it('deselects when clicking an illegal move square', () => {
      const { result } = renderHook(() => useChessGame());
      const e2: Square = { file: 'e', rank: 2 };
      const a5: Square = { file: 'a', rank: 5 }; // Not a legal move for e2 pawn

      act(() => {
        result.current.selectSquare(e2);
      });
      expect(result.current.selectedSquare).toEqual(e2);

      act(() => {
        result.current.selectSquare(a5);
      });
      expect(result.current.selectedSquare).toBeNull();
    });
  });

  describe('Move Execution', () => {
    it('executes a move when clicking a legal move square', () => {
      const { result } = renderHook(() => useChessGame());

      makeMove(result, { file: 'e', rank: 2 }, { file: 'e', rank: 4 });

      // Move should be executed
      expect(result.current.gameState.currentPlayer).toBe('black');
      expect(result.current.selectedSquare).toBeNull();
    });

    it('alternates turns after a move', () => {
      const { result } = renderHook(() => useChessGame());

      // White moves e2-e4
      makeMove(result, { file: 'e', rank: 2 }, { file: 'e', rank: 4 });
      expect(result.current.gameState.currentPlayer).toBe('black');

      // Black moves e7-e5
      makeMove(result, { file: 'e', rank: 7 }, { file: 'e', rank: 5 });
      expect(result.current.gameState.currentPlayer).toBe('white');
    });

    it('clears selection after a move', () => {
      const { result } = renderHook(() => useChessGame());

      makeMove(result, { file: 'e', rank: 2 }, { file: 'e', rank: 4 });

      expect(result.current.selectedSquare).toBeNull();
      expect(result.current.legalMoves).toHaveLength(0);
    });

    it('updates move history after a move', () => {
      const { result } = renderHook(() => useChessGame());

      expect(result.current.gameState.moveHistory).toHaveLength(0);

      makeMove(result, { file: 'e', rank: 2 }, { file: 'e', rank: 4 });

      expect(result.current.gameState.moveHistory).toHaveLength(1);
    });
  });

  describe('Pawn Promotion', () => {
    it('sets pending promotion when pawn reaches back rank', () => {
      const { result } = renderHook(() => useChessGame());

      // Verify initial state
      expect(result.current.gameState.currentPlayer).toBe('white');

      // Play a sequence of moves to get a pawn to promote
      // 1. a4
      makeMove(result, { file: 'a', rank: 2 }, { file: 'a', rank: 4 });
      expect(result.current.gameState.currentPlayer).toBe('black');
      
      // 1... b5
      makeMove(result, { file: 'b', rank: 7 }, { file: 'b', rank: 5 });
      expect(result.current.gameState.currentPlayer).toBe('white');
      
      // 2. axb5
      makeMove(result, { file: 'a', rank: 4 }, { file: 'b', rank: 5 });
      expect(result.current.gameState.currentPlayer).toBe('black');
      
      // 2... a6
      makeMove(result, { file: 'a', rank: 7 }, { file: 'a', rank: 6 });
      expect(result.current.gameState.currentPlayer).toBe('white');
      
      // 3. bxa6
      makeMove(result, { file: 'b', rank: 5 }, { file: 'a', rank: 6 });
      expect(result.current.gameState.currentPlayer).toBe('black');
      
      // 3... Nc6
      makeMove(result, { file: 'b', rank: 8 }, { file: 'c', rank: 6 });
      expect(result.current.gameState.currentPlayer).toBe('white');
      
      // 4. a7
      makeMove(result, { file: 'a', rank: 6 }, { file: 'a', rank: 7 });
      expect(result.current.gameState.currentPlayer).toBe('black');
      
      // 4... Nb8
      makeMove(result, { file: 'c', rank: 6 }, { file: 'b', rank: 8 });
      expect(result.current.gameState.currentPlayer).toBe('white');
      
      // 5. axb8=Q (promotion with capture)
      act(() => {
        result.current.selectSquare({ file: 'a', rank: 7 });
      });
      
      // Verify pawn is selected and can promote
      expect(result.current.selectedSquare).toEqual({ file: 'a', rank: 7 });
      expect(result.current.legalMoves).toContainEqual({ file: 'b', rank: 8 });
      
      act(() => {
        result.current.selectSquare({ file: 'b', rank: 8 });
      });

      // Should have pending promotion
      expect(result.current.pendingPromotion).not.toBeNull();
      expect(result.current.pendingPromotion?.color).toBe('white');
      expect(result.current.pendingPromotion?.to).toEqual({ file: 'b', rank: 8 });
    });

    it('completes promotion when piece is selected', () => {
      const { result } = renderHook(() => useChessGame());

      // Same setup as above
      makeMove(result, { file: 'a', rank: 2 }, { file: 'a', rank: 4 }); // a4
      makeMove(result, { file: 'b', rank: 7 }, { file: 'b', rank: 5 }); // b5
      makeMove(result, { file: 'a', rank: 4 }, { file: 'b', rank: 5 }); // axb5
      makeMove(result, { file: 'a', rank: 7 }, { file: 'a', rank: 6 }); // a6
      makeMove(result, { file: 'b', rank: 5 }, { file: 'a', rank: 6 }); // bxa6
      makeMove(result, { file: 'b', rank: 8 }, { file: 'c', rank: 6 }); // Nc6
      makeMove(result, { file: 'a', rank: 6 }, { file: 'a', rank: 7 }); // a7
      makeMove(result, { file: 'c', rank: 6 }, { file: 'b', rank: 8 }); // Nb8
      
      // Promotion move: axb8
      act(() => {
        result.current.selectSquare({ file: 'a', rank: 7 });
      });
      act(() => {
        result.current.selectSquare({ file: 'b', rank: 8 });
      });

      expect(result.current.pendingPromotion).not.toBeNull();

      // Select queen for promotion
      act(() => {
        result.current.selectPromotion('queen');
      });

      expect(result.current.pendingPromotion).toBeNull();
      expect(result.current.gameState.currentPlayer).toBe('black');
    });
  });

  describe('New Game', () => {
    it('resets to initial position', () => {
      const { result } = renderHook(() => useChessGame());

      // Make some moves
      makeMove(result, { file: 'e', rank: 2 }, { file: 'e', rank: 4 });
      makeMove(result, { file: 'e', rank: 7 }, { file: 'e', rank: 5 });

      expect(result.current.gameState.moveHistory.length).toBeGreaterThan(0);

      // Start new game
      act(() => {
        result.current.newGame();
      });

      expect(result.current.gameState.currentPlayer).toBe('white');
      expect(result.current.gameState.moveHistory).toHaveLength(0);
      expect(result.current.selectedSquare).toBeNull();
    });

    it('clears selection and pending promotion', () => {
      const { result } = renderHook(() => useChessGame());

      act(() => {
        result.current.selectSquare({ file: 'e', rank: 2 });
      });
      expect(result.current.selectedSquare).not.toBeNull();

      act(() => {
        result.current.newGame();
      });

      expect(result.current.selectedSquare).toBeNull();
      expect(result.current.pendingPromotion).toBeNull();
    });
  });

  describe('Undo Move', () => {
    it('reverts to previous state', () => {
      const { result } = renderHook(() => useChessGame());

      // Make a move
      makeMove(result, { file: 'e', rank: 2 }, { file: 'e', rank: 4 });

      expect(result.current.gameState.currentPlayer).toBe('black');
      expect(result.current.gameState.moveHistory).toHaveLength(1);

      // Undo
      act(() => {
        result.current.undoMove();
      });

      expect(result.current.gameState.currentPlayer).toBe('white');
      expect(result.current.gameState.moveHistory).toHaveLength(0);
    });

    it('clears selection after undo', () => {
      const { result } = renderHook(() => useChessGame());

      makeMove(result, { file: 'e', rank: 2 }, { file: 'e', rank: 4 });

      // Select a piece
      act(() => {
        result.current.selectSquare({ file: 'e', rank: 7 });
      });
      expect(result.current.selectedSquare).not.toBeNull();

      // Undo
      act(() => {
        result.current.undoMove();
      });

      expect(result.current.selectedSquare).toBeNull();
    });

    it('can undo multiple moves', () => {
      const { result } = renderHook(() => useChessGame());

      // Make two moves
      makeMove(result, { file: 'e', rank: 2 }, { file: 'e', rank: 4 });
      makeMove(result, { file: 'e', rank: 7 }, { file: 'e', rank: 5 });

      expect(result.current.gameState.moveHistory).toHaveLength(2);

      // Undo twice
      act(() => {
        result.current.undoMove();
      });
      expect(result.current.gameState.moveHistory).toHaveLength(1);

      act(() => {
        result.current.undoMove();
      });
      expect(result.current.gameState.moveHistory).toHaveLength(0);
    });
  });
});
