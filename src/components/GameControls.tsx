import React from 'react';
import type { Color, GameStatus } from '../engine/types';

export interface GameControlsProps {
  currentPlayer: Color;
  gameStatus: GameStatus;
  canUndo: boolean;
  onNewGame: () => void;
  onUndo: () => void;
}

const getStatusMessage = (status: GameStatus): { message: string; type: string } => {
  switch (status.type) {
    case 'active':
      return status.inCheck 
        ? { message: 'Check!', type: 'check' }
        : { message: '', type: '' };
    case 'checkmate':
      return { 
        message: `Checkmate! ${status.winner === 'white' ? 'White' : 'Black'} wins!`,
        type: 'checkmate'
      };
    case 'draw':
      let reason = 'Draw';
      switch (status.reason) {
        case 'stalemate': reason = 'Draw by stalemate'; break;
        case 'insufficient-material': reason = 'Draw by insufficient material'; break;
        case 'threefold-repetition': reason = 'Draw by threefold repetition'; break;
        case 'fifty-move-rule': reason = 'Draw by fifty-move rule'; break;
      }
      return { message: reason, type: 'draw' };
  }
};

export const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  gameStatus,
  canUndo,
  onNewGame,
  onUndo,
}) => {
  const isGameOver = gameStatus.type !== 'active';
  const { message: statusMessage, type: statusType } = getStatusMessage(gameStatus);

  return (
    <div className="game-controls" data-testid="game-controls">
      {!isGameOver && (
        <div className="turn-indicator" data-testid="turn-indicator">
          <div 
            className={`turn-indicator__color turn-indicator__color--${currentPlayer}`}
            data-testid={`${currentPlayer}-indicator`} 
          />
          <span>{currentPlayer === 'white' ? 'White' : 'Black'}'s turn</span>
        </div>
      )}
      
      {statusMessage && (
        <div 
          className={`game-status game-status--${statusType}`}
          data-testid="game-status"
        >
          {statusMessage}
        </div>
      )}

      <div className="button-container">
        <button
          className="btn btn--new-game"
          onClick={onNewGame}
          data-testid="new-game-button"
        >
          New Game
        </button>
        <button
          className="btn btn--undo"
          onClick={onUndo}
          disabled={!canUndo}
          data-testid="undo-button"
        >
          Undo
        </button>
      </div>
    </div>
  );
};

export default GameControls;
