import type { Board, CastlingRights, Color, Move, Piece, Square } from './types';
import { getPiece, squareToIndex, indexToSquare, isValidIndex } from './boardUtils';
import { isSquareAttacked } from './gameStateChecker';

/**
 * Generate all pseudo-legal moves for a King (ignoring check).
 * King can move exactly one square in any direction.
 * Requirements: 3.1, 3.9
 */
export function generateKingMoves(board: Board, from: Square, color: Color): Move[] {
  const moves: Move[] = [];
  const { rankIndex, fileIndex } = squareToIndex(from);

  // King can move one square in any of 8 directions
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0], [1, 1],
  ];

  for (const [dRank, dFile] of directions) {
    const newRankIndex = rankIndex + dRank;
    const newFileIndex = fileIndex + dFile;

    if (isValidIndex(newRankIndex, newFileIndex)) {
      const targetSquare = indexToSquare(newRankIndex, newFileIndex);
      const targetPiece = getPiece(board, targetSquare);

      // Can move if square is empty or occupied by enemy piece
      if (!targetPiece || targetPiece.color !== color) {
        moves.push({ from, to: targetSquare });
      }
    }
  }

  return moves;
}

/**
 * Generate castling moves for a King.
 * Castling is allowed when:
 * - King and relevant Rook have not moved (tracked by castling rights)
 * - No pieces between King and Rook
 * - King is not in check
 * - King does not pass through or land on an attacked square
 * Requirements: 4.1, 4.2
 */
export function generateCastlingMoves(
  board: Board,
  color: Color,
  castlingRights: CastlingRights
): Move[] {
  const moves: Move[] = [];
  const opponentColor = color === 'white' ? 'black' : 'white';
  const backRank = color === 'white' ? 1 : 8;
  const kingFile = 'e';
  const kingSquare: Square = { file: kingFile, rank: backRank };

  // Check if king is on its starting square
  const king = getPiece(board, kingSquare);
  if (!king || king.type !== 'king' || king.color !== color) {
    return moves;
  }

  // Check if king is currently in check
  if (isSquareAttacked(board, kingSquare, opponentColor)) {
    return moves;
  }

  // Kingside castling
  const canKingside = color === 'white' 
    ? castlingRights.whiteKingside 
    : castlingRights.blackKingside;

  if (canKingside) {
    const fSquare: Square = { file: 'f', rank: backRank };
    const gSquare: Square = { file: 'g', rank: backRank };
    const hSquare: Square = { file: 'h', rank: backRank };

    // Check rook is present
    const rook = getPiece(board, hSquare);
    if (rook && rook.type === 'rook' && rook.color === color) {
      // Check squares between are empty
      const fPiece = getPiece(board, fSquare);
      const gPiece = getPiece(board, gSquare);

      if (!fPiece && !gPiece) {
        // Check king doesn't pass through or land on attacked square
        const fAttacked = isSquareAttacked(board, fSquare, opponentColor);
        const gAttacked = isSquareAttacked(board, gSquare, opponentColor);

        if (!fAttacked && !gAttacked) {
          moves.push({ from: kingSquare, to: gSquare });
        }
      }
    }
  }

  // Queenside castling
  const canQueenside = color === 'white'
    ? castlingRights.whiteQueenside
    : castlingRights.blackQueenside;

  if (canQueenside) {
    const dSquare: Square = { file: 'd', rank: backRank };
    const cSquare: Square = { file: 'c', rank: backRank };
    const bSquare: Square = { file: 'b', rank: backRank };
    const aSquare: Square = { file: 'a', rank: backRank };

    // Check rook is present
    const rook = getPiece(board, aSquare);
    if (rook && rook.type === 'rook' && rook.color === color) {
      // Check squares between are empty (b, c, d)
      const bPiece = getPiece(board, bSquare);
      const cPiece = getPiece(board, cSquare);
      const dPiece = getPiece(board, dSquare);

      if (!bPiece && !cPiece && !dPiece) {
        // Check king doesn't pass through or land on attacked square (d and c)
        const dAttacked = isSquareAttacked(board, dSquare, opponentColor);
        const cAttacked = isSquareAttacked(board, cSquare, opponentColor);

        if (!dAttacked && !cAttacked) {
          moves.push({ from: kingSquare, to: cSquare });
        }
      }
    }
  }

  return moves;
}


/**
 * Generate all pseudo-legal moves for a Knight.
 * Knight moves in an L-shape: two squares in one direction and one square perpendicular.
 * Knights can jump over other pieces.
 * Requirements: 3.5, 3.9
 */
export function generateKnightMoves(board: Board, from: Square, color: Color): Move[] {
  const moves: Move[] = [];
  const { rankIndex, fileIndex } = squareToIndex(from);

  // Knight moves in L-shape: 2 squares in one direction, 1 square perpendicular
  const knightOffsets = [
    [-2, -1], [-2, 1],
    [-1, -2], [-1, 2],
    [1, -2],  [1, 2],
    [2, -1],  [2, 1],
  ];

  for (const [dRank, dFile] of knightOffsets) {
    const newRankIndex = rankIndex + dRank;
    const newFileIndex = fileIndex + dFile;

    if (isValidIndex(newRankIndex, newFileIndex)) {
      const targetSquare = indexToSquare(newRankIndex, newFileIndex);
      const targetPiece = getPiece(board, targetSquare);

      // Can move if square is empty or occupied by enemy piece
      if (!targetPiece || targetPiece.color !== color) {
        moves.push({ from, to: targetSquare });
      }
    }
  }

  return moves;
}


/**
 * Generate moves along a ray (direction) until blocked or edge of board.
 * Used by sliding pieces (Rook, Bishop, Queen).
 * Requirements: 3.8, 3.9
 */
function generateRayMoves(
  board: Board,
  from: Square,
  color: Color,
  dRank: number,
  dFile: number
): Move[] {
  const moves: Move[] = [];
  const { rankIndex, fileIndex } = squareToIndex(from);

  let newRankIndex = rankIndex + dRank;
  let newFileIndex = fileIndex + dFile;

  while (isValidIndex(newRankIndex, newFileIndex)) {
    const targetSquare = indexToSquare(newRankIndex, newFileIndex);
    const targetPiece = getPiece(board, targetSquare);

    if (!targetPiece) {
      // Empty square - can move here and continue
      moves.push({ from, to: targetSquare });
    } else if (targetPiece.color !== color) {
      // Enemy piece - can capture but must stop
      moves.push({ from, to: targetSquare });
      break;
    } else {
      // Friendly piece - blocked, must stop
      break;
    }

    newRankIndex += dRank;
    newFileIndex += dFile;
  }

  return moves;
}

/**
 * Generate all pseudo-legal moves for a Rook.
 * Rook moves any number of squares horizontally or vertically.
 * Requirements: 3.3, 3.8, 3.9
 */
export function generateRookMoves(board: Board, from: Square, color: Color): Move[] {
  const moves: Move[] = [];

  // Rook moves horizontally and vertically
  const directions = [
    [-1, 0], // up
    [1, 0],  // down
    [0, -1], // left
    [0, 1],  // right
  ];

  for (const [dRank, dFile] of directions) {
    moves.push(...generateRayMoves(board, from, color, dRank, dFile));
  }

  return moves;
}

/**
 * Generate all pseudo-legal moves for a Bishop.
 * Bishop moves any number of squares diagonally.
 * Requirements: 3.4, 3.8, 3.9
 */
export function generateBishopMoves(board: Board, from: Square, color: Color): Move[] {
  const moves: Move[] = [];

  // Bishop moves diagonally
  const directions = [
    [-1, -1], // up-left
    [-1, 1],  // up-right
    [1, -1],  // down-left
    [1, 1],   // down-right
  ];

  for (const [dRank, dFile] of directions) {
    moves.push(...generateRayMoves(board, from, color, dRank, dFile));
  }

  return moves;
}

/**
 * Generate all pseudo-legal moves for a Queen.
 * Queen moves any number of squares horizontally, vertically, or diagonally.
 * Requirements: 3.2, 3.8, 3.9
 */
export function generateQueenMoves(board: Board, from: Square, color: Color): Move[] {
  // Queen combines Rook and Bishop movement
  return [
    ...generateRookMoves(board, from, color),
    ...generateBishopMoves(board, from, color),
  ];
}


/**
 * Generate all pseudo-legal moves for a Pawn.
 * Pawn can move one square forward, two squares from starting position,
 * and capture diagonally.
 * Requirements: 3.6, 3.7, 3.9
 */
export function generatePawnMoves(
  board: Board,
  from: Square,
  color: Color,
  enPassantTarget: Square | null = null
): Move[] {
  const moves: Move[] = [];
  const { rankIndex, fileIndex } = squareToIndex(from);

  // Direction depends on color: white moves up (+1 rank), black moves down (-1 rank)
  const direction = color === 'white' ? 1 : -1;
  const startRank = color === 'white' ? 1 : 6; // 0-indexed: rank 2 for white, rank 7 for black
  const promotionRank = color === 'white' ? 7 : 0; // 0-indexed: rank 8 for white, rank 1 for black

  // Single forward move
  const oneForwardRank = rankIndex + direction;
  if (isValidIndex(oneForwardRank, fileIndex)) {
    const oneForwardSquare = indexToSquare(oneForwardRank, fileIndex);
    const pieceAtOneForward = getPiece(board, oneForwardSquare);

    if (!pieceAtOneForward) {
      // Check if this is a promotion move
      if (oneForwardRank === promotionRank) {
        // Add promotion moves for all promotable pieces
        moves.push({ from, to: oneForwardSquare, promotion: 'queen' });
        moves.push({ from, to: oneForwardSquare, promotion: 'rook' });
        moves.push({ from, to: oneForwardSquare, promotion: 'bishop' });
        moves.push({ from, to: oneForwardSquare, promotion: 'knight' });
      } else {
        moves.push({ from, to: oneForwardSquare });
      }

      // Double forward move from starting position
      if (rankIndex === startRank) {
        const twoForwardRank = rankIndex + 2 * direction;
        if (isValidIndex(twoForwardRank, fileIndex)) {
          const twoForwardSquare = indexToSquare(twoForwardRank, fileIndex);
          const pieceAtTwoForward = getPiece(board, twoForwardSquare);

          if (!pieceAtTwoForward) {
            moves.push({ from, to: twoForwardSquare });
          }
        }
      }
    }
  }

  // Diagonal captures
  const captureOffsets = [-1, 1]; // left and right
  for (const dFile of captureOffsets) {
    const captureRank = rankIndex + direction;
    const captureFile = fileIndex + dFile;

    if (isValidIndex(captureRank, captureFile)) {
      const captureSquare = indexToSquare(captureRank, captureFile);
      const pieceAtCapture = getPiece(board, captureSquare);

      // Regular capture
      if (pieceAtCapture && pieceAtCapture.color !== color) {
        if (captureRank === promotionRank) {
          // Promotion capture
          moves.push({ from, to: captureSquare, promotion: 'queen' });
          moves.push({ from, to: captureSquare, promotion: 'rook' });
          moves.push({ from, to: captureSquare, promotion: 'bishop' });
          moves.push({ from, to: captureSquare, promotion: 'knight' });
        } else {
          moves.push({ from, to: captureSquare });
        }
      }

      // En passant capture
      if (
        enPassantTarget &&
        captureSquare.file === enPassantTarget.file &&
        captureSquare.rank === enPassantTarget.rank
      ) {
        moves.push({ from, to: captureSquare });
      }
    }
  }

  return moves;
}


/**
 * Generate all pseudo-legal moves for a piece at a given square.
 * This is a convenience function that dispatches to the appropriate piece-specific generator.
 * All move generators already implement friendly piece blocking (Requirement 3.9).
 */
export function generatePieceMoves(
  board: Board,
  from: Square,
  piece: Piece,
  enPassantTarget: Square | null = null
): Move[] {
  const { type, color } = piece;

  switch (type) {
    case 'king':
      return generateKingMoves(board, from, color);
    case 'queen':
      return generateQueenMoves(board, from, color);
    case 'rook':
      return generateRookMoves(board, from, color);
    case 'bishop':
      return generateBishopMoves(board, from, color);
    case 'knight':
      return generateKnightMoves(board, from, color);
    case 'pawn':
      return generatePawnMoves(board, from, color, enPassantTarget);
    default:
      return [];
  }
}

/**
 * Generate all pseudo-legal moves for a player.
 * These are moves that follow piece movement rules but may leave the king in check.
 */
export function generateAllPseudoLegalMoves(
  board: Board,
  color: Color,
  enPassantTarget: Square | null = null
): Move[] {
  const moves: Move[] = [];

  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
      const piece = board[rankIndex][fileIndex];
      if (piece && piece.color === color) {
        const square = indexToSquare(rankIndex, fileIndex);
        moves.push(...generatePieceMoves(board, square, piece, enPassantTarget));
      }
    }
  }

  return moves;
}
