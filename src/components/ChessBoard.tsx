import React, { useState, useCallback } from 'react';
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
  lastMove?: { from: SquareType; to: SquareType } | null;
  onDragMove?: (from: SquareType, to: SquareType) => void;
}

const FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const DEFAULT_RANKS: Rank[] = [8, 7, 6, 5, 4, 3, 2, 1];

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
  lastMove = null,
  onDragMove,
}) => {
  const [dragFrom, setDragFrom] = useState<SquareType | null>(null);
  
  const files = isFlipped ? [...FILES].reverse() : FILES;
  const ranks = isFlipped ? [...DEFAULT_RANKS].reverse() : DEFAULT_RANKS;

  const handleDragStart = useCallback((square: SquareType) => {
    setDragFrom(square);
    onSquareClick(square); // Select the piece
  }, [onSquareClick]);

  const handleDragEnd = useCallback(() => {
    setDragFrom(null);
  }, []);

  const handleDrop = useCallback((to: SquareType) => {
    if (dragFrom && onDragMove) {
      onDragMove(dragFrom, to);
    }
    setDragFrom(null);
  }, [dragFrom, onDragMove]);

  return (
    <div className="chess-board-grid" data-testid="chess-board" role="grid" aria-label="Chess board">
      {ranks.map((rank) => (
        <div key={rank} className="board-row">
          <div className="rank-label">{rank}</div>
          {files.map(file => {
            const square: SquareType = { file, rank };
            const piece = getPiece(gameState.board, square);
            const isSelected = squaresEqual(selectedSquare, square);
            const isLegalMove = isSquareInList(square, legalMoves);
            const isCheck = squaresEqual(kingInCheck, square);
            const isDark = isDarkSquare(file, rank);
            const isLastMoveFrom = lastMove ? squaresEqual(lastMove.from, square) : false;
            const isLastMoveTo = lastMove ? squaresEqual(lastMove.to, square) : false;

            return (
              <Square
                key={`${file}${rank}`}
                square={square}
                piece={piece}
                isSelected={isSelected}
                isLegalMove={isLegalMove}
                isCheck={isCheck}
                isDark={isDark}
                isLastMoveFrom={isLastMoveFrom}
                isLastMoveTo={isLastMoveTo}
                currentPlayer={gameState.currentPlayer}
                onClick={() => onSquareClick(square)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
              />
            );
          })}
        </div>
      ))}
      <div className="file-labels">
        {files.map(file => (
          <div key={file} className="file-label">{file}</div>
        ))}
      </div>
    </div>
  );
};

export default ChessBoard;
