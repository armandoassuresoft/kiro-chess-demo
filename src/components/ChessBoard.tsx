import React from 'react';
import type { GameState, Square as SquareType, File, Rank } from '../engine/types';
import { getPiece } from '../engine/boardUtils';
import { Square } from './Square';

export interface ChessBoardProps {
  gameState: GameState;
  selectedSquare: SquareType | null;
  legalMoves: SquareType[];
  onSquareClick: (square: SquareType) => void;
  isFlipped?: boolean;
  kingInCheck?: SquareType | null;
}

const FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS: Rank[] = [8, 7, 6, 5, 4, 3, 2, 1];

const squaresEqual = (a: SquareType | null, b: SquareType): boolean => {
  return a !== null && a.file === b.file && a.rank === b.rank;
};

const isSquareInList = (square: SquareType, list: SquareType[]): boolean => {
  return list.some(s => s.file === square.file && s.rank === square.rank);
};

const isDarkSquare = (file: File, rank: Rank): boolean => {
  const fileIndex = FILES.indexOf(file);
  return (fileIndex + rank) % 2 === 0;
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  gameState,
  selectedSquare,
  legalMoves,
  onSquareClick,
  isFlipped = false,
  kingInCheck = null,
}) => {
  const files = isFlipped ? [...FILES].reverse() : FILES;
  const ranks = isFlipped ? [...RANKS].reverse() : RANKS;

  const boardStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 60px)',
    gridTemplateRows: 'repeat(8, 60px)',
    border: '4px solid #5d4037',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  };

  return (
    <div style={boardStyle} data-testid="chess-board" role="grid" aria-label="Chess board">
      {ranks.map(rank =>
        files.map(file => {
          const square: SquareType = { file, rank };
          const piece = getPiece(gameState.board, square);
          const isSelected = squaresEqual(selectedSquare, square);
          const isLegalMove = isSquareInList(square, legalMoves);
          const isCheck = squaresEqual(kingInCheck, square);
          const isDark = isDarkSquare(file, rank);

          return (
            <Square
              key={`${file}${rank}`}
              square={square}
              piece={piece}
              isSelected={isSelected}
              isLegalMove={isLegalMove}
              isCheck={isCheck}
              isDark={isDark}
              onClick={() => onSquareClick(square)}
            />
          );
        })
      )}
    </div>
  );
};

export default ChessBoard;
