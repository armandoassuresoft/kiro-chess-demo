import type { Board, Color, File, Piece, Rank, Square } from './types';

// File and rank arrays for conversion
const FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Convert a square to board array indices
 * Board is stored in rank-major order: board[rank-1][file index]
 */
export function squareToIndex(square: Square): { rankIndex: number; fileIndex: number } {
  const fileIndex = FILES.indexOf(square.file);
  const rankIndex = square.rank - 1;
  return { rankIndex, fileIndex };
}

/**
 * Convert board array indices to a square
 */
export function indexToSquare(rankIndex: number, fileIndex: number): Square {
  return {
    file: FILES[fileIndex],
    rank: RANKS[rankIndex],
  };
}

/**
 * Get the piece at a given square
 */
export function getPiece(board: Board, square: Square): Piece | null {
  const { rankIndex, fileIndex } = squareToIndex(square);
  return board[rankIndex][fileIndex];
}

/**
 * Set a piece at a given square, returning a new board (immutable)
 */
export function setPiece(board: Board, square: Square, piece: Piece | null): Board {
  const newBoard = cloneBoard(board);
  const { rankIndex, fileIndex } = squareToIndex(square);
  newBoard[rankIndex][fileIndex] = piece;
  return newBoard;
}

/**
 * Find the square containing the King of the specified color
 */
export function getKingSquare(board: Board, color: Color): Square | null {
  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
      const piece = board[rankIndex][fileIndex];
      if (piece && piece.type === 'king' && piece.color === color) {
        return indexToSquare(rankIndex, fileIndex);
      }
    }
  }
  return null;
}

/**
 * Create a deep clone of the board
 */
export function cloneBoard(board: Board): Board {
  return board.map(rank => rank.map(piece => (piece ? { ...piece } : null)));
}


/**
 * Initial chess board setup
 */
export const INITIAL_BOARD: Board = [
  // Rank 1 (white back rank)
  [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' },
  ],
  // Rank 2 (white pawns)
  [
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
  ],
  // Ranks 3-6 (empty)
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  // Rank 7 (black pawns)
  [
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
  ],
  // Rank 8 (black back rank)
  [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' },
  ],
];

/**
 * Check if indices are within board bounds
 */
export function isValidIndex(rankIndex: number, fileIndex: number): boolean {
  return rankIndex >= 0 && rankIndex < 8 && fileIndex >= 0 && fileIndex < 8;
}

/**
 * Check if a square is valid
 */
export function isValidSquare(file: string, rank: number): boolean {
  return FILES.includes(file as File) && RANKS.includes(rank as Rank);
}

/**
 * Compare two squares for equality
 */
export function squaresEqual(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank;
}
