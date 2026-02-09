import { useCallback, useEffect } from 'react';
import { ChessBoard, GameControls, PromotionDialog, CapturedPieces, MoveHistory } from './components';
import { MaterialAdvantage } from './components/MaterialAdvantage';
import { useChessGame } from './hooks';
import './App.css';
import './styles/chess.css';

function App() {
  const {
    gameState,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    gameStatus,
    kingInCheck,
    lastMove,
    isFlipped,
    soundEnabled,
    selectSquare,
    handleDragMove,
    selectPromotion,
    newGame,
    undoMove,
    flipBoard,
    toggleSound,
    exportPGN,
  } = useChessGame();

  const canUndo = gameState.moveHistory.length > 0;

  const handleExportPGN = useCallback(() => {
    const pgn = exportPGN();
    if (!pgn) return;
    
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportPGN]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undoMove();
      } else if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        newGame();
      } else if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        flipBoard();
      } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        toggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoMove, newGame, flipBoard, toggleSound]);

  return (
    <div className="chess-app">
      <h1 className="chess-title">Chess</h1>
      
      <div className="chess-container">
        <div className="game-main">
          <div className="board-wrapper">
            <ChessBoard
              gameState={gameState}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              onSquareClick={selectSquare}
              kingInCheck={kingInCheck}
              lastMove={lastMove}
              isFlipped={isFlipped}
              onDragMove={handleDragMove}
            />
          </div>
          
          <div className="board-controls">
            <button 
              className={`btn-icon ${isFlipped ? 'active' : ''}`}
              onClick={flipBoard}
              title="Flip board (F)"
              aria-label="Flip board"
            >
              ⇅
            </button>
            <button 
              className={`btn-icon ${soundEnabled ? 'active' : ''}`}
              onClick={toggleSound}
              title="Toggle sound (S)"
              aria-label="Toggle sound"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button 
              className="btn-icon"
              onClick={handleExportPGN}
              title="Export PGN"
              aria-label="Export game as PGN"
              disabled={gameState.moveHistory.length === 0}
            >
              ⬇
            </button>
          </div>
        </div>
        
        <div className="side-panel">
          <GameControls
            currentPlayer={gameState.currentPlayer}
            gameStatus={gameStatus}
            canUndo={canUndo}
            onNewGame={newGame}
            onUndo={undoMove}
          />
          
          <CapturedPieces moveHistory={gameState.moveHistory} />
          
          <MaterialAdvantage moveHistory={gameState.moveHistory} />
          
          <MoveHistory moveHistory={gameState.moveHistory} />
        </div>
      </div>

      {pendingPromotion && (
        <PromotionDialog
          color={pendingPromotion.color}
          onSelect={selectPromotion}
        />
      )}
      
      <div className="keyboard-hints">
        <span>F: Flip</span>
        <span>S: Sound</span>
        <span>Ctrl+Z: Undo</span>
      </div>
    </div>
  );
}

export default App;
