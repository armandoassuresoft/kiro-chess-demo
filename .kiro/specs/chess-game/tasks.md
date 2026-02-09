# Implementation Plan: Chess Game

## Overview

This implementation plan breaks down the chess game feature into incremental coding tasks. The approach prioritizes building the core game engine first (with testable logic), then layering UI components on top. Each task builds on previous work, ensuring no orphaned code.

## Tasks

- [x] 1. Project setup and core types
  - [x] 1.1 Initialize React TypeScript project with Vite and configure dependencies
    - Set up project with `npm create vite@latest` using React + TypeScript template
    - Install dependencies: fast-check for property testing, Jest for unit testing
    - Configure Jest and testing environment
    - _Requirements: 14.1, 14.2_
  
  - [x] 1.2 Create core type definitions
    - Create `src/engine/types.ts` with all type definitions from design document
    - Include: Color, PieceType, Square, Piece, Board, GameState, Move, MoveRecord, CastlingRights, GameStatus, DrawReason, MoveError, Result types
    - _Requirements: 14.3_

  - [x] 1.3 Create board utility functions
    - Create `src/engine/boardUtils.ts` with helper functions
    - Implement: getPiece, setPiece, squareToIndex, indexToSquare, getKingSquare, cloneBoard
    - Implement initial board setup constant
    - _Requirements: 1.2, 14.2_

- [-] 2. Implement piece movement generation
  - [x] 2.1 Implement King move generation
    - Create `src/engine/moveGenerator.ts`
    - Implement generateKingMoves function (one square in any direction)
    - _Requirements: 3.1_
  
  - [ ]* 2.2 Write property test for King movement
    - **Property 3: King Movement**
    - **Validates: Requirements 3.1**

  - [x] 2.3 Implement Knight move generation
    - Add generateKnightMoves function (L-shape movement, can jump)
    - _Requirements: 3.5_
  
  - [ ]* 2.4 Write property test for Knight movement
    - **Property 7: Knight Movement**
    - **Validates: Requirements 3.5**

  - [x] 2.5 Implement sliding piece move generation (Rook, Bishop, Queen)
    - Add generateRookMoves, generateBishopMoves, generateQueenMoves functions
    - Implement ray-casting logic that stops at first piece encountered
    - _Requirements: 3.2, 3.3, 3.4, 3.8_
  
  - [ ]* 2.6 Write property tests for sliding pieces
    - **Property 4: Queen Movement**
    - **Property 5: Rook Movement**
    - **Property 6: Bishop Movement**
    - **Property 9: Sliding Piece Blocking**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.8**

  - [x] 2.7 Implement Pawn move generation
    - Add generatePawnMoves function
    - Handle: single forward, double forward from start, diagonal captures
    - _Requirements: 3.6, 3.7_
  
  - [ ]* 2.8 Write property test for Pawn movement
    - **Property 8: Pawn Movement and Capture**
    - **Validates: Requirements 3.6, 3.7**

  - [x] 2.9 Implement friendly piece blocking
    - Update all move generators to exclude squares occupied by friendly pieces
    - _Requirements: 3.9_
  
  - [ ]* 2.10 Write property test for friendly piece blocking
    - **Property 10: Friendly Piece Blocking**
    - **Validates: Requirements 3.9**

- [x] 3. Checkpoint - Core move generation complete
  - Ensure all tests pass, ask the user if questions arise.


- [-] 4. Implement check detection and move validation
  - [x] 4.1 Implement attack detection
    - Create `src/engine/gameStateChecker.ts`
    - Implement isSquareAttacked function to determine if a square is under attack
    - Implement isCheck function to detect if a King is in check
    - _Requirements: 7.1_
  
  - [ ]* 4.2 Write property test for check detection
    - **Property 20: Check Detection**
    - **Validates: Requirements 7.1**

  - [x] 4.3 Implement move validation
    - Create `src/engine/moveValidator.ts`
    - Implement isLegalMove that filters out moves leaving King in check
    - Implement generateAllLegalMoves that returns only legal moves
    - _Requirements: 7.2, 7.3, 11.1, 11.2_
  
  - [ ]* 4.4 Write property test for King safety
    - **Property 21: Legal Moves Preserve King Safety**
    - **Validates: Requirements 7.2, 7.3**

  - [x] 4.5 Implement capture mechanics
    - Update move execution to handle captures (remove captured piece)
    - _Requirements: 3.10_
  
  - [ ]* 4.6 Write property test for capture mechanics
    - **Property 11: Capture Mechanics**
    - **Validates: Requirements 3.10**

- [x] 5. Implement special moves
  - [x] 5.1 Implement castling logic
    - Add castling move generation with all conditions (King/Rook not moved, no pieces between, not in/through/into check)
    - Implement castling execution (move both King and Rook)
    - Track castling rights in game state
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 5.2 Write property tests for castling
    - **Property 12: Castling Availability**
    - **Property 13: Castling Execution**
    - **Property 14: Castling Rights Revocation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

  - [x] 5.3 Implement en passant logic
    - Track en passant target square after double pawn moves
    - Add en passant capture to pawn move generation
    - Implement en passant execution (capture pawn on different square)
    - Clear en passant opportunity after one turn
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 5.4 Write property tests for en passant
    - **Property 15: En Passant Availability**
    - **Property 16: En Passant Execution**
    - **Property 17: En Passant Expiration**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 5.5 Implement pawn promotion logic
    - Detect when pawn reaches back rank
    - Require promotion piece selection
    - Execute promotion (replace pawn with chosen piece)
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [x] 5.6 Write property tests for pawn promotion
    - **Property 18: Pawn Promotion Requirement**
    - **Property 19: Pawn Promotion Execution**
    - **Validates: Requirements 6.1, 6.3**

- [x] 6. Checkpoint - Special moves complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement game end detection
  - [x] 7.1 Implement checkmate detection
    - Add isCheckmate function (in check with no legal moves)
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 7.2 Write property test for checkmate
    - **Property 22: Checkmate Detection**
    - **Validates: Requirements 8.1, 8.2**

  - [x] 7.3 Implement stalemate detection
    - Add isStalemate function (not in check with no legal moves)
    - _Requirements: 9.1, 9.2_
  
  - [ ]* 7.4 Write property test for stalemate
    - **Property 23: Stalemate Detection**
    - **Validates: Requirements 9.1, 9.2**

  - [x] 7.5 Implement draw conditions
    - Implement insufficient material detection (K vs K, K+B vs K, K+N vs K, K+B vs K+B same color)
    - Implement threefold repetition detection using position hashing
    - Implement fifty-move rule detection using half-move clock
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 7.6 Write property tests for draw conditions
    - **Property 24: Insufficient Material Draw**
    - **Property 25: Threefold Repetition Detection**
    - **Property 26: Fifty-Move Rule Detection**
    - **Validates: Requirements 10.1, 10.2, 10.3**


- [x] 8. Implement chess engine orchestrator
  - [x] 8.1 Create ChessEngine class
    - Create `src/engine/chessEngine.ts`
    - Implement getState, getCurrentPlayer, getGameStatus methods
    - Implement getLegalMoves, makeMove methods
    - Implement event subscription system
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.2, 14.5_
  
  - [ ]* 8.2 Write property tests for turn mechanics
    - **Property 1: Turn Alternation**
    - **Property 2: Turn Enforcement**
    - **Validates: Requirements 2.2, 2.3, 2.5**

  - [x] 8.3 Implement new game and undo functionality
    - Implement newGame method (reset to initial state)
    - Implement undoMove method (restore previous state from history)
    - _Requirements: 12.2, 12.4, 12.5_
  
  - [ ]* 8.4 Write property tests for game controls
    - **Property 27: Invalid Move Rejection**
    - **Property 28: New Game Reset**
    - **Property 29: Undo Restores Previous State**
    - **Validates: Requirements 11.3, 12.2, 12.4**

  - [x] 8.5 Implement state tracking
    - Implement move history tracking
    - Implement half-move clock updates (reset on pawn move/capture)
    - Implement position history for threefold repetition
    - _Requirements: 13.1, 13.4, 13.5_
  
  - [ ]* 8.6 Write property tests for state tracking
    - **Property 30: Move History Consistency**
    - **Property 31: Half-Move Clock Tracking**
    - **Property 32: Position History Tracking**
    - **Validates: Requirements 13.1, 13.4, 13.5**

  - [x] 8.7 Implement game state serialization
    - Add toJSON and fromJSON methods for GameState
    - Ensure round-trip serialization preserves all state
    - _Requirements: 14.3_
  
  - [x] 8.8 Write property test for serialization
    - **Property 33: Game State Serialization Round-Trip**
    - **Validates: Requirements 14.3**

- [x] 9. Checkpoint - Game engine complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement UI components
  - [x] 10.1 Create Square component
    - Create `src/components/Square.tsx`
    - Render square with correct light/dark color
    - Display piece image/icon when occupied
    - Show selection highlight, legal move indicator, check indicator
    - Handle click events
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 10.2 Create ChessBoard component
    - Create `src/components/ChessBoard.tsx`
    - Render 8x8 grid of Square components
    - Pass game state, selection state, and legal moves to squares
    - Handle square click delegation
    - _Requirements: 1.1, 1.2_
  
  - [x] 10.3 Write unit tests for board rendering
    - Test initial position renders correctly
    - Test piece placement accuracy
    - Test square highlighting states
    - _Requirements: 1.1, 1.2_

  - [x] 10.4 Create PromotionDialog component
    - Create `src/components/PromotionDialog.tsx`
    - Display modal with Queen, Rook, Bishop, Knight options
    - Handle piece selection callback
    - _Requirements: 6.2_
  
  - [x] 10.5 Create GameControls component
    - Create `src/components/GameControls.tsx`
    - Display current player indicator
    - Display game status (active, check, checkmate, draw)
    - Provide New Game and Undo buttons
    - _Requirements: 2.4, 8.3, 9.3, 10.4, 12.1, 12.3_

- [x] 11. Implement useChessGame hook
  - [x] 11.1 Create useChessGame hook
    - Create `src/hooks/useChessGame.ts`
    - Initialize ChessEngine instance
    - Expose game state, selected square, legal moves, pending promotion
    - Implement selectSquare, makeMove, selectPromotion, newGame, undoMove handlers
    - _Requirements: 1.5, 1.6, 2.1, 2.2, 2.3_
  
  - [x] 11.2 Write unit tests for useChessGame hook
    - Test piece selection and deselection
    - Test move execution flow
    - Test promotion flow
    - _Requirements: 1.5, 1.6_

- [x] 12. Wire up main application
  - [x] 12.1 Create main App component
    - Create `src/App.tsx`
    - Integrate ChessBoard, GameControls, PromotionDialog
    - Connect useChessGame hook to components
    - Add basic styling/layout
    - _Requirements: 1.1, 2.4, 12.1, 12.3_
  
  - [x] 12.2 Add CSS styling
    - Create `src/styles/chess.css`
    - Style board, squares, pieces
    - Style highlights (selection, legal moves, check)
    - Style game controls and promotion dialog
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 13. Final checkpoint - Full integration complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all requirements are implemented
  - Run full test suite including property tests

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- The game engine is fully testable independent of UI
- Architecture supports future online multiplayer extension
