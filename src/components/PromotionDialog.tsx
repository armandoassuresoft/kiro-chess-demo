import React from 'react';
import type { Color, PromotablePiece } from '../engine/types';

export interface PromotionDialogProps {
  color: Color;
  onSelect: (pieceType: PromotablePiece) => void;
}

const PIECE_SYMBOLS: Record<string, Record<PromotablePiece, string>> = {
  white: {
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
  },
  black: {
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
  },
};

const PROMOTABLE_PIECES: PromotablePiece[] = ['queen', 'rook', 'bishop', 'knight'];

export const PromotionDialog: React.FC<PromotionDialogProps> = ({ color, onSelect }) => {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const dialogStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  };

  const titleStyle: React.CSSProperties = {
    margin: '0 0 16px 0',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
  };

  const optionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
  };

  const buttonStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    fontSize: '48px',
    border: '2px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  };

  return (
    <div style={overlayStyle} data-testid="promotion-dialog" role="dialog" aria-label="Pawn promotion">
      <div style={dialogStyle}>
        <h2 style={titleStyle}>Choose promotion piece</h2>
        <div style={optionsStyle}>
          {PROMOTABLE_PIECES.map(pieceType => (
            <button
              key={pieceType}
              style={buttonStyle}
              onClick={() => onSelect(pieceType)}
              data-testid={`promote-${pieceType}`}
              aria-label={`Promote to ${pieceType}`}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#e0e0e0';
                e.currentTarget.style.borderColor = '#999';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.borderColor = '#ccc';
              }}
            >
              <span
                style={{
                  color: color === 'white' ? '#fff' : '#000',
                  textShadow: color === 'white'
                    ? '0 0 2px #000, 0 0 2px #000'
                    : '0 0 2px #fff, 0 0 2px #fff',
                }}
              >
                {PIECE_SYMBOLS[color][pieceType]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionDialog;
