import {
  generateKingMoves,
  generateKnightMoves,
  generateRookMoves,
  generateBishopMoves,
  generateQueenMoves,
  generatePawnMoves,
  generatePieceMoves,
  generateAllPseudoLegalMoves,
} from '../moveGenerator';
import { setPiece, INITIAL_BOARD } from '../boardUtils';
import type { Board, Square, Piece, Move } from '../types';

// Helper to create an empty board
function createEmptyBoard(): Board {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

// Helper to check if a move exists in the moves array
function hasMove(moves: Move[], to: Square): boolean {
  return moves.some(m => m.to.file === to.file && m.to.rank === to.rank);
}

describe('Move Generator', () => {
  describe('generateKingMoves', () => {
    it('should generate 8 moves for a king in the center of an empty board', () => {
      const board = createEmptyBoard();
      const kingSquare: Square = { file: 'd', rank: 4 };
      const king: Piece = { type: 'king', color: 'white' };
      const boardWithKing = setPiece(board, kingSquare, king);

      const moves = generateKingMoves(boardWithKing, kingSquare, 'white');

      expect(moves).toHaveLength(8);
      expect(hasMove(moves, { file: 'c', rank: 3 })).toBe(true);
      expect(hasMove(moves, { file: 'd', rank: 3 })).toBe(true);
      expect(hasMove(moves, { file: 'e', rank: 3 })).toBe(true);
      expect(hasMove(moves, { file: 'c', rank: 4 })).toBe(true);
      expect(hasMove(moves, { file: 'e', rank: 4 })).toBe(true);
      expect(hasMove(moves, { file: 'c', rank: 5 })).toBe(true);
      expect(hasMove(moves, { file: 'd', rank: 5 })).toBe(true);
      expect(hasMove(moves, { file: 'e', rank: 5 })).toBe(true);
    });

    it('should generate 3 moves for a king in the corner', () => {
      const board = createEmptyBoard();
      const kingSquare: Square = { file: 'a', rank: 1 };
      const king: Piece = { type: 'king', color: 'white' };
      const boardWithKing = setPiece(board, kingSquare, king);

      const moves = generateKingMoves(boardWithKing, kingSquare, 'white');

      expect(moves).toHaveLength(3);
    });

    it('should not move to squares occupied by friendly pieces', () => {
      const board = createEmptyBoard();
      const kingSquare: Square = { file: 'd', rank: 4 };
      const king: Piece = { type: 'king', color: 'white' };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      let boardWithPieces = setPiece(board, kingSquare, king);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 5 }, pawn);

      const moves = generateKingMoves(boardWithPieces, kingSquare, 'white');

      expect(moves).toHaveLength(7);
      expect(hasMove(moves, { file: 'd', rank: 5 })).toBe(false);
    });

    it('should be able to capture enemy pieces', () => {
      const board = createEmptyBoard();
      const kingSquare: Square = { file: 'd', rank: 4 };
      const king: Piece = { type: 'king', color: 'white' };
      const enemyPawn: Piece = { type: 'pawn', color: 'black' };
      let boardWithPieces = setPiece(board, kingSquare, king);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 5 }, enemyPawn);

      const moves = generateKingMoves(boardWithPieces, kingSquare, 'white');

      expect(moves).toHaveLength(8);
      expect(hasMove(moves, { file: 'd', rank: 5 })).toBe(true);
    });
  });


  describe('generateKnightMoves', () => {
    it('should generate 8 moves for a knight in the center of an empty board', () => {
      const board = createEmptyBoard();
      const knightSquare: Square = { file: 'd', rank: 4 };
      const knight: Piece = { type: 'knight', color: 'white' };
      const boardWithKnight = setPiece(board, knightSquare, knight);

      const moves = generateKnightMoves(boardWithKnight, knightSquare, 'white');

      expect(moves).toHaveLength(8);
      // L-shape moves
      expect(hasMove(moves, { file: 'b', rank: 3 })).toBe(true);
      expect(hasMove(moves, { file: 'b', rank: 5 })).toBe(true);
      expect(hasMove(moves, { file: 'c', rank: 2 })).toBe(true);
      expect(hasMove(moves, { file: 'c', rank: 6 })).toBe(true);
      expect(hasMove(moves, { file: 'e', rank: 2 })).toBe(true);
      expect(hasMove(moves, { file: 'e', rank: 6 })).toBe(true);
      expect(hasMove(moves, { file: 'f', rank: 3 })).toBe(true);
      expect(hasMove(moves, { file: 'f', rank: 5 })).toBe(true);
    });

    it('should generate 2 moves for a knight in the corner', () => {
      const board = createEmptyBoard();
      const knightSquare: Square = { file: 'a', rank: 1 };
      const knight: Piece = { type: 'knight', color: 'white' };
      const boardWithKnight = setPiece(board, knightSquare, knight);

      const moves = generateKnightMoves(boardWithKnight, knightSquare, 'white');

      expect(moves).toHaveLength(2);
    });

    it('should jump over pieces', () => {
      const board = createEmptyBoard();
      const knightSquare: Square = { file: 'd', rank: 4 };
      const knight: Piece = { type: 'knight', color: 'white' };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      let boardWithPieces = setPiece(board, knightSquare, knight);
      // Surround the knight with pawns
      boardWithPieces = setPiece(boardWithPieces, { file: 'c', rank: 4 }, pawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'e', rank: 4 }, pawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 3 }, pawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 5 }, pawn);

      const moves = generateKnightMoves(boardWithPieces, knightSquare, 'white');

      // Knight should still have all 8 L-shape moves
      expect(moves).toHaveLength(8);
    });
  });

  describe('generateRookMoves', () => {
    it('should generate 14 moves for a rook in the center of an empty board', () => {
      const board = createEmptyBoard();
      const rookSquare: Square = { file: 'd', rank: 4 };
      const rook: Piece = { type: 'rook', color: 'white' };
      const boardWithRook = setPiece(board, rookSquare, rook);

      const moves = generateRookMoves(boardWithRook, rookSquare, 'white');

      expect(moves).toHaveLength(14); // 7 horizontal + 7 vertical
    });

    it('should stop at friendly pieces', () => {
      const board = createEmptyBoard();
      const rookSquare: Square = { file: 'd', rank: 4 };
      const rook: Piece = { type: 'rook', color: 'white' };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      let boardWithPieces = setPiece(board, rookSquare, rook);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 6 }, pawn);

      const moves = generateRookMoves(boardWithPieces, rookSquare, 'white');

      expect(hasMove(moves, { file: 'd', rank: 5 })).toBe(true);
      expect(hasMove(moves, { file: 'd', rank: 6 })).toBe(false);
      expect(hasMove(moves, { file: 'd', rank: 7 })).toBe(false);
    });

    it('should capture enemy pieces and stop', () => {
      const board = createEmptyBoard();
      const rookSquare: Square = { file: 'd', rank: 4 };
      const rook: Piece = { type: 'rook', color: 'white' };
      const enemyPawn: Piece = { type: 'pawn', color: 'black' };
      let boardWithPieces = setPiece(board, rookSquare, rook);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 6 }, enemyPawn);

      const moves = generateRookMoves(boardWithPieces, rookSquare, 'white');

      expect(hasMove(moves, { file: 'd', rank: 5 })).toBe(true);
      expect(hasMove(moves, { file: 'd', rank: 6 })).toBe(true); // Can capture
      expect(hasMove(moves, { file: 'd', rank: 7 })).toBe(false); // Blocked after capture
    });
  });

  describe('generateBishopMoves', () => {
    it('should generate 13 moves for a bishop in the center of an empty board', () => {
      const board = createEmptyBoard();
      const bishopSquare: Square = { file: 'd', rank: 4 };
      const bishop: Piece = { type: 'bishop', color: 'white' };
      const boardWithBishop = setPiece(board, bishopSquare, bishop);

      const moves = generateBishopMoves(boardWithBishop, bishopSquare, 'white');

      expect(moves).toHaveLength(13);
    });

    it('should only move diagonally', () => {
      const board = createEmptyBoard();
      const bishopSquare: Square = { file: 'd', rank: 4 };
      const bishop: Piece = { type: 'bishop', color: 'white' };
      const boardWithBishop = setPiece(board, bishopSquare, bishop);

      const moves = generateBishopMoves(boardWithBishop, bishopSquare, 'white');

      // Should not have horizontal or vertical moves
      expect(hasMove(moves, { file: 'd', rank: 5 })).toBe(false);
      expect(hasMove(moves, { file: 'e', rank: 4 })).toBe(false);
      // Should have diagonal moves
      expect(hasMove(moves, { file: 'e', rank: 5 })).toBe(true);
      expect(hasMove(moves, { file: 'c', rank: 3 })).toBe(true);
    });
  });

  describe('generateQueenMoves', () => {
    it('should generate 27 moves for a queen in the center of an empty board', () => {
      const board = createEmptyBoard();
      const queenSquare: Square = { file: 'd', rank: 4 };
      const queen: Piece = { type: 'queen', color: 'white' };
      const boardWithQueen = setPiece(board, queenSquare, queen);

      const moves = generateQueenMoves(boardWithQueen, queenSquare, 'white');

      expect(moves).toHaveLength(27); // 14 rook + 13 bishop
    });

    it('should combine rook and bishop movement', () => {
      const board = createEmptyBoard();
      const queenSquare: Square = { file: 'd', rank: 4 };
      const queen: Piece = { type: 'queen', color: 'white' };
      const boardWithQueen = setPiece(board, queenSquare, queen);

      const moves = generateQueenMoves(boardWithQueen, queenSquare, 'white');

      // Horizontal/vertical (rook-like)
      expect(hasMove(moves, { file: 'd', rank: 5 })).toBe(true);
      expect(hasMove(moves, { file: 'e', rank: 4 })).toBe(true);
      // Diagonal (bishop-like)
      expect(hasMove(moves, { file: 'e', rank: 5 })).toBe(true);
      expect(hasMove(moves, { file: 'c', rank: 3 })).toBe(true);
    });
  });


  describe('generatePawnMoves', () => {
    it('should generate 2 moves for a pawn on starting rank', () => {
      const board = createEmptyBoard();
      const pawnSquare: Square = { file: 'd', rank: 2 };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      const boardWithPawn = setPiece(board, pawnSquare, pawn);

      const moves = generatePawnMoves(boardWithPawn, pawnSquare, 'white');

      expect(moves).toHaveLength(2);
      expect(hasMove(moves, { file: 'd', rank: 3 })).toBe(true);
      expect(hasMove(moves, { file: 'd', rank: 4 })).toBe(true);
    });

    it('should generate 1 move for a pawn not on starting rank', () => {
      const board = createEmptyBoard();
      const pawnSquare: Square = { file: 'd', rank: 3 };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      const boardWithPawn = setPiece(board, pawnSquare, pawn);

      const moves = generatePawnMoves(boardWithPawn, pawnSquare, 'white');

      expect(moves).toHaveLength(1);
      expect(hasMove(moves, { file: 'd', rank: 4 })).toBe(true);
    });

    it('should capture diagonally', () => {
      const board = createEmptyBoard();
      const pawnSquare: Square = { file: 'd', rank: 4 };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      const enemyPawn: Piece = { type: 'pawn', color: 'black' };
      let boardWithPieces = setPiece(board, pawnSquare, pawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'c', rank: 5 }, enemyPawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'e', rank: 5 }, enemyPawn);

      const moves = generatePawnMoves(boardWithPieces, pawnSquare, 'white');

      expect(moves).toHaveLength(3); // 1 forward + 2 captures
      expect(hasMove(moves, { file: 'c', rank: 5 })).toBe(true);
      expect(hasMove(moves, { file: 'e', rank: 5 })).toBe(true);
    });

    it('should not capture friendly pieces diagonally', () => {
      const board = createEmptyBoard();
      const pawnSquare: Square = { file: 'd', rank: 4 };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      const friendlyPawn: Piece = { type: 'pawn', color: 'white' };
      let boardWithPieces = setPiece(board, pawnSquare, pawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'c', rank: 5 }, friendlyPawn);

      const moves = generatePawnMoves(boardWithPieces, pawnSquare, 'white');

      expect(hasMove(moves, { file: 'c', rank: 5 })).toBe(false);
    });

    it('should be blocked by pieces in front', () => {
      const board = createEmptyBoard();
      const pawnSquare: Square = { file: 'd', rank: 2 };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      const blockingPiece: Piece = { type: 'pawn', color: 'black' };
      let boardWithPieces = setPiece(board, pawnSquare, pawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'd', rank: 3 }, blockingPiece);

      const moves = generatePawnMoves(boardWithPieces, pawnSquare, 'white');

      expect(moves).toHaveLength(0);
    });

    it('should generate promotion moves when reaching back rank', () => {
      const board = createEmptyBoard();
      const pawnSquare: Square = { file: 'd', rank: 7 };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      const boardWithPawn = setPiece(board, pawnSquare, pawn);

      const moves = generatePawnMoves(boardWithPawn, pawnSquare, 'white');

      expect(moves).toHaveLength(4); // 4 promotion options
      expect(moves.every(m => m.promotion !== undefined)).toBe(true);
    });

    it('should handle en passant capture', () => {
      const board = createEmptyBoard();
      const pawnSquare: Square = { file: 'd', rank: 5 };
      const pawn: Piece = { type: 'pawn', color: 'white' };
      const enemyPawn: Piece = { type: 'pawn', color: 'black' };
      let boardWithPieces = setPiece(board, pawnSquare, pawn);
      boardWithPieces = setPiece(boardWithPieces, { file: 'e', rank: 5 }, enemyPawn);
      const enPassantTarget: Square = { file: 'e', rank: 6 };

      const moves = generatePawnMoves(boardWithPieces, pawnSquare, 'white', enPassantTarget);

      expect(moves).toHaveLength(2); // 1 forward + 1 en passant
      expect(hasMove(moves, { file: 'e', rank: 6 })).toBe(true);
    });

    it('should move in correct direction for black pawns', () => {
      const board = createEmptyBoard();
      const pawnSquare: Square = { file: 'd', rank: 7 };
      const pawn: Piece = { type: 'pawn', color: 'black' };
      const boardWithPawn = setPiece(board, pawnSquare, pawn);

      const moves = generatePawnMoves(boardWithPawn, pawnSquare, 'black');

      expect(moves).toHaveLength(2);
      expect(hasMove(moves, { file: 'd', rank: 6 })).toBe(true);
      expect(hasMove(moves, { file: 'd', rank: 5 })).toBe(true);
    });
  });

  describe('generatePieceMoves', () => {
    it('should dispatch to correct generator based on piece type', () => {
      const board = createEmptyBoard();
      const square: Square = { file: 'd', rank: 4 };

      const king: Piece = { type: 'king', color: 'white' };
      const kingMoves = generatePieceMoves(setPiece(board, square, king), square, king);
      expect(kingMoves).toHaveLength(8);

      const knight: Piece = { type: 'knight', color: 'white' };
      const knightMoves = generatePieceMoves(setPiece(board, square, knight), square, knight);
      expect(knightMoves).toHaveLength(8);
    });
  });

  describe('generateAllPseudoLegalMoves', () => {
    it('should generate moves for all pieces of a color', () => {
      const moves = generateAllPseudoLegalMoves(INITIAL_BOARD, 'white');

      // White has 20 possible moves at start: 16 pawn moves + 4 knight moves
      expect(moves).toHaveLength(20);
    });

    it('should not generate moves for opponent pieces', () => {
      const moves = generateAllPseudoLegalMoves(INITIAL_BOARD, 'white');

      // All moves should be from ranks 1-2 (white's starting area)
      expect(moves.every(m => m.from.rank <= 2)).toBe(true);
    });
  });
});
