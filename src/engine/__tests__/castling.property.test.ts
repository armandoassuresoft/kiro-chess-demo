import * as fc from 'fast-check';
import { generateCastlingMoves } from '../moveGenerator';
import { executeMove, updateCastlingRights } from '../moveExecutor';
import { setPiece } from '../boardUtils';
import type { Board, CastlingRights, Color, Piece, Move } from '../types';

// Helper to create an empty board
function createEmptyBoard(): Board {
  return Array(8).fill(null).map(() => Array(8).fill(null));
}

// Helper to set up a board with king and rooks in starting positions
function setupCastlingBoard(color: Color): Board {
  let board = createEmptyBoard();
  const backRank = color === 'white' ? 1 : 8;
  
  const king: Piece = { type: 'king', color };
  const rook: Piece = { type: 'rook', color };
  
  board = setPiece(board, { file: 'e', rank: backRank }, king);
  board = setPiece(board, { file: 'a', rank: backRank }, rook);
  board = setPiece(board, { file: 'h', rank: backRank }, rook);
  
  return board;
}

// Full castling rights
function fullCastlingRights(): CastlingRights {
  return {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  };
}

// Arbitrary for color
const colorArb = fc.constantFrom<Color>('white', 'black');

describe('Property Tests: Castling', () => {
  /**
   * Property 12: Castling Availability
   * For any game state where the King and relevant Rook have not moved,
   * no pieces are between them, the King is not in check, and the King
   * does not pass through or land on an attacked square, castling should
   * be in the set of legal moves.
   * 
   * **Validates: Requirements 4.1, 4.2**
   */
  describe('Property 12: Castling Availability', () => {
    it('should allow castling when all conditions are met', () => {
      fc.assert(
        fc.property(colorArb, (color) => {
          const board = setupCastlingBoard(color);
          const castlingRights = fullCastlingRights();
          const backRank = color === 'white' ? 1 : 8;
          
          const moves = generateCastlingMoves(board, color, castlingRights);
          
          // Should have both kingside and queenside castling available
          const kingsideCastle = moves.find(m => 
            m.from.file === 'e' && m.from.rank === backRank &&
            m.to.file === 'g' && m.to.rank === backRank
          );
          const queensideCastle = moves.find(m =>
            m.from.file === 'e' && m.from.rank === backRank &&
            m.to.file === 'c' && m.to.rank === backRank
          );
          
          return kingsideCastle !== undefined && queensideCastle !== undefined;
        }),
        { numRuns: 100 }
      );
    });

    it('should not allow castling when rights are revoked', () => {
      fc.assert(
        fc.property(colorArb, (color) => {
          const board = setupCastlingBoard(color);
          const castlingRights: CastlingRights = {
            whiteKingside: false,
            whiteQueenside: false,
            blackKingside: false,
            blackQueenside: false,
          };
          
          const moves = generateCastlingMoves(board, color, castlingRights);
          
          // Should have no castling moves
          return moves.length === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should not allow castling when pieces are between king and rook', () => {
      fc.assert(
        fc.property(colorArb, (color) => {
          let board = setupCastlingBoard(color);
          const backRank = color === 'white' ? 1 : 8;
          
          // Place a piece between king and kingside rook
          const bishop: Piece = { type: 'bishop', color };
          board = setPiece(board, { file: 'f', rank: backRank }, bishop);
          
          const castlingRights = fullCastlingRights();
          const moves = generateCastlingMoves(board, color, castlingRights);
          
          // Should not have kingside castling
          const kingsideCastle = moves.find(m =>
            m.to.file === 'g' && m.to.rank === backRank
          );
          
          return kingsideCastle === undefined;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Castling Execution
   * For any executed castling move, the King should move two squares toward
   * the Rook, and the Rook should move to the square the King crossed.
   * 
   * **Validates: Requirements 4.3, 4.4**
   */
  describe('Property 13: Castling Execution', () => {
    it('should correctly execute kingside castling', () => {
      fc.assert(
        fc.property(colorArb, (color) => {
          const board = setupCastlingBoard(color);
          const backRank = color === 'white' ? 1 : 8;
          
          const move: Move = {
            from: { file: 'e', rank: backRank },
            to: { file: 'g', rank: backRank }
          };
          
          const result = executeMove(board, move, null);
          
          // King should be on g-file
          const kingSquare = result.newBoard[backRank - 1][6]; // g-file is index 6
          // Rook should be on f-file
          const rookSquare = result.newBoard[backRank - 1][5]; // f-file is index 5
          // Original king position should be empty
          const originalKingSquare = result.newBoard[backRank - 1][4]; // e-file is index 4
          // Original rook position should be empty
          const originalRookSquare = result.newBoard[backRank - 1][7]; // h-file is index 7
          
          return (
            result.isCastling === 'kingside' &&
            kingSquare?.type === 'king' &&
            kingSquare?.color === color &&
            rookSquare?.type === 'rook' &&
            rookSquare?.color === color &&
            originalKingSquare === null &&
            originalRookSquare === null
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly execute queenside castling', () => {
      fc.assert(
        fc.property(colorArb, (color) => {
          const board = setupCastlingBoard(color);
          const backRank = color === 'white' ? 1 : 8;
          
          const move: Move = {
            from: { file: 'e', rank: backRank },
            to: { file: 'c', rank: backRank }
          };
          
          const result = executeMove(board, move, null);
          
          // King should be on c-file
          const kingSquare = result.newBoard[backRank - 1][2]; // c-file is index 2
          // Rook should be on d-file
          const rookSquare = result.newBoard[backRank - 1][3]; // d-file is index 3
          // Original king position should be empty
          const originalKingSquare = result.newBoard[backRank - 1][4]; // e-file is index 4
          // Original rook position should be empty
          const originalRookSquare = result.newBoard[backRank - 1][0]; // a-file is index 0
          
          return (
            result.isCastling === 'queenside' &&
            kingSquare?.type === 'king' &&
            kingSquare?.color === color &&
            rookSquare?.type === 'rook' &&
            rookSquare?.color === color &&
            originalKingSquare === null &&
            originalRookSquare === null
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Castling Rights Revocation
   * For any move of the King or a Rook, the corresponding castling rights
   * should be permanently revoked in the resulting game state.
   * 
   * **Validates: Requirements 4.5**
   */
  describe('Property 14: Castling Rights Revocation', () => {
    it('should revoke both castling rights when king moves', () => {
      fc.assert(
        fc.property(colorArb, (color) => {
          const castlingRights = fullCastlingRights();
          const backRank = color === 'white' ? 1 : 8;
          const king: Piece = { type: 'king', color };
          
          const move: Move = {
            from: { file: 'e', rank: backRank },
            to: { file: 'f', rank: backRank }
          };
          
          const newRights = updateCastlingRights(castlingRights, move, king, null);
          
          if (color === 'white') {
            return newRights.whiteKingside === false && newRights.whiteQueenside === false;
          } else {
            return newRights.blackKingside === false && newRights.blackQueenside === false;
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should revoke kingside castling when kingside rook moves', () => {
      fc.assert(
        fc.property(colorArb, (color) => {
          const castlingRights = fullCastlingRights();
          const backRank = color === 'white' ? 1 : 8;
          const rook: Piece = { type: 'rook', color };
          
          const move: Move = {
            from: { file: 'h', rank: backRank },
            to: { file: 'h', rank: backRank === 1 ? 3 : 6 }
          };
          
          const newRights = updateCastlingRights(castlingRights, move, rook, null);
          
          if (color === 'white') {
            return newRights.whiteKingside === false && newRights.whiteQueenside === true;
          } else {
            return newRights.blackKingside === false && newRights.blackQueenside === true;
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should revoke queenside castling when queenside rook moves', () => {
      fc.assert(
        fc.property(colorArb, (color) => {
          const castlingRights = fullCastlingRights();
          const backRank = color === 'white' ? 1 : 8;
          const rook: Piece = { type: 'rook', color };
          
          const move: Move = {
            from: { file: 'a', rank: backRank },
            to: { file: 'a', rank: backRank === 1 ? 3 : 6 }
          };
          
          const newRights = updateCastlingRights(castlingRights, move, rook, null);
          
          if (color === 'white') {
            return newRights.whiteQueenside === false && newRights.whiteKingside === true;
          } else {
            return newRights.blackQueenside === false && newRights.blackKingside === true;
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should revoke castling rights when rook is captured', () => {
      fc.assert(
        fc.property(colorArb, (color) => {
          const castlingRights = fullCastlingRights();
          const opponentColor = color === 'white' ? 'black' : 'white';
          const backRank = color === 'white' ? 1 : 8;
          const attackingQueen: Piece = { type: 'queen', color: opponentColor };
          const capturedRook: Piece = { type: 'rook', color };
          
          // Opponent captures the kingside rook
          const move: Move = {
            from: { file: 'h', rank: backRank === 1 ? 5 : 4 },
            to: { file: 'h', rank: backRank }
          };
          
          const newRights = updateCastlingRights(castlingRights, move, attackingQueen, capturedRook);
          
          if (color === 'white') {
            return newRights.whiteKingside === false;
          } else {
            return newRights.blackKingside === false;
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
