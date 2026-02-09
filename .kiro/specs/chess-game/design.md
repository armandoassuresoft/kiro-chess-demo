# Design Document: Chess Game

## Overview

This design document outlines the architecture and implementation details for a chess game application built with React.js and TypeScript. The application provides local two-player gameplay with full chess rule implementation, designed with a clean separation between game logic and UI to support future online multiplayer capabilities.

The architecture follows a modular approach where the Game Engine handles all chess logic independently from the React UI components. This separation enables:
- Easy testing of game logic without UI dependencies
- Future integration with a backend server for online play
- Potential for different UI implementations (web, mobile, CLI)

## Architecture

The application follows a layered architecture with clear boundaries between concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  ChessBoard │  │ GameControls│  │  PromotionDialog    │  │
│  │  Component  │  │  Component  │  │    Component        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      State Management                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              useChessGame Hook                       │    │
│  │  (Bridges UI events to Game Engine)                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Game Engine Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ ChessEngine  │  │ MoveValidator│  │  GameStateChecker│   │
│  │              │  │              │  │                  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ MoveGenerator│  │ BoardUtils   │  │  PositionHash    │   │
│  │              │  │              │  │                  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   GameState                          │    │
│  │  (Serializable, immutable game state)                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Immutable Game State**: All game state is immutable. Each move creates a new state object, enabling easy undo/redo and state comparison for threefold repetition.

2. **Pure Functions for Logic**: Move validation and generation use pure functions, making them easily testable and predictable.

3. **Event-Based Communication**: The engine emits events for state changes, allowing loose coupling with UI or future network layers.

4. **Serializable State**: Game state can be serialized to JSON for persistence or network transmission.

## Components and Interfaces

### Game Engine Components

#### ChessEngine

The main orchestrator that manages game flow and coordinates other components.

```typescript
interface ChessEngine {
  // State queries
  getState(): GameState;
  getCurrentPlayer(): Color;
  getGameStatus(): GameStatus;
  
  // Move operations
  getLegalMoves(square: Square): Move[];
  makeMove(move: Move): Result<GameState, MoveError>;
  undoMove(): Result<GameState, UndoError>;
  
  // Game control
  newGame(): GameState;
  
  // Event subscription
  subscribe(listener: GameEventListener): Unsubscribe;
}
```

#### MoveValidator

Validates moves against chess rules and current game state.

```typescript
interface MoveValidator {
  isLegalMove(state: GameState, move: Move): boolean;
  validateMove(state: GameState, move: Move): Result<ValidMove, MoveError>;
  wouldBeInCheck(state: GameState, move: Move): boolean;
}
```

#### MoveGenerator

Generates all possible moves for pieces, considering board state.

```typescript
interface MoveGenerator {
  generatePieceMoves(state: GameState, square: Square): Move[];
  generateAllLegalMoves(state: GameState, color: Color): Move[];
  generateAttacks(state: GameState, color: Color): Square[];
}
```

#### GameStateChecker

Detects game-ending conditions and special states.

```typescript
interface GameStateChecker {
  isCheck(state: GameState, color: Color): boolean;
  isCheckmate(state: GameState): boolean;
  isStalemate(state: GameState): boolean;
  isDraw(state: GameState): DrawReason | null;
  getGameStatus(state: GameState): GameStatus;
}
```


#### BoardUtils

Utility functions for board operations.

```typescript
interface BoardUtils {
  getPiece(board: Board, square: Square): Piece | null;
  setPiece(board: Board, square: Square, piece: Piece | null): Board;
  isSquareAttacked(state: GameState, square: Square, byColor: Color): boolean;
  getKingSquare(board: Board, color: Color): Square;
}
```

#### PositionHash

Generates position hashes for threefold repetition detection.

```typescript
interface PositionHash {
  hash(state: GameState): string;
  arePositionsEqual(state1: GameState, state2: GameState): boolean;
}
```

### UI Components

#### ChessBoard Component

Renders the chess board and handles piece interaction.

```typescript
interface ChessBoardProps {
  gameState: GameState;
  selectedSquare: Square | null;
  legalMoves: Square[];
  onSquareClick: (square: Square) => void;
  isFlipped?: boolean;
}
```

#### GameControls Component

Provides game control buttons and status display.

```typescript
interface GameControlsProps {
  currentPlayer: Color;
  gameStatus: GameStatus;
  canUndo: boolean;
  onNewGame: () => void;
  onUndo: () => void;
}
```

#### PromotionDialog Component

Modal for selecting pawn promotion piece.

```typescript
interface PromotionDialogProps {
  color: Color;
  onSelect: (pieceType: PromotablePiece) => void;
}
```

#### Square Component

Renders individual board squares with pieces.

```typescript
interface SquareProps {
  square: Square;
  piece: Piece | null;
  isSelected: boolean;
  isLegalMove: boolean;
  isCheck: boolean;
  isDark: boolean;
  onClick: () => void;
}
```

### Custom Hook

#### useChessGame

React hook that bridges UI with the game engine.

```typescript
interface UseChessGameReturn {
  gameState: GameState;
  selectedSquare: Square | null;
  legalMoves: Square[];
  pendingPromotion: PendingPromotion | null;
  gameStatus: GameStatus;
  
  selectSquare: (square: Square) => void;
  makeMove: (to: Square) => void;
  selectPromotion: (pieceType: PromotablePiece) => void;
  newGame: () => void;
  undoMove: () => void;
}
```

## Data Models

### Core Types

```typescript
// Colors
type Color = 'white' | 'black';

// Piece types
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
type PromotablePiece = 'queen' | 'rook' | 'bishop' | 'knight';

// Board coordinates
type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface Square {
  file: File;
  rank: Rank;
}

// Piece representation
interface Piece {
  type: PieceType;
  color: Color;
}

// Board as 8x8 array (rank-major order)
type Board = (Piece | null)[][];
```

### Game State

```typescript
interface GameState {
  board: Board;
  currentPlayer: Color;
  castlingRights: CastlingRights;
  enPassantTarget: Square | null;
  halfMoveClock: number;  // For fifty-move rule
  fullMoveNumber: number;
  moveHistory: MoveRecord[];
  positionHistory: string[];  // Hashes for threefold repetition
}

interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}
```

### Move Representation

```typescript
interface Move {
  from: Square;
  to: Square;
  promotion?: PromotablePiece;
}

interface MoveRecord {
  move: Move;
  piece: Piece;
  captured?: Piece;
  isCheck: boolean;
  isCheckmate: boolean;
  isCastling?: 'kingside' | 'queenside';
  isEnPassant: boolean;
  previousState: GameState;  // For undo
}

type MoveType = 
  | 'normal'
  | 'capture'
  | 'castling-kingside'
  | 'castling-queenside'
  | 'en-passant'
  | 'promotion'
  | 'promotion-capture';
```

### Game Status

```typescript
type GameStatus = 
  | { type: 'active'; inCheck: boolean }
  | { type: 'checkmate'; winner: Color }
  | { type: 'draw'; reason: DrawReason };

type DrawReason = 
  | 'stalemate'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move-rule';
```

### Error Types

```typescript
type MoveError =
  | { type: 'no-piece'; square: Square }
  | { type: 'wrong-color'; expected: Color; actual: Color }
  | { type: 'illegal-move'; reason: string }
  | { type: 'would-be-in-check' }
  | { type: 'game-over' };

type UndoError =
  | { type: 'no-moves-to-undo' };
```

### Result Type

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Event Types

```typescript
type GameEvent =
  | { type: 'move-made'; move: MoveRecord; newState: GameState }
  | { type: 'move-undone'; previousState: GameState }
  | { type: 'game-started'; state: GameState }
  | { type: 'game-over'; status: GameStatus };

type GameEventListener = (event: GameEvent) => void;
type Unsubscribe = () => void;
```

### Pending Promotion State

```typescript
interface PendingPromotion {
  from: Square;
  to: Square;
  color: Color;
}
```


### Initial Board Setup

```typescript
const INITIAL_BOARD: Board = [
  // Rank 1 (white back rank)
  [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' },
  ],
  // Rank 2 (white pawns)
  Array(8).fill({ type: 'pawn', color: 'white' }),
  // Ranks 3-6 (empty)
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  // Rank 7 (black pawns)
  Array(8).fill({ type: 'pawn', color: 'black' }),
  // Rank 8 (black back rank)
  [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' },
  ],
];
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Turn Alternation

*For any* valid move made in a game, the current player should switch to the opponent after the move is executed.

**Validates: Requirements 2.2**

### Property 2: Turn Enforcement

*For any* game state and any attempted move, the move should only be accepted if the piece being moved belongs to the current player.

**Validates: Requirements 2.3, 2.5**

### Property 3: King Movement

*For any* King on the board, the set of pseudo-legal moves (ignoring check) should consist only of squares that are exactly one square away in any direction (horizontal, vertical, or diagonal).

**Validates: Requirements 3.1**

### Property 4: Queen Movement

*For any* Queen on the board, the set of pseudo-legal moves should consist only of squares reachable by moving any number of squares horizontally, vertically, or diagonally, stopping at the first piece encountered.

**Validates: Requirements 3.2**

### Property 5: Rook Movement

*For any* Rook on the board, the set of pseudo-legal moves should consist only of squares reachable by moving any number of squares horizontally or vertically, stopping at the first piece encountered.

**Validates: Requirements 3.3**

### Property 6: Bishop Movement

*For any* Bishop on the board, the set of pseudo-legal moves should consist only of squares reachable by moving any number of squares diagonally, stopping at the first piece encountered.

**Validates: Requirements 3.4**

### Property 7: Knight Movement

*For any* Knight on the board, the set of pseudo-legal moves should consist only of squares that are an L-shape away (two squares in one direction and one square perpendicular), regardless of pieces in between.

**Validates: Requirements 3.5**

### Property 8: Pawn Movement and Capture

*For any* Pawn on the board, the set of pseudo-legal moves should consist of: (a) one square forward if unoccupied, (b) two squares forward from starting rank if both squares are unoccupied, and (c) diagonal captures one square forward if occupied by an enemy piece.

**Validates: Requirements 3.6, 3.7**

### Property 9: Sliding Piece Blocking

*For any* sliding piece (Queen, Rook, Bishop) and any direction of movement, the piece cannot move past the first piece encountered in that direction.

**Validates: Requirements 3.8**

### Property 10: Friendly Piece Blocking

*For any* piece and any potential destination square, if the destination is occupied by a friendly piece, the move should not be in the set of legal moves.

**Validates: Requirements 3.9**

### Property 11: Capture Mechanics

*For any* valid capture move, after execution the captured piece should be removed from the board and the capturing piece should occupy the destination square.

**Validates: Requirements 3.10**

### Property 12: Castling Availability

*For any* game state where the King and relevant Rook have not moved, no pieces are between them, the King is not in check, and the King does not pass through or land on an attacked square, castling should be in the set of legal moves.

**Validates: Requirements 4.1, 4.2**

### Property 13: Castling Execution

*For any* executed castling move, the King should move two squares toward the Rook, and the Rook should move to the square the King crossed.

**Validates: Requirements 4.3, 4.4**

### Property 14: Castling Rights Revocation

*For any* move of the King or a Rook, the corresponding castling rights should be permanently revoked in the resulting game state.

**Validates: Requirements 4.5**

### Property 15: En Passant Availability

*For any* pawn that has just moved two squares forward from its starting position, if an enemy pawn is adjacent on the destination rank, en passant capture should be in the set of legal moves for the enemy pawn on the immediately following turn.

**Validates: Requirements 5.1**

### Property 16: En Passant Execution

*For any* executed en passant capture, the capturing pawn should move diagonally to the square behind the captured pawn, and the captured pawn should be removed from the board.

**Validates: Requirements 5.2**

### Property 17: En Passant Expiration

*For any* en passant opportunity, if not exercised on the immediately following turn, the opportunity should no longer be available in subsequent turns.

**Validates: Requirements 5.3**

### Property 18: Pawn Promotion Requirement

*For any* pawn move that would place the pawn on the opposite back rank (rank 8 for white, rank 1 for black), the move should require a promotion choice.

**Validates: Requirements 6.1**

### Property 19: Pawn Promotion Execution

*For any* pawn promotion, after execution the pawn should be replaced by the chosen piece (Queen, Rook, Bishop, or Knight) of the same color.

**Validates: Requirements 6.3**

### Property 20: Check Detection

*For any* game state where the current player's King is attacked by an enemy piece, the game state should indicate check.

**Validates: Requirements 7.1**

### Property 21: Legal Moves Preserve King Safety

*For any* legal move in any game state, executing that move should not result in the moving player's King being in check.

**Validates: Requirements 7.2, 7.3**

### Property 22: Checkmate Detection

*For any* game state where the current player's King is in check and there are no legal moves, the game status should be checkmate with the opponent as winner.

**Validates: Requirements 8.1, 8.2**

### Property 23: Stalemate Detection

*For any* game state where the current player's King is not in check and there are no legal moves, the game status should be stalemate (draw).

**Validates: Requirements 9.1, 9.2**

### Property 24: Insufficient Material Draw

*For any* game state with only Kings, or King vs King+Bishop, or King vs King+Knight, or King+Bishop vs King+Bishop with same-colored bishops, the game should be a draw by insufficient material.

**Validates: Requirements 10.1**

### Property 25: Threefold Repetition Detection

*For any* game where the same position (board, castling rights, en passant, current player) occurs three times, a draw by threefold repetition should be available.

**Validates: Requirements 10.2**

### Property 26: Fifty-Move Rule Detection

*For any* game where fifty consecutive moves have been made by both players without a pawn move or capture (half-move clock reaches 100), a draw by fifty-move rule should be available.

**Validates: Requirements 10.3**

### Property 27: Invalid Move Rejection

*For any* invalid move attempt, the game state should remain unchanged after the rejection.

**Validates: Requirements 11.3**

### Property 28: New Game Reset

*For any* call to start a new game, the resulting state should be the standard initial chess position with white to move, full castling rights, no en passant, and empty move history.

**Validates: Requirements 12.2**

### Property 29: Undo Restores Previous State

*For any* game with at least one move made, executing undo should restore the game state to exactly what it was before the last move.

**Validates: Requirements 12.4**

### Property 30: Move History Consistency

*For any* sequence of N valid moves from the initial position, the move history should contain exactly N entries, and undoing all moves should return to the initial position.

**Validates: Requirements 13.1**

### Property 31: Half-Move Clock Tracking

*For any* move, the half-move clock should reset to 0 if the move is a pawn move or capture, otherwise it should increment by 1.

**Validates: Requirements 13.4**

### Property 32: Position History Tracking

*For any* move, the position history should contain a hash of the resulting position, and positions should be comparable for threefold repetition.

**Validates: Requirements 13.5**

### Property 33: Game State Serialization Round-Trip

*For any* valid game state, serializing to JSON and deserializing should produce an equivalent game state.

**Validates: Requirements 14.3**


## Error Handling

### Move Validation Errors

| Error Type | Condition | Response |
|------------|-----------|----------|
| `no-piece` | Attempting to move from an empty square | Return error with square location |
| `wrong-color` | Attempting to move opponent's piece | Return error with expected vs actual color |
| `illegal-move` | Move violates piece movement rules | Return error with reason description |
| `would-be-in-check` | Move would leave own King in check | Return error indicating check violation |
| `game-over` | Attempting to move after game has ended | Return error indicating game is over |

### Undo Errors

| Error Type | Condition | Response |
|------------|-----------|----------|
| `no-moves-to-undo` | Undo called with empty move history | Return error, disable undo control |

### UI Error Handling

- Invalid square clicks should be silently ignored
- Clicking on empty squares when no piece is selected should deselect
- Clicking on opponent's pieces should show no legal moves
- Network errors (future) should display user-friendly messages

### State Recovery

- Game state is immutable; invalid operations cannot corrupt state
- Each move stores previous state for reliable undo
- Serialization errors should fall back to new game state

## Testing Strategy

### Dual Testing Approach

This project uses both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across randomly generated inputs

### Testing Framework

- **Unit Testing**: Jest with React Testing Library for component tests
- **Property-Based Testing**: fast-check library for TypeScript
- **Configuration**: Minimum 100 iterations per property test

### Property-Based Test Organization

Each correctness property from the design document should be implemented as a property-based test. Tests should be tagged with:

```typescript
// Feature: chess-game, Property N: [Property Title]
```

### Test Categories

#### Game Engine Tests

1. **Move Generation Tests**
   - Property tests for each piece type's movement rules
   - Edge cases: pieces at board edges, blocked paths
   
2. **Move Validation Tests**
   - Property tests for legal move filtering
   - Check detection and prevention
   - Special move validation (castling, en passant, promotion)

3. **Game State Tests**
   - Property tests for state transitions
   - Checkmate/stalemate detection
   - Draw condition detection
   - Serialization round-trip

4. **History and Undo Tests**
   - Property tests for move history consistency
   - Undo/redo state restoration

#### UI Component Tests

1. **Board Rendering Tests**
   - Initial position rendering
   - Piece placement accuracy
   - Square highlighting

2. **Interaction Tests**
   - Piece selection and deselection
   - Legal move display
   - Promotion dialog

3. **Game Flow Tests**
   - Turn indication
   - Game over display
   - New game reset

### Test File Structure

```
src/
├── engine/
│   ├── __tests__/
│   │   ├── moveGenerator.test.ts
│   │   ├── moveGenerator.property.test.ts
│   │   ├── moveValidator.test.ts
│   │   ├── moveValidator.property.test.ts
│   │   ├── gameStateChecker.test.ts
│   │   ├── gameStateChecker.property.test.ts
│   │   ├── chessEngine.test.ts
│   │   └── chessEngine.property.test.ts
├── components/
│   ├── __tests__/
│   │   ├── ChessBoard.test.tsx
│   │   ├── Square.test.tsx
│   │   ├── GameControls.test.tsx
│   │   └── PromotionDialog.test.tsx
└── hooks/
    └── __tests__/
        └── useChessGame.test.ts
```

### Coverage Goals

- Line coverage: 90%+
- Branch coverage: 85%+
- All 33 correctness properties covered by property tests
- Critical paths covered by unit tests
