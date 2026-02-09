import type { Board, CastlingRights, Move, Piece, Square } from './types';
import { getPiece, setPiece, squaresEqual, squareToIndex, indexToSquare } from './boardUtils';

/**
 * Result of executing a move, including the captured piece if any.
 */
export interface MoveExecutionResult {
  newBoard: Board;
  capturedPiece: Piece | null;
  isEnPassant: boolean;
  isCastling: 'kingside' | 'queenside' | null;
}

/**
 * Check if a move is a castling move.
 */
export function isCastlingMove(board: Board, move: Move): 'kingside' | 'queenside' | null {
  const piece = getPiece(board, move.from);
  if (!piece || piece.type !== 'king') {
    return null;
  }

  const { fileIndex: fromFile } = squareToIndex(move.from);
  const { fileIndex: toFile } = squareToIndex(move.to);
  const fileDiff = toFile - fromFile;

  // King moves 2 squares for castling
  if (fileDiff === 2) {
    return 'kingside';
  } else if (fileDiff === -2) {
    return 'queenside';
  }

  return null;
}

/**
 * Execute a castling move on the board.
 * Requirements: 4.3, 4.4
 */
export function executeCastling(
  board: Board,
  move: Move,
  castlingSide: 'kingside' | 'queenside'
): Board {
  const king = getPiece(board, move.from);
  if (!king) {
    return board;
  }

  const backRank = move.from.rank;
  let newBoard = board;

  // Move the king
  newBoard = setPiece(newBoard, move.from, null);
  newBoard = setPiece(newBoard, move.to, king);

  // Move the rook
  if (castlingSide === 'kingside') {
    const rookFrom: Square = { file: 'h', rank: backRank };
    const rookTo: Square = { file: 'f', rank: backRank };
    const rook = getPiece(board, rookFrom);
    if (rook) {
      newBoard = setPiece(newBoard, rookFrom, null);
      newBoard = setPiece(newBoard, rookTo, rook);
    }
  } else {
    const rookFrom: Square = { file: 'a', rank: backRank };
    const rookTo: Square = { file: 'd', rank: backRank };
    const rook = getPiece(board, rookFrom);
    if (rook) {
      newBoard = setPiece(newBoard, rookFrom, null);
      newBoard = setPiece(newBoard, rookTo, rook);
    }
  }

  return newBoard;
}

/**
 * Execute a move on the board and return the result.
 * Handles regular moves, captures, en passant, castling, and promotion.
 * Requirements: 3.10, 4.3, 4.4
 */
export function executeMove(
  board: Board,
  move: Move,
  enPassantTarget: Square | null
): MoveExecutionResult {
  const piece = getPiece(board, move.from);
  if (!piece) {
    return { newBoard: board, capturedPiece: null, isEnPassant: false, isCastling: null };
  }

  // Check for castling
  const castlingSide = isCastlingMove(board, move);
  if (castlingSide) {
    const newBoard = executeCastling(board, move, castlingSide);
    return { newBoard, capturedPiece: null, isEnPassant: false, isCastling: castlingSide };
  }

  let newBoard = board;
  let capturedPiece: Piece | null = null;
  let isEnPassant = false;

  // Check for en passant capture
  if (
    piece.type === 'pawn' &&
    enPassantTarget &&
    squaresEqual(move.to, enPassantTarget)
  ) {
    isEnPassant = true;
    // The captured pawn is on the same file as the destination but on the same rank as the source
    const { rankIndex: fromRank } = squareToIndex(move.from);
    const { fileIndex: destFile } = squareToIndex(move.to);
    const capturedPawnSquare = indexToSquare(fromRank, destFile);
    capturedPiece = getPiece(board, capturedPawnSquare);
    
    // Remove the captured pawn
    newBoard = setPiece(newBoard, capturedPawnSquare, null);
  } else {
    // Regular capture - check if there's a piece at the destination
    capturedPiece = getPiece(board, move.to);
  }

  // Remove piece from source square
  newBoard = setPiece(newBoard, move.from, null);

  // Handle promotion
  const pieceToPlace: Piece = move.promotion
    ? { type: move.promotion, color: piece.color }
    : piece;

  // Place piece on destination square
  newBoard = setPiece(newBoard, move.to, pieceToPlace);

  return { newBoard, capturedPiece, isEnPassant, isCastling: null };
}

/**
 * Check if a move is a capture.
 */
export function isCapture(board: Board, move: Move, enPassantTarget: Square | null): boolean {
  const piece = getPiece(board, move.from);
  if (!piece) return false;

  // Check for en passant
  if (
    piece.type === 'pawn' &&
    enPassantTarget &&
    squaresEqual(move.to, enPassantTarget)
  ) {
    return true;
  }

  // Regular capture
  const targetPiece = getPiece(board, move.to);
  return targetPiece !== null && targetPiece.color !== piece.color;
}

/**
 * Get the captured piece for a move without executing it.
 */
export function getCapturedPiece(
  board: Board,
  move: Move,
  enPassantTarget: Square | null
): Piece | null {
  const piece = getPiece(board, move.from);
  if (!piece) return null;

  // Check for en passant
  if (
    piece.type === 'pawn' &&
    enPassantTarget &&
    squaresEqual(move.to, enPassantTarget)
  ) {
    const { rankIndex: fromRank } = squareToIndex(move.from);
    const { fileIndex: destFile } = squareToIndex(move.to);
    const capturedPawnSquare = indexToSquare(fromRank, destFile);
    return getPiece(board, capturedPawnSquare);
  }

  // Regular capture
  return getPiece(board, move.to);
}


/**
 * Update castling rights after a move.
 * Castling rights are revoked when:
 * - The King moves
 * - A Rook moves from its starting square
 * - A Rook is captured on its starting square
 * Requirements: 4.5
 */
export function updateCastlingRights(
  castlingRights: CastlingRights,
  move: Move,
  piece: Piece,
  capturedPiece: Piece | null
): CastlingRights {
  const newRights = { ...castlingRights };

  // King move revokes both castling rights for that color
  if (piece.type === 'king') {
    if (piece.color === 'white') {
      newRights.whiteKingside = false;
      newRights.whiteQueenside = false;
    } else {
      newRights.blackKingside = false;
      newRights.blackQueenside = false;
    }
  }

  // Rook move from starting square revokes that side's castling
  if (piece.type === 'rook') {
    if (move.from.file === 'a' && move.from.rank === 1) {
      newRights.whiteQueenside = false;
    } else if (move.from.file === 'h' && move.from.rank === 1) {
      newRights.whiteKingside = false;
    } else if (move.from.file === 'a' && move.from.rank === 8) {
      newRights.blackQueenside = false;
    } else if (move.from.file === 'h' && move.from.rank === 8) {
      newRights.blackKingside = false;
    }
  }

  // Rook capture on starting square revokes that side's castling
  if (capturedPiece && capturedPiece.type === 'rook') {
    if (move.to.file === 'a' && move.to.rank === 1) {
      newRights.whiteQueenside = false;
    } else if (move.to.file === 'h' && move.to.rank === 1) {
      newRights.whiteKingside = false;
    } else if (move.to.file === 'a' && move.to.rank === 8) {
      newRights.blackQueenside = false;
    } else if (move.to.file === 'h' && move.to.rank === 8) {
      newRights.blackKingside = false;
    }
  }

  return newRights;
}


/**
 * Calculate the en passant target square after a pawn double move.
 * Returns null if the move is not a pawn double move.
 * Requirements: 5.1
 */
export function calculateEnPassantTarget(
  move: Move,
  piece: Piece
): Square | null {
  // Only pawns can create en passant opportunities
  if (piece.type !== 'pawn') {
    return null;
  }

  const fromRank = move.from.rank;
  const toRank = move.to.rank;
  const rankDiff = Math.abs(toRank - fromRank);

  // Must be a double move (2 squares)
  if (rankDiff !== 2) {
    return null;
  }

  // The en passant target is the square the pawn passed through
  const targetRank = piece.color === 'white' ? 3 : 6;
  
  return {
    file: move.from.file,
    rank: targetRank as 3 | 6
  };
}


/**
 * Check if a pawn move requires promotion.
 * A pawn requires promotion when it reaches the back rank (rank 8 for white, rank 1 for black).
 * Requirements: 6.1
 */
export function requiresPromotion(move: Move, piece: Piece): boolean {
  if (piece.type !== 'pawn') {
    return false;
  }

  const promotionRank = piece.color === 'white' ? 8 : 1;
  return move.to.rank === promotionRank;
}

/**
 * Check if a promotion move is valid (has a valid promotion piece).
 * Requirements: 6.4
 */
export function isValidPromotion(move: Move, piece: Piece): boolean {
  if (!requiresPromotion(move, piece)) {
    return true; // Not a promotion move, so it's valid
  }

  // Must have a promotion piece specified
  if (!move.promotion) {
    return false;
  }

  // Can only promote to queen, rook, bishop, or knight (not king or pawn)
  const validPromotions = ['queen', 'rook', 'bishop', 'knight'];
  return validPromotions.includes(move.promotion);
}
