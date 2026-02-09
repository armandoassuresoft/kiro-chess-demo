import React from 'react';
import type { Piece, MoveRecord } from '../engine/types';

interface CapturedPiecesProps {
  moveHistory: MoveRecord[];
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

const PIECE_ORDER = ['queen', 'rook', 'bishop', 'knight', 'pawn'];

const getPieceSymbol = (piece: Piece): string => {
  return PIECE_SYMBOLS[`${piece.color}-${piece.type}`] || '?';
};

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({ moveHistory }) => {
  const capturedByWhite: Piece[] = [];
  const capturedByBlack: Piece[] = [];

  moveHistory.forEach(record => {
    if (record.captured) {
      if (record.piece.color === 'white') {
        capturedByWhite.push(record.captured);
      } else {
        capturedByBlack.push(record.captured);
      }
    }
  });

  const sortPieces = (pieces: Piece[]): Piece[] => {
    return [...pieces].sort((a, b) => {
      return PIECE_ORDER.indexOf(a.type) - PIECE_ORDER.indexOf(b.type);
    });
  };

  const sortedWhiteCaptures = sortPieces(capturedByWhite);
  const sortedBlackCaptures = sortPieces(capturedByBlack);

  return (
    <div className="captured-pieces">
      <h3>Captured</h3>
      <div className="captured-row">
        <span className="captured-row-label">White:</span>
        <div className="captured-row-pieces">
          {sortedWhiteCaptures.map((piece, idx) => (
            <span key={idx} className="captured-piece">
              {getPieceSymbol(piece)}
            </span>
          ))}
        </div>
      </div>
      <div className="captured-row">
        <span className="captured-row-label">Black:</span>
        <div className="captured-row-pieces">
          {sortedBlackCaptures.map((piece, idx) => (
            <span key={idx} className="captured-piece">
              {getPieceSymbol(piece)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CapturedPieces;
