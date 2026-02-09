import * as fc from 'fast-check';
import { generatePawnMoves } from '../moveGenerator';
import { executeMove, calculateEnPassantTarget } from '../moveExecutor';
import { setPiece } from '../boardUtils';
import type { Board, Color, Piece, Move, File, Square } from '../types';

// Helper to create an empty board
function createEmptyBoard(): Board {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

// Arbitrary for color
const colorArb = fc.constantFrom<Color>('white', 'black');

// Arbitrary for file (a-h)
const fileArb = fc.constantFrom<File>('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');

// Arbitrary for adjacent files (for en passant scenarios)
const adjacentFilesArb = fc.constantFrom<[File, File]>(
  ['a', 'b'], ['b', 'a'], ['b', 'c'], ['c', 'b'], ['c', 'd'], ['d', 'c'],
  ['d', 'e'], ['e', 'd'], ['e', 'f'], ['f', 'e'], ['f', 'g'], ['g', 'f'],
  ['g', 'h'], ['h', 'g']
);

describe('Property Tests: En Passant', () => {
  /**
   * Property 15: En Passant Availability
   * For any pawn that has just moved two squares forward from its starting
   * position, if an enemy pawn is adjacent on the destination rank, en passant
   * capture should be in the set of legal moves for the enemy pawn on the
   * immediately following turn.
   * 
   * **Validates: Requirements 5.1**
   */
  describe('Property 15: En Passant Availability', () => {
    it('should allow en passant capture when conditions are met', () => {
      fc.assert(
        fc.property(adjacentFilesArb, ([attackerFile, targetFile]) => {
          // White pawn on 5th rank, black pawn just moved two squares to adjacent file
          let board = createEmptyBoard();
          const whitePawn: Piece = { type: 'pawn', color: 'white' };
          const blackPawn: Piece = { type: 'pawn', color: 'black' };
          
          // White pawn on 5th rank
          board = setPiece(board, { file: attackerFile, rank: 5 }, whitePawn);
          // Black pawn on 5th rank (just moved from 7th to 5th)
          board = setPiece(board, { file: targetFile, rank: 5 }, blackPawn);
          
          // En passant target is the square the black pawn passed through
          const enPassantTarget: Square = { file: targetFile, rank: 6 };
          
          const moves = generatePawnMoves(board, { file: attackerFile, rank: 5 }, 'white', enPassantTarget);
          
          // Should have en passant capture available
          const enPassantMove = moves.find(m => 
            m.to.file === targetFile && m.to.rank === 6
          );
          
          return enPassantMove !== undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('should allow en passant for black pawns', () => {
      fc.assert(
        fc.property(adjacentFilesArb, ([attackerFile, targetFile]) => {
          // Black pawn on 4th rank, white pawn just moved two squares to adjacent file
          let board = createEmptyBoard();
          const whitePawn: Piece = { type: 'pawn', color: 'white' };
          const blackPawn: Piece = { type: 'pawn', color: 'black' };
          
          // Black pawn on 4th rank
          board = setPiece(board, { file: attackerFile, rank: 4 }, blackPawn);
          // White pawn on 4th rank (just moved from 2nd to 4th)
          board = setPiece(board, { file: targetFile, rank: 4 }, whitePawn);
          
          // En passant target is the square the white pawn passed through
          const enPassantTarget: Square = { file: targetFile, rank: 3 };
          
          const moves = generatePawnMoves(board, { file: attackerFile, rank: 4 }, 'black', enPassantTarget);
          
          // Should have en passant capture available
          const enPassantMove = moves.find(m => 
            m.to.file === targetFile && m.to.rank === 3
          );
          
          return enPassantMove !== undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('should not allow en passant when no target is set', () => {
      fc.assert(
        fc.property(adjacentFilesArb, ([attackerFile, targetFile]) => {
          let board = createEmptyBoard();
          const whitePawn: Piece = { type: 'pawn', color: 'white' };
          const blackPawn: Piece = { type: 'pawn', color: 'black' };
          
          board = setPiece(board, { file: attackerFile, rank: 5 }, whitePawn);
          board = setPiece(board, { file: targetFile, rank: 5 }, blackPawn);
          
          // No en passant target
          const moves = generatePawnMoves(board, { file: attackerFile, rank: 5 }, 'white', null);
          
          // Should not have en passant capture (only forward move)
          const enPassantMove = moves.find(m => 
            m.to.file === targetFile && m.to.rank === 6
          );
          
          return enPassantMove === undefined;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 16: En Passant Execution
   * For any executed en passant capture, the capturing pawn should move
   * diagonally to the square behind the captured pawn, and the captured
   * pawn should be removed from the board.
   * 
   * **Validates: Requirements 5.2**
   */
  describe('Property 16: En Passant Execution', () => {
    it('should correctly execute en passant for white', () => {
      fc.assert(
        fc.property(adjacentFilesArb, ([attackerFile, targetFile]) => {
          let board = createEmptyBoard();
          const whitePawn: Piece = { type: 'pawn', color: 'white' };
          const blackPawn: Piece = { type: 'pawn', color: 'black' };
          
          board = setPiece(board, { file: attackerFile, rank: 5 }, whitePawn);
          board = setPiece(board, { file: targetFile, rank: 5 }, blackPawn);
          
          const enPassantTarget: Square = { file: targetFile, rank: 6 };
          const move: Move = {
            from: { file: attackerFile, rank: 5 },
            to: { file: targetFile, rank: 6 }
          };
          
          const result = executeMove(board, move, enPassantTarget);
          
          // Get file indices
          const attackerFileIndex = 'abcdefgh'.indexOf(attackerFile);
          const targetFileIndex = 'abcdefgh'.indexOf(targetFile);
          
          // Capturing pawn should be at the en passant target square (rank 6)
          const capturingPawn = result.newBoard[5][targetFileIndex];
          // Captured pawn should be removed (was at rank 5)
          const capturedPawnSquare = result.newBoard[4][targetFileIndex];
          // Original position should be empty
          const originalSquare = result.newBoard[4][attackerFileIndex];
          
          return (
            result.isEnPassant === true &&
            result.capturedPiece?.type === 'pawn' &&
            result.capturedPiece?.color === 'black' &&
            capturingPawn?.type === 'pawn' &&
            capturingPawn?.color === 'white' &&
            capturedPawnSquare === null &&
            originalSquare === null
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly execute en passant for black', () => {
      fc.assert(
        fc.property(adjacentFilesArb, ([attackerFile, targetFile]) => {
          let board = createEmptyBoard();
          const whitePawn: Piece = { type: 'pawn', color: 'white' };
          const blackPawn: Piece = { type: 'pawn', color: 'black' };
          
          board = setPiece(board, { file: attackerFile, rank: 4 }, blackPawn);
          board = setPiece(board, { file: targetFile, rank: 4 }, whitePawn);
          
          const enPassantTarget: Square = { file: targetFile, rank: 3 };
          const move: Move = {
            from: { file: attackerFile, rank: 4 },
            to: { file: targetFile, rank: 3 }
          };
          
          const result = executeMove(board, move, enPassantTarget);
          
          // Get file indices
          const attackerFileIndex = 'abcdefgh'.indexOf(attackerFile);
          const targetFileIndex = 'abcdefgh'.indexOf(targetFile);
          
          // Capturing pawn should be at the en passant target square (rank 3)
          const capturingPawn = result.newBoard[2][targetFileIndex];
          // Captured pawn should be removed (was at rank 4)
          const capturedPawnSquare = result.newBoard[3][targetFileIndex];
          // Original position should be empty
          const originalSquare = result.newBoard[3][attackerFileIndex];
          
          return (
            result.isEnPassant === true &&
            result.capturedPiece?.type === 'pawn' &&
            result.capturedPiece?.color === 'white' &&
            capturingPawn?.type === 'pawn' &&
            capturingPawn?.color === 'black' &&
            capturedPawnSquare === null &&
            originalSquare === null
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 17: En Passant Expiration
   * For any en passant opportunity, if not exercised on the immediately
   * following turn, the opportunity should no longer be available in
   * subsequent turns.
   * 
   * **Validates: Requirements 5.3**
   */
  describe('Property 17: En Passant Expiration', () => {
    it('should calculate en passant target only for double pawn moves', () => {
      fc.assert(
        fc.property(fileArb, colorArb, (file, color) => {
          const pawn: Piece = { type: 'pawn', color };
          const startRank = color === 'white' ? 2 : 7;
          const endRank = color === 'white' ? 4 : 5;
          
          // Double move
          const doubleMove: Move = {
            from: { file, rank: startRank },
            to: { file, rank: endRank }
          };
          
          const target = calculateEnPassantTarget(doubleMove, pawn);
          const expectedTargetRank = color === 'white' ? 3 : 6;
          
          return (
            target !== null &&
            target.file === file &&
            target.rank === expectedTargetRank
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should not create en passant target for single pawn moves', () => {
      fc.assert(
        fc.property(fileArb, colorArb, (file, color) => {
          const pawn: Piece = { type: 'pawn', color };
          const startRank = color === 'white' ? 3 : 6;
          const endRank = color === 'white' ? 4 : 5;
          
          // Single move
          const singleMove: Move = {
            from: { file, rank: startRank },
            to: { file, rank: endRank }
          };
          
          const target = calculateEnPassantTarget(singleMove, pawn);
          
          return target === null;
        }),
        { numRuns: 100 }
      );
    });

    it('should not create en passant target for non-pawn moves', () => {
      fc.assert(
        fc.property(fileArb, (file) => {
          const rook: Piece = { type: 'rook', color: 'white' };
          
          // Rook moving two squares
          const rookMove: Move = {
            from: { file, rank: 1 },
            to: { file, rank: 3 }
          };
          
          const target = calculateEnPassantTarget(rookMove, rook);
          
          return target === null;
        }),
        { numRuns: 100 }
      );
    });
  });
});
