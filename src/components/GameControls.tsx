import React from 'react';
import type { Color, GameStatus } from '../engine/types';

export interface GameControlsProps {
  currentPlayer: Color;
  gameStatus: GameStatus;
  canUndo: boolean;
  onNewGame: () => void;
  onUndo: () => void;
}

const getStatusMessage = (status: GameStatus): string => {
  switch (status.type) {
    case 'active':
      return status.inCheck ? 'Check!' : '';
    case 'checkmate':
      return `Checkmate! ${status.winner === 'white' ? 'White' : 'Black'} wins!`;
    case 'draw':
      switch (status.reason) {
        case 'stalemate':
          return 'Draw by stalemate';
        case 'insufficient-material':
          return 'Draw by insufficient material';
        case 'threefold-repetition':
          return 'Draw by threefold repetition';
        case 'fifty-move-rule':
          return 'Draw by fifty-move rule';
        default:
          return 'Draw';
      }
  }
};

export const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  gameStatus,
  canUndo,
  onNewGame,
  onUndo,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    minWidth: '200px',
  };

  const turnIndicatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
  };

  const colorIndicatorStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: currentPlayer === 'white' ? '#fff' : '#000',
    border: '2px solid #333',
  };

  const statusStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: gameStatus.type === 'checkmate' ? '#e74c3c' : 
           gameStatus.type === 'draw' ? '#f39c12' :
           (gameStatus.type === 'active' && gameStatus.inCheck) ? '#e74c3c' : '#333',
    textAlign: 'center',
    minHeight: '24px',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const newGameButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#4caf50',
    color: '#fff',
  };

  const undoButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: canUndo ? '#2196f3' : '#ccc',
    color: '#fff',
    cursor: canUndo ? 'pointer' : 'not-allowed',
  };

  const isGameOver = gameStatus.type !== 'active';
  const statusMessage = getStatusMessage(gameStatus);

  return (
    <div style={containerStyle} data-testid="game-controls">
      {!isGameOver && (
        <div style={turnIndicatorStyle} data-testid="turn-indicator">
          <div style={colorIndicatorStyle} data-testid={`${currentPlayer}-indicator`} />
          <span>{currentPlayer === 'white' ? 'White' : 'Black'}'s turn</span>
        </div>
      )}
      
      {statusMessage && (
        <div style={statusStyle} data-testid="game-status">
          {statusMessage}
        </div>
      )}

      <div style={buttonContainerStyle}>
        <button
          style={newGameButtonStyle}
          onClick={onNewGame}
          data-testid="new-game-button"
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#45a049';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#4caf50';
          }}
        >
          New Game
        </button>
        <button
          style={undoButtonStyle}
          onClick={onUndo}
          disabled={!canUndo}
          data-testid="undo-button"
          onMouseEnter={e => {
            if (canUndo) {
              e.currentTarget.style.backgroundColor = '#1976d2';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = canUndo ? '#2196f3' : '#ccc';
          }}
        >
          Undo
        </button>
      </div>
    </div>
  );
};

export default GameControls;
