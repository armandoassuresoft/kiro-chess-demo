import * as fc from 'fast-check';
import { generatePawnMoves } from '../moveGenerator';
import { executeMove, requiresPromotion, isValidPromotion } from '../moveExecutor';
import { setPiece } from '../boardUtils';
import type { Board, Color, Piece, Move, File, PromotablePiece } from '../types';

// Helper to create an empty board
function createEmptyBoard(): Board {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

// Arbitrary for color
const colorArb = fc.constantFrom<Color>('white', 'black');

// Arbitrary for file (a-h)
const fileArb = fc.constantFrom<File>('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');

// Arbitrary for promotable pieces
const promotablePieceArb = fc.constantFrom<PromotablePiece>('queen', 'rook', 'bishop', 'knight');

describe('Property Tests: Pawn Promotion', () => {
  /**
   * Property 18: Pawn Promotion Requirement
   * For any pawn move that would place the pawn on the opposite back rank
   * (rank 8 for white, rank 1 for black), the move should require a promotion choice.
   * 
   * **Validates: Requirements 6.1**
   */
  describe('Property 18: Pawn Promotion Requirement', () => {
    it('should require promotion when pawn reaches back rank', () => {
      fc.assert(
        fc.property(fileArb, colorArb, (file, color) => {
          const pawn: Piece = { type: 'pawn', color };
          const prePromotionRank = color === 'white' ? 7 : 2;
          const promotionRank = color === 'white' ? 8 : 1;
          
          const move: Move = {
            from: { file, rank: prePromotionRank },
            to: { file, rank: promotionRank }
          };
          
          return requiresPromotion(move, pawn) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should not require promotion for non-back-rank moves', () => {
      fc.assert(
        fc.property(fileArb, colorArb, (file, color) => {
          const pawn: Piece = { type: 'pawn', color };
          // Move in the middle of the board
          const fromRank = color === 'white' ? 4 : 5;
          const toRank = color === 'white' ? 5 : 4;
          
          const move: Move = {
            from: { file, rank: fromRank },
            to: { file, rank: toRank }
          };
          
          return requiresPromotion(move, pawn) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should not require promotion for non-pawn pieces', () => {
      fc.assert(
        fc.property(fileArb, (file) => {
          const queen: Piece = { type: 'queen', color: 'white' };
          
          // Queen moving to back rank
          const move: Move = {
            from: { file, rank: 7 },
            to: { file, rank: 8 }
          };
          
          return requiresPromotion(move, queen) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should generate only promotion moves when pawn can reach back rank', () => {
      fc.assert(
        fc.property(fileArb, colorArb, (file, color) => {
          let board = createEmptyBoard();
          const pawn: Piece = { type: 'pawn', color };
          const prePromotionRank = color === 'white' ? 7 : 2;
          
          board = setPiece(board, { file, rank: prePromotionRank }, pawn);
          
          const moves = generatePawnMoves(board, { file, rank: prePromotionRank }, color, null);
          
          // All forward moves should be promotion moves
          const forwardMoves = moves.filter(m => m.to.file === file);
          
          return (
            forwardMoves.length === 4 && // 4 promotion options
            forwardMoves.every(m => m.promotion !== undefined) &&
            forwardMoves.some(m => m.promotion === 'queen') &&
            forwardMoves.some(m => m.promotion === 'rook') &&
            forwardMoves.some(m => m.promotion === 'bishop') &&
            forwardMoves.some(m => m.promotion === 'knight')
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 19: Pawn Promotion Execution
   * For any pawn promotion, after execution the pawn should be replaced
   * by the chosen piece (Queen, Rook, Bishop, or Knight) of the same color.
   * 
   * **Validates: Requirements 6.3**
   */
  describe('Property 19: Pawn Promotion Execution', () => {
    it('should replace pawn with chosen piece on promotion', () => {
      fc.assert(
        fc.property(fileArb, colorArb, promotablePieceArb, (file, color, promotionPiece) => {
          let board = createEmptyBoard();
          const pawn: Piece = { type: 'pawn', color };
          const prePromotionRank = color === 'white' ? 7 : 2;
          const promotionRank = color === 'white' ? 8 : 1;
          
          board = setPiece(board, { file, rank: prePromotionRank }, pawn);
          
          const move: Move = {
            from: { file, rank: prePromotionRank },
            to: { file, rank: promotionRank },
            promotion: promotionPiece
          };
          
          const result = executeMove(board, move, null);
          
          // Get file index
          const fileIndex = 'abcdefgh'.indexOf(file);
          const promotionRankIndex = promotionRank - 1;
          const originalRankIndex = prePromotionRank - 1;
          
          // Promoted piece should be at destination
          const promotedPiece = result.newBoard[promotionRankIndex][fileIndex];
          // Original position should be empty
          const originalSquare = result.newBoard[originalRankIndex][fileIndex];
          
          return (
            promotedPiece?.type === promotionPiece &&
            promotedPiece?.color === color &&
            originalSquare === null
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should handle promotion with capture', () => {
      fc.assert(
        fc.property(colorArb, promotablePieceArb, (color, promotionPiece) => {
          let board = createEmptyBoard();
          const pawn: Piece = { type: 'pawn', color };
          const enemyRook: Piece = { type: 'rook', color: color === 'white' ? 'black' : 'white' };
          
          const prePromotionRank = color === 'white' ? 7 : 2;
          const promotionRank = color === 'white' ? 8 : 1;
          
          // Pawn on d-file, enemy rook on e-file at back rank
          board = setPiece(board, { file: 'd', rank: prePromotionRank }, pawn);
          board = setPiece(board, { file: 'e', rank: promotionRank }, enemyRook);
          
          const move: Move = {
            from: { file: 'd', rank: prePromotionRank },
            to: { file: 'e', rank: promotionRank },
            promotion: promotionPiece
          };
          
          const result = executeMove(board, move, null);
          
          const promotionRankIndex = promotionRank - 1;
          const originalRankIndex = prePromotionRank - 1;
          
          // Promoted piece should be at destination (e-file, index 4)
          const promotedPiece = result.newBoard[promotionRankIndex][4];
          // Original position should be empty (d-file, index 3)
          const originalSquare = result.newBoard[originalRankIndex][3];
          // Captured piece should be returned
          const captured = result.capturedPiece;
          
          return (
            promotedPiece?.type === promotionPiece &&
            promotedPiece?.color === color &&
            originalSquare === null &&
            captured?.type === 'rook'
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should validate promotion piece selection', () => {
      fc.assert(
        fc.property(fileArb, colorArb, promotablePieceArb, (file, color, promotionPiece) => {
          const pawn: Piece = { type: 'pawn', color };
          const prePromotionRank = color === 'white' ? 7 : 2;
          const promotionRank = color === 'white' ? 8 : 1;
          
          // Valid promotion move
          const validMove: Move = {
            from: { file, rank: prePromotionRank },
            to: { file, rank: promotionRank },
            promotion: promotionPiece
          };
          
          // Invalid promotion move (no promotion piece specified)
          const invalidMove: Move = {
            from: { file, rank: prePromotionRank },
            to: { file, rank: promotionRank }
          };
          
          return (
            isValidPromotion(validMove, pawn) === true &&
            isValidPromotion(invalidMove, pawn) === false
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
