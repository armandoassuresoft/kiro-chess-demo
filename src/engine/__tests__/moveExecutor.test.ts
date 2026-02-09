import { executeMove, isCapture, getCapturedPiece } from '../moveExecutor';
import { setPiece } from '../boardUtils';
import type { Board, Square, Piece, Move } from '../types';

// Helper to create an empty board
function createEmptyBoard(): Board {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

describe('Move Executor - Capture Mechanics', () => {
  describe('executeMove', () => {
    it('should remove captured piece from destination square', () => {
      const board = createEmptyBoard();
      const whiteRook: Piece = { type: 'rook', color: 'white' };
      const blackPawn: Piece = { type: 'pawn', color: 'black' };
      
      let boardWithPieces = setPiece(board, { file: 'a', rank: 1 }, whiteRook);
      boardWithPieces = setPiece(boardWithPieces, { file: 'a', rank: 5 }, blackPawn);
      
      const move: Move = { from: { file: 'a', rank: 1 }, to: { file: 'a', rank: 5 } };
      const result = executeMove(boardWithPieces, move, null);
      
      // Captured piece should be returned
      expect(result.capturedPiece).toEqual(blackPawn);
      // Capturing piece should be at destination
      expect(result.newBoard[4][0]).toEqual(whiteRook);
      // Source square should be empty
      expect(result.newBoard[0][0]).toBeNull();
    });

    it('should handle en passant capture correctly', () => {
      const board = createEmptyBoard();
      const whitePawn: Piece = { type: 'pawn', color: 'white' };
      const blackPawn: Piece = { type: 'pawn', color: 'black' };
      
      // White pawn on e5, black pawn on d5 (just moved two squares)
      let boardWithPieces = setPiece(board, { file: 'e', rank: 5 }, whitePawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 5 }, blackPawn);
      
      const enPassantTarget: Square = { file: 'd', rank: 6 };
      const move: Move = { from: { file: 'e', rank: 5 }, to: { file: 'd', rank: 6 } };
      
      const result = executeMove(boardWithPieces, move, enPassantTarget);
      
      // Captured pawn should be returned
      expect(result.capturedPiece).toEqual(blackPawn);
      expect(result.isEnPassant).toBe(true);
      // White pawn should be at d6
      expect(result.newBoard[5][3]).toEqual(whitePawn);
      // Black pawn at d5 should be removed
      expect(result.newBoard[4][3]).toBeNull();
      // Source square should be empty
      expect(result.newBoard[4][4]).toBeNull();
    });

    it('should return null capturedPiece for non-capture moves', () => {
      const board = createEmptyBoard();
      const whiteRook: Piece = { type: 'rook', color: 'white' };
      const boardWithRook = setPiece(board, { file: 'a', rank: 1 }, whiteRook);
      
      const move: Move = { from: { file: 'a', rank: 1 }, to: { file: 'a', rank: 5 } };
      const result = executeMove(boardWithRook, move, null);
      
      expect(result.capturedPiece).toBeNull();
      expect(result.isEnPassant).toBe(false);
    });

    it('should handle promotion with capture', () => {
      const board = createEmptyBoard();
      const whitePawn: Piece = { type: 'pawn', color: 'white' };
      const blackRook: Piece = { type: 'rook', color: 'black' };
      
      let boardWithPieces = setPiece(board, { file: 'd', rank: 7 }, whitePawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'e', rank: 8 }, blackRook);
      
      const move: Move = { 
        from: { file: 'd', rank: 7 }, 
        to: { file: 'e', rank: 8 },
        promotion: 'queen'
      };
      const result = executeMove(boardWithPieces, move, null);
      
      // Captured piece should be returned
      expect(result.capturedPiece).toEqual(blackRook);
      // Promoted piece should be at destination
      expect(result.newBoard[7][4]).toEqual({ type: 'queen', color: 'white' });
    });
  });

  describe('isCapture', () => {
    it('should return true for regular captures', () => {
      const board = createEmptyBoard();
      const whiteRook: Piece = { type: 'rook', color: 'white' };
      const blackPawn: Piece = { type: 'pawn', color: 'black' };
      
      let boardWithPieces = setPiece(board, { file: 'a', rank: 1 }, whiteRook);
      boardWithPieces = setPiece(boardWithPieces, { file: 'a', rank: 5 }, blackPawn);
      
      const move: Move = { from: { file: 'a', rank: 1 }, to: { file: 'a', rank: 5 } };
      
      expect(isCapture(boardWithPieces, move, null)).toBe(true);
    });

    it('should return true for en passant captures', () => {
      const board = createEmptyBoard();
      const whitePawn: Piece = { type: 'pawn', color: 'white' };
      const blackPawn: Piece = { type: 'pawn', color: 'black' };
      
      let boardWithPieces = setPiece(board, { file: 'e', rank: 5 }, whitePawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 5 }, blackPawn);
      
      const enPassantTarget: Square = { file: 'd', rank: 6 };
      const move: Move = { from: { file: 'e', rank: 5 }, to: { file: 'd', rank: 6 } };
      
      expect(isCapture(boardWithPieces, move, enPassantTarget)).toBe(true);
    });

    it('should return false for non-capture moves', () => {
      const board = createEmptyBoard();
      const whiteRook: Piece = { type: 'rook', color: 'white' };
      const boardWithRook = setPiece(board, { file: 'a', rank: 1 }, whiteRook);
      
      const move: Move = { from: { file: 'a', rank: 1 }, to: { file: 'a', rank: 5 } };
      
      expect(isCapture(boardWithRook, move, null)).toBe(false);
    });
  });

  describe('getCapturedPiece', () => {
    it('should return the captured piece for regular captures', () => {
      const board = createEmptyBoard();
      const whiteRook: Piece = { type: 'rook', color: 'white' };
      const blackPawn: Piece = { type: 'pawn', color: 'black' };
      
      let boardWithPieces = setPiece(board, { file: 'a', rank: 1 }, whiteRook);
      boardWithPieces = setPiece(boardWithPieces, { file: 'a', rank: 5 }, blackPawn);
      
      const move: Move = { from: { file: 'a', rank: 1 }, to: { file: 'a', rank: 5 } };
      
      expect(getCapturedPiece(boardWithPieces, move, null)).toEqual(blackPawn);
    });

    it('should return the captured pawn for en passant', () => {
      const board = createEmptyBoard();
      const whitePawn: Piece = { type: 'pawn', color: 'white' };
      const blackPawn: Piece = { type: 'pawn', color: 'black' };
      
      let boardWithPieces = setPiece(board, { file: 'e', rank: 5 }, whitePawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 5 }, blackPawn);
      
      const enPassantTarget: Square = { file: 'd', rank: 6 };
      const move: Move = { from: { file: 'e', rank: 5 }, to: { file: 'd', rank: 6 } };
      
      expect(getCapturedPiece(boardWithPieces, move, enPassantTarget)).toEqual(blackPawn);
    });

    it('should return null for non-capture moves', () => {
      const board = createEmptyBoard();
      const whiteRook: Piece = { type: 'rook', color: 'white' };
      const boardWithRook = setPiece(board, { file: 'a', rank: 1 }, whiteRook);
      
      const move: Move = { from: { file: 'a', rank: 1 }, to: { file: 'a', rank: 5 } };
      
      expect(getCapturedPiece(boardWithRook, move, null)).toBeNull();
    });
  });
});
