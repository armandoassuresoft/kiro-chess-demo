import React from 'react';
import type { MoveRecord, PieceType } from '../engine/types';

interface MaterialAdvantageProps {
  moveHistory: MoveRecord[];
}

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

export const MaterialAdvantage: React.FC<MaterialAdvantageProps> = ({ moveHistory }) => {
  let whiteAdvantage = 0;

  moveHistory.forEach(record => {
    if (record.captured) {
      const value = PIECE_VALUES[record.captured.type];
      if (record.piece.color === 'white') {
        whiteAdvantage += value;
      } else {
        whiteAdvantage -= value;
      }
    }
  });

  if (whiteAdvantage === 0) {
    return null;
  }

  const displayValue = whiteAdvantage > 0 ? `+${whiteAdvantage}` : `${whiteAdvantage}`;
  const advantageColor = whiteAdvantage > 0 ? 'white' : 'black';

  return (
    <div className={`material-advantage material-advantage--${advantageColor}`}>
      <span className="material-advantage__value">{displayValue}</span>
    </div>
  );
};

export default MaterialAdvantage;
