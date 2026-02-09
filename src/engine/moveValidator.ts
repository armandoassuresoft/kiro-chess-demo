import type { Board, Color, GameState, Move, Piece, Square } from './types';
import { getPiece, setPiece, getKingSquare, squaresEqual } from './boardUtils';
import { generatePieceMoves, generateAllPseudoLegalMoves, generateCastlingMoves } from './moveGenerator';
import { isSquareAttacked } from './gameStateChecker';
import { isCastlingMove, executeCastling } from './moveExecutor';

/**
 * Apply a move to the board and return the new board state.
 * This is a simplified version that handles basic moves, captures, and castling.
 * Does not handle en passant yet.
 */
export function applyMoveToBoard(board: Board, move: Move): Board {
  const piece = getPiece(board, move.from);
  if (!piece) {
    return board;
  }

  // Check for castling
  const castlingSide = isCastlingMove(board, move);
  if (castlingSide) {
    return executeCastling(board, move, castlingSide);
  }

  // Remove piece from source square
  let newBoard = setPiece(board, move.from, null);
  
  // Handle promotion
  const pieceToPlace: Piece = move.promotion 
    ? { type: move.promotion, color: piece.color }
    : piece;
  
  // Place piece on destination square (captures are handled implicitly)
  newBoard = setPiece(newBoard, move.to, pieceToPlace);

  return newBoard;
}

/**
 * Check if a move would leave the moving player's King in check.
 * Requirements: 7.2, 7.3
 */
export function wouldBeInCheck(state: GameState, move: Move): boolean {
  const piece = getPiece(state.board, move.from);
  if (!piece) {
    return true; // Invalid move
  }

  const color = piece.color;
  
  // Apply the move to get the resulting board
  const newBoard = applyMoveToBoard(state.board, move);
  
  // Find the king's position after the move
  const kingSquare = getKingSquare(newBoard, color);
  if (!kingSquare) {
    return true; // No king found - shouldn't happen
  }

  // Check if the king is attacked by the opponent
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(newBoard, kingSquare, opponentColor);
}

/**
 * Check if a move is legal (follows piece rules and doesn't leave King in check).
 * Requirements: 7.2, 7.3, 11.1, 11.2
 */
export function isLegalMove(state: GameState, move: Move): boolean {
  const piece = getPiece(state.board, move.from);
  if (!piece) {
    return false;
  }

  // Check if it's the correct player's turn
  if (piece.color !== state.currentPlayer) {
    return false;
  }

  // Generate pseudo-legal moves for this piece
  const pseudoLegalMoves = generatePieceMoves(
    state.board,
    move.from,
    piece,
    state.enPassantTarget
  );

  // Check if the move is in the list of pseudo-legal moves
  const isPseudoLegal = pseudoLegalMoves.some(
    m => squaresEqual(m.to, move.to) && m.promotion === move.promotion
  );

  if (!isPseudoLegal) {
    return false;
  }

  // Check if the move would leave the King in check
  return !wouldBeInCheck(state, move);
}

/**
 * Generate all legal moves for a piece at a given square.
 * Filters out moves that would leave the King in check.
 * Requirements: 7.2, 7.3, 11.2
 */
export function generateLegalMovesForPiece(state: GameState, square: Square): Move[] {
  const piece = getPiece(state.board, square);
  if (!piece || piece.color !== state.currentPlayer) {
    return [];
  }

  let pseudoLegalMoves = generatePieceMoves(
    state.board,
    square,
    piece,
    state.enPassantTarget
  );

  // Add castling moves for the king
  if (piece.type === 'king') {
    const castlingMoves = generateCastlingMoves(
      state.board,
      piece.color,
      state.castlingRights
    );
    pseudoLegalMoves = [...pseudoLegalMoves, ...castlingMoves];
  }

  // Filter out moves that would leave the King in check
  return pseudoLegalMoves.filter(move => !wouldBeInCheck(state, move));
}

/**
 * Generate all legal moves for the current player.
 * Requirements: 7.2, 7.3, 11.1, 11.2
 */
export function generateAllLegalMoves(state: GameState): Move[] {
  let pseudoLegalMoves = generateAllPseudoLegalMoves(
    state.board,
    state.currentPlayer,
    state.enPassantTarget
  );

  // Add castling moves
  const castlingMoves = generateCastlingMoves(
    state.board,
    state.currentPlayer,
    state.castlingRights
  );
  pseudoLegalMoves = [...pseudoLegalMoves, ...castlingMoves];

  // Filter out moves that would leave the King in check
  return pseudoLegalMoves.filter(move => !wouldBeInCheck(state, move));
}

/**
 * Generate all legal moves for a specific color.
 * Useful for checking if a player has any legal moves (for checkmate/stalemate detection).
 */
export function generateAllLegalMovesForColor(state: GameState, color: Color): Move[] {
  const pseudoLegalMoves = generateAllPseudoLegalMoves(
    state.board,
    color,
    state.enPassantTarget
  );

  // Filter out moves that would leave the King in check
  return pseudoLegalMoves.filter(move => {
    const piece = getPiece(state.board, move.from);
    if (!piece) return false;
    
    const newBoard = applyMoveToBoard(state.board, move);
    const kingSquare = getKingSquare(newBoard, color);
    if (!kingSquare) return false;
    
    const opponentColor = color === 'white' ? 'black' : 'white';
    return !isSquareAttacked(newBoard, kingSquare, opponentColor);
  });
}
