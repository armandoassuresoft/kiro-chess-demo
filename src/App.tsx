import { ChessBoard, GameControls, PromotionDialog } from './components';
import { useChessGame } from './hooks';
import './App.css';
import './styles/chess.css';

/**
 * Main Chess Game Application
 * Integrates ChessBoard, GameControls, and PromotionDialog components
 * Requirements: 1.1, 2.4, 12.1, 12.3
 */
function App() {
  const {
    gameState,
    selectedSquare,
    legalMoves,
    pendingPromotion,
    gameStatus,
    kingInCheck,
    selectSquare,
    selectPromotion,
    newGame,
    undoMove,
  } = useChessGame();

  const canUndo = gameState.moveHistory.length > 0;

  return (
    <div className="chess-app">
      <h1 className="chess-title">Chess</h1>
      
      <div className="chess-container">
        <ChessBoard
          gameState={gameState}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          onSquareClick={selectSquare}
          kingInCheck={kingInCheck}
        />
        
        <GameControls
          currentPlayer={gameState.currentPlayer}
          gameStatus={gameStatus}
          canUndo={canUndo}
          onNewGame={newGame}
          onUndo={undoMove}
        />
      </div>

      {pendingPromotion && (
        <PromotionDialog
          color={pendingPromotion.color}
          onSelect={selectPromotion}
        />
      )}
    </div>
  );
}

export default App;
