import React, { useRef, useEffect } from 'react';
import type { MoveRecord, Square, PieceType } from '../engine/types';

interface MoveHistoryProps {
  moveHistory: MoveRecord[];
}

const getPieceNotation = (type: PieceType): string => {
  switch (type) {
    case 'king': return 'K';
    case 'queen': return 'Q';
    case 'rook': return 'R';
    case 'bishop': return 'B';
    case 'knight': return 'N';
    case 'pawn': return '';
  }
};

const squareToNotation = (square: Square): string => {
  return `${square.file}${square.rank}`;
};

const moveToAlgebraic = (record: MoveRecord): string => {
  const { move, piece, captured, isCheck, isCheckmate, isCastling, isEnPassant } = record;

  // Castling
  if (isCastling) {
    const notation = isCastling === 'kingside' ? 'O-O' : 'O-O-O';
    if (isCheckmate) return notation + '#';
    if (isCheck) return notation + '+';
    return notation;
  }

  let notation = '';

  // Piece letter (empty for pawns)
  notation += getPieceNotation(piece.type);

  // For pawns capturing, include the file
  if (piece.type === 'pawn' && captured) {
    notation += move.from.file;
  }

  // Capture indicator
  if (captured || isEnPassant) {
    notation += 'x';
  }

  // Destination square
  notation += squareToNotation(move.to);

  // Promotion
  if (move.promotion) {
    notation += '=' + getPieceNotation(move.promotion);
  }

  // Check/checkmate
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }

  return notation;
};

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moveHistory }) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new moves are added
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [moveHistory.length]);

  // Group moves into pairs (white, black)
  const movePairs: { moveNumber: number; white: string; black?: string }[] = [];
  
  moveHistory.forEach((record, idx) => {
    const notation = moveToAlgebraic(record);
    const moveNumber = Math.floor(idx / 2) + 1;
    
    if (idx % 2 === 0) {
      movePairs.push({ moveNumber, white: notation });
    } else {
      movePairs[movePairs.length - 1].black = notation;
    }
  });

  return (
    <div className="move-history">
      <h3>Moves</h3>
      <div className="move-history-list" ref={listRef}>
        {movePairs.length === 0 ? (
          <div className="move-history-empty">No moves yet</div>
        ) : (
          movePairs.map((pair, idx) => (
            <div key={idx} className="move-history-row">
              <span className="move-number">{pair.moveNumber}.</span>
              <span className="move-white">{pair.white}</span>
              <span className="move-black">{pair.black || ''}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
