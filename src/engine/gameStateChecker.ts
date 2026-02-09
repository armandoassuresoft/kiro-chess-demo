import type { Board, Color, DrawReason, GameState, GameStatus, Move, Square } from './types';
import { getPiece, getKingSquare, setPiece, squareToIndex, indexToSquare, isValidIndex } from './boardUtils';
import { generateAllPseudoLegalMoves, generateCastlingMoves } from './moveGenerator';

/**
 * Check if a square is attacked by any piece of the specified color.
 * This is used for check detection and castling validation.
 * Requirements: 7.1
 */
export function isSquareAttacked(board: Board, square: Square, byColor: Color): boolean {
  const { rankIndex: targetRank, fileIndex: targetFile } = squareToIndex(square);

  // Check for pawn attacks
  // Pawns attack diagonally, so we look in the opposite direction
  const pawnDirection = byColor === 'white' ? -1 : 1; // White attacks upward, black attacks downward
  const pawnAttackRank = targetRank + pawnDirection;
  for (const dFile of [-1, 1]) {
    const pawnFile = targetFile + dFile;
    if (isValidIndex(pawnAttackRank, pawnFile)) {
      const attackSquare = indexToSquare(pawnAttackRank, pawnFile);
      const piece = getPiece(board, attackSquare);
      if (piece && piece.type === 'pawn' && piece.color === byColor) {
        return true;
      }
    }
  }

  // Check for knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1],
    [-1, -2], [-1, 2],
    [1, -2],  [1, 2],
    [2, -1],  [2, 1],
  ];
  for (const [dRank, dFile] of knightOffsets) {
    const knightRank = targetRank + dRank;
    const knightFile = targetFile + dFile;
    if (isValidIndex(knightRank, knightFile)) {
      const attackSquare = indexToSquare(knightRank, knightFile);
      const piece = getPiece(board, attackSquare);
      if (piece && piece.type === 'knight' && piece.color === byColor) {
        return true;
      }
    }
  }

  // Check for king attacks (one square in any direction)
  const kingOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];
  for (const [dRank, dFile] of kingOffsets) {
    const kingRank = targetRank + dRank;
    const kingFile = targetFile + dFile;
    if (isValidIndex(kingRank, kingFile)) {
      const attackSquare = indexToSquare(kingRank, kingFile);
      const piece = getPiece(board, attackSquare);
      if (piece && piece.type === 'king' && piece.color === byColor) {
        return true;
      }
    }
  }

  // Check for sliding piece attacks (rook, bishop, queen)
  // Rook/Queen: horizontal and vertical
  const rookDirections = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];
  for (const [dRank, dFile] of rookDirections) {
    if (isAttackedAlongRay(board, targetRank, targetFile, dRank, dFile, byColor, ['rook', 'queen'])) {
      return true;
    }
  }

  // Bishop/Queen: diagonal
  const bishopDirections = [
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];
  for (const [dRank, dFile] of bishopDirections) {
    if (isAttackedAlongRay(board, targetRank, targetFile, dRank, dFile, byColor, ['bishop', 'queen'])) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a square is attacked along a ray by specific piece types.
 */
function isAttackedAlongRay(
  board: Board,
  startRank: number,
  startFile: number,
  dRank: number,
  dFile: number,
  byColor: Color,
  pieceTypes: string[]
): boolean {
  let rank = startRank + dRank;
  let file = startFile + dFile;

  while (isValidIndex(rank, file)) {
    const square = indexToSquare(rank, file);
    const piece = getPiece(board, square);

    if (piece) {
      // Found a piece - check if it's an attacker
      if (piece.color === byColor && pieceTypes.includes(piece.type)) {
        return true;
      }
      // Any piece blocks the ray
      return false;
    }

    rank += dRank;
    file += dFile;
  }

  return false;
}

/**
 * Check if the specified player's King is in check.
 * Requirements: 7.1
 */
export function isCheck(state: GameState, color: Color): boolean {
  const kingSquare = getKingSquare(state.board, color);
  if (!kingSquare) {
    // No king found - shouldn't happen in a valid game
    return false;
  }

  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(state.board, kingSquare, opponentColor);
}

/**
 * Check if the current player's King is in check.
 */
export function isCurrentPlayerInCheck(state: GameState): boolean {
  return isCheck(state, state.currentPlayer);
}


/**
 * Apply a move to the board and return the new board state.
 * This is a local helper to avoid circular dependency with moveValidator.
 */
function applyMoveToBoardLocal(board: Board, move: Move): Board {
  const piece = getPiece(board, move.from);
  if (!piece) {
    return board;
  }

  // Remove piece from source square
  let newBoard = setPiece(board, move.from, null);
  
  // Handle promotion
  const pieceToPlace = move.promotion 
    ? { type: move.promotion, color: piece.color }
    : piece;
  
  // Place piece on destination square (captures are handled implicitly)
  newBoard = setPiece(newBoard, move.to, pieceToPlace);

  // Handle castling (king moves 2 squares)
  if (piece.type === 'king') {
    const fromFile = move.from.file;
    const toFile = move.to.file;
    if (fromFile === 'e' && toFile === 'g') {
      // Kingside castling - move rook
      const rookFrom: Square = { file: 'h', rank: move.from.rank };
      const rookTo: Square = { file: 'f', rank: move.from.rank };
      const rook = getPiece(newBoard, rookFrom);
      if (rook) {
        newBoard = setPiece(newBoard, rookFrom, null);
        newBoard = setPiece(newBoard, rookTo, rook);
      }
    } else if (fromFile === 'e' && toFile === 'c') {
      // Queenside castling - move rook
      const rookFrom: Square = { file: 'a', rank: move.from.rank };
      const rookTo: Square = { file: 'd', rank: move.from.rank };
      const rook = getPiece(newBoard, rookFrom);
      if (rook) {
        newBoard = setPiece(newBoard, rookFrom, null);
        newBoard = setPiece(newBoard, rookTo, rook);
      }
    }
  }

  // Handle en passant (pawn captures diagonally to empty square)
  if (piece.type === 'pawn') {
    const fromFileIndex = move.from.file.charCodeAt(0) - 'a'.charCodeAt(0);
    const toFileIndex = move.to.file.charCodeAt(0) - 'a'.charCodeAt(0);
    const targetPiece = getPiece(board, move.to);
    
    // If pawn moves diagonally but target square was empty, it's en passant
    if (fromFileIndex !== toFileIndex && !targetPiece) {
      const capturedPawnSquare: Square = { file: move.to.file, rank: move.from.rank };
      newBoard = setPiece(newBoard, capturedPawnSquare, null);
    }
  }

  return newBoard;
}

/**
 * Check if a move would leave the moving player's King in check.
 * Local helper to avoid circular dependency.
 */
function wouldBeInCheckLocal(state: GameState, move: Move): boolean {
  const piece = getPiece(state.board, move.from);
  if (!piece) {
    return true;
  }

  const color = piece.color;
  const newBoard = applyMoveToBoardLocal(state.board, move);
  const kingSquare = getKingSquare(newBoard, color);
  
  if (!kingSquare) {
    return true;
  }

  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(newBoard, kingSquare, opponentColor);
}

/**
 * Generate all legal moves for a color (used internally for checkmate/stalemate detection).
 * This avoids circular dependency with moveValidator.
 */
function generateLegalMovesForColor(state: GameState, color: Color): Move[] {
  let pseudoLegalMoves = generateAllPseudoLegalMoves(
    state.board,
    color,
    state.enPassantTarget
  );

  // Add castling moves
  const castlingMoves = generateCastlingMoves(
    state.board,
    color,
    state.castlingRights
  );
  pseudoLegalMoves = [...pseudoLegalMoves, ...castlingMoves];

  // Filter out moves that would leave the King in check
  return pseudoLegalMoves.filter(move => !wouldBeInCheckLocal(state, move));
}

/**
 * Check if the current player is in checkmate.
 * Checkmate occurs when the King is in check and there are no legal moves to escape.
 * Requirements: 8.1, 8.2
 */
export function isCheckmate(state: GameState): boolean {
  // Must be in check for checkmate
  if (!isCheck(state, state.currentPlayer)) {
    return false;
  }
  
  // Check if there are any legal moves
  const legalMoves = generateLegalMovesForColor(state, state.currentPlayer);
  return legalMoves.length === 0;
}

/**
 * Check if the current player is in stalemate.
 * Stalemate occurs when the King is NOT in check but there are no legal moves.
 * Requirements: 9.1, 9.2
 */
export function isStalemate(state: GameState): boolean {
  // Must NOT be in check for stalemate
  if (isCheck(state, state.currentPlayer)) {
    return false;
  }
  
  // Check if there are any legal moves
  const legalMoves = generateLegalMovesForColor(state, state.currentPlayer);
  return legalMoves.length === 0;
}

/**
 * Check for insufficient material draw.
 * Draw conditions:
 * - King vs King
 * - King + Bishop vs King
 * - King + Knight vs King
 * - King + Bishop vs King + Bishop (same color bishops)
 * Requirements: 10.1
 */
export function isInsufficientMaterial(state: GameState): boolean {
  const pieces: { type: string; color: Color; squareColor?: 'light' | 'dark' }[] = [];
  
  // Collect all pieces on the board
  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
      const piece = state.board[rankIndex][fileIndex];
      if (piece) {
        const squareColor = (rankIndex + fileIndex) % 2 === 0 ? 'dark' : 'light';
        pieces.push({ type: piece.type, color: piece.color, squareColor });
      }
    }
  }
  
  // King vs King
  if (pieces.length === 2) {
    const kings = pieces.filter(p => p.type === 'king');
    if (kings.length === 2) {
      return true;
    }
  }
  
  // King + minor piece vs King
  if (pieces.length === 3) {
    const kings = pieces.filter(p => p.type === 'king');
    const bishops = pieces.filter(p => p.type === 'bishop');
    const knights = pieces.filter(p => p.type === 'knight');
    
    if (kings.length === 2 && (bishops.length === 1 || knights.length === 1)) {
      return true;
    }
  }
  
  // King + Bishop vs King + Bishop (same color bishops)
  if (pieces.length === 4) {
    const kings = pieces.filter(p => p.type === 'king');
    const bishops = pieces.filter(p => p.type === 'bishop');
    
    if (kings.length === 2 && bishops.length === 2) {
      // Check if bishops are on same color squares
      const whiteBishop = bishops.find(b => b.color === 'white');
      const blackBishop = bishops.find(b => b.color === 'black');
      
      if (whiteBishop && blackBishop && whiteBishop.squareColor === blackBishop.squareColor) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check for threefold repetition.
 * A draw can be claimed if the same position occurs three times.
 * Requirements: 10.2
 */
export function isThreefoldRepetition(state: GameState): boolean {
  if (state.positionHistory.length < 3) {
    return false;
  }
  
  // Count occurrences of the current position
  const currentPosition = state.positionHistory[state.positionHistory.length - 1];
  let count = 0;
  
  for (const position of state.positionHistory) {
    if (position === currentPosition) {
      count++;
    }
  }
  
  return count >= 3;
}

/**
 * Check for fifty-move rule.
 * A draw can be claimed if 50 moves have been made by both players
 * without a pawn move or capture (halfMoveClock reaches 100).
 * Requirements: 10.3
 */
export function isFiftyMoveRule(state: GameState): boolean {
  return state.halfMoveClock >= 100;
}

/**
 * Get the draw reason if the game is a draw, or null if not.
 * Requirements: 10.1, 10.2, 10.3
 */
export function getDrawReason(state: GameState): DrawReason | null {
  if (isStalemate(state)) {
    return 'stalemate';
  }
  
  if (isInsufficientMaterial(state)) {
    return 'insufficient-material';
  }
  
  if (isThreefoldRepetition(state)) {
    return 'threefold-repetition';
  }
  
  if (isFiftyMoveRule(state)) {
    return 'fifty-move-rule';
  }
  
  return null;
}

/**
 * Get the current game status.
 * Returns checkmate, draw, or active status.
 */
export function getGameStatus(state: GameState): GameStatus {
  // Check for checkmate first
  if (isCheckmate(state)) {
    const winner = state.currentPlayer === 'white' ? 'black' : 'white';
    return { type: 'checkmate', winner };
  }
  
  // Check for draw conditions
  const drawReason = getDrawReason(state);
  if (drawReason) {
    return { type: 'draw', reason: drawReason };
  }
  
  // Game is active
  const inCheck = isCheck(state, state.currentPlayer);
  return { type: 'active', inCheck };
}
