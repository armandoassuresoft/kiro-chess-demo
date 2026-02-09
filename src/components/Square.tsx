import React, { useCallback } from 'react';
import type { Square as SquareType, Piece, Color } from '../engine/types';

export interface SquareProps {
  square: SquareType;
  piece: Piece | null;
  isSelected: boolean;
  isLegalMove: boolean;
  isCheck: boolean;
  isDark: boolean;
  isLastMoveFrom?: boolean;
  isLastMoveTo?: boolean;
  isHovered?: boolean;
  currentPlayer?: Color;
  onClick: () => void;
  onDragStart?: (square: SquareType) => void;
  onDragEnd?: () => void;
  onDrop?: (square: SquareType) => void;
}

const PIECE_SYMBOLS: Record<string, string> = {
  'white-king': '♔',
  'white-queen': '♕',
  'white-rook': '♖',
  'white-bishop': '♗',
  'white-knight': '♘',
  'white-pawn': '♙',
  'black-king': '♚',
  'black-queen': '♛',
  'black-rook': '♜',
  'black-bishop': '♝',
  'black-knight': '♞',
  'black-pawn': '♟',
};

const getPieceSymbol = (piece: Piece): string => {
  return PIECE_SYMBOLS[`${piece.color}-${piece.type}`] || '';
};

export const Square: React.FC<SquareProps> = ({
  square,
  piece,
  isSelected,
  isLegalMove,
  isCheck,
  isDark,
  isLastMoveFrom = false,
  isLastMoveTo = false,
  isHovered = false,
  currentPlayer,
  onClick,
  onDragStart,
  onDragEnd,
  onDrop,
}) => {
  const classNames = [
    'square',
    isDark ? 'square--dark' : 'square--light',
    isSelected && 'square--selected',
    isLegalMove && 'square--legal-move',
    isCheck && 'square--check',
    isLastMoveFrom && 'square--last-move-from',
    isLastMoveTo && 'square--last-move-to',
    isHovered && 'square--hovered',
    piece && 'square--occupied',
  ].filter(Boolean).join(' ');

  const canDrag = piece && currentPlayer && piece.color === currentPlayer;

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${square.file}${square.rank}`);
    onDragStart?.(square);
  }, [canDrag, square, onDragStart]);

  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(square);
  }, [square, onDrop]);

  return (
    <div
      className={classNames}
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      draggable={canDrag || undefined}
      data-testid={`square-${square.file}${square.rank}`}
      data-square={`${square.file}${square.rank}`}
      role="button"
      aria-label={`Square ${square.file}${square.rank}${piece ? ` with ${piece.color} ${piece.type}` : ''}`}
    >
      {piece && (
        <span 
          className={`piece piece--${piece.color}`}
          data-testid={`piece-${piece.color}-${piece.type}`}
        >
          {getPieceSymbol(piece)}
        </span>
      )}
    </div>
  );
};

export default Square;
