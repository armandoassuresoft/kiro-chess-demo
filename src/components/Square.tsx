import React from 'react';
import type { Square as SquareType, Piece } from '../engine/types';

export interface SquareProps {
  square: SquareType;
  piece: Piece | null;
  isSelected: boolean;
  isLegalMove: boolean;
  isCheck: boolean;
  isDark: boolean;
  onClick: () => void;
}

// Unicode chess piece symbols
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
  onClick,
}) => {
  const baseColor = isDark ? '#b58863' : '#f0d9b5';
  
  let backgroundColor = baseColor;
  if (isSelected) {
    backgroundColor = '#7fc97f'; // Green highlight for selected square
  } else if (isCheck) {
    backgroundColor = '#e74c3c'; // Red highlight for check
  }

  const style: React.CSSProperties = {
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    position: 'relative',
    cursor: 'pointer',
    fontSize: '48px',
    userSelect: 'none',
  };

  const legalMoveIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    width: piece ? '100%' : '25%',
    height: piece ? '100%' : '25%',
    borderRadius: piece ? '0' : '50%',
    backgroundColor: piece ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
    border: piece ? '4px solid rgba(0, 0, 0, 0.2)' : 'none',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  };

  return (
    <div
      style={style}
      onClick={onClick}
      data-testid={`square-${square.file}${square.rank}`}
      data-square={`${square.file}${square.rank}`}
      role="button"
      aria-label={`Square ${square.file}${square.rank}${piece ? ` with ${piece.color} ${piece.type}` : ''}`}
    >
      {isLegalMove && <div style={legalMoveIndicatorStyle} data-testid="legal-move-indicator" />}
      {piece && (
        <span
          style={{ 
            color: piece.color === 'white' ? '#fff' : '#000',
            textShadow: piece.color === 'white' 
              ? '0 0 2px #000, 0 0 2px #000' 
              : '0 0 2px #fff, 0 0 2px #fff',
            zIndex: 1,
          }}
          data-testid={`piece-${piece.color}-${piece.type}`}
        >
          {getPieceSymbol(piece)}
        </span>
      )}
    </div>
  );
};

export default Square;
