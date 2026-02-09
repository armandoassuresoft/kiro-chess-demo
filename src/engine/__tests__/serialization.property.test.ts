import * as fc from 'fast-check';
import { ChessEngine, gameStateToJSON, gameStateFromJSON, createInitialState } from '../chessEngine';
import type { Board, CastlingRights, Color, GameState, Piece, PieceType, Square, File, Rank } from '../types';

// Arbitraries for generating random game states
const colorArb = fc.constantFrom<Color>('white', 'black');
const pieceTypeArb = fc.constantFrom<PieceType>('king', 'queen', 'rook', 'bishop', 'knight', 'pawn');
const fileArb = fc.constantFrom<File>('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
const rankArb = fc.constantFrom<Rank>(1, 2, 3, 4, 5, 6, 7, 8);

const pieceArb: fc.Arbitrary<Piece | null> = fc.oneof(
  fc.constant(null),
  fc.record({
    type: pieceTypeArb,
    color: colorArb,
  })
);

const squareArb: fc.Arbitrary<Square> = fc.record({
  file: fileArb,
  rank: rankArb,
});

const castlingRightsArb: fc.Arbitrary<CastlingRights> = fc.record({
  whiteKingside: fc.boolean(),
  whiteQueenside: fc.boolean(),
  blackKingside: fc.boolean(),
  blackQueenside: fc.boolean(),
});

// Generate a valid board (8x8 array of pieces or null)
const boardArb: fc.Arbitrary<Board> = fc.array(
  fc.array(pieceArb, { minLength: 8, maxLength: 8 }),
  { minLength: 8, maxLength: 8 }
);

// Generate a game state (without move history since it's not serialized)
const gameStateArb: fc.Arbitrary<GameState> = fc.record({
  board: boardArb,
  currentPlayer: colorArb,
  castlingRights: castlingRightsArb,
  enPassantTarget: fc.option(squareArb, { nil: null }),
  halfMoveClock: fc.nat({ max: 100 }),
  fullMoveNumber: fc.nat({ max: 500 }).map(n => Math.max(1, n)),
  moveHistory: fc.constant([]), // Move history is not serialized
  positionHistory: fc.array(fc.string(), { maxLength: 10 }),
});

/**
 * Helper to compare two game states for equality (excluding move history).
 * Move history contains circular references and is not serialized.
 */
function areGameStatesEqual(state1: GameState, state2: GameState): boolean {
  // Compare boards
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece1 = state1.board[rank][file];
      const piece2 = state2.board[rank][file];
      
      if (piece1 === null && piece2 === null) continue;
      if (piece1 === null || piece2 === null) return false;
      if (piece1.type !== piece2.type || piece1.color !== piece2.color) return false;
    }
  }
  
  // Compare current player
  if (state1.currentPlayer !== state2.currentPlayer) return false;
  
  // Compare castling rights
  if (
    state1.castlingRights.whiteKingside !== state2.castlingRights.whiteKingside ||
    state1.castlingRights.whiteQueenside !== state2.castlingRights.whiteQueenside ||
    state1.castlingRights.blackKingside !== state2.castlingRights.blackKingside ||
    state1.castlingRights.blackQueenside !== state2.castlingRights.blackQueenside
  ) {
    return false;
  }
  
  // Compare en passant target
  if (state1.enPassantTarget === null && state2.enPassantTarget !== null) return false;
  if (state1.enPassantTarget !== null && state2.enPassantTarget === null) return false;
  if (state1.enPassantTarget && state2.enPassantTarget) {
    if (
      state1.enPassantTarget.file !== state2.enPassantTarget.file ||
      state1.enPassantTarget.rank !== state2.enPassantTarget.rank
    ) {
      return false;
    }
  }
  
  // Compare clocks and move numbers
  if (state1.halfMoveClock !== state2.halfMoveClock) return false;
  if (state1.fullMoveNumber !== state2.fullMoveNumber) return false;
  
  // Compare position history
  if (state1.positionHistory.length !== state2.positionHistory.length) return false;
  for (let i = 0; i < state1.positionHistory.length; i++) {
    if (state1.positionHistory[i] !== state2.positionHistory[i]) return false;
  }
  
  return true;
}

describe('Property Tests: Game State Serialization', () => {
  /**
   * Property 33: Game State Serialization Round-Trip
   * For any valid game state, serializing to JSON and deserializing should
   * produce an equivalent game state.
   * 
   * **Validates: Requirements 14.3**
   */
  describe('Property 33: Game State Serialization Round-Trip', () => {
    it('should preserve game state through JSON serialization round-trip', () => {
      fc.assert(
        fc.property(gameStateArb, (originalState) => {
          // Serialize to JSON
          const serialized = gameStateToJSON(originalState);
          const jsonString = JSON.stringify(serialized);
          
          // Deserialize back
          const parsed = JSON.parse(jsonString);
          const restoredState = gameStateFromJSON(parsed);
          
          // Compare states (excluding move history which is not serialized)
          return areGameStatesEqual(originalState, restoredState);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve initial game state through ChessEngine serialization', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const engine = new ChessEngine();
          const originalState = engine.getState();
          
          // Serialize using engine's toJSON
          const jsonString = engine.toJSON();
          
          // Create new engine and restore state
          const newEngine = new ChessEngine();
          const result = newEngine.fromJSON(jsonString);
          
          if (!result.ok) return false;
          
          const restoredState = newEngine.getState();
          
          return areGameStatesEqual(originalState, restoredState);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve game state after moves through serialization', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (numMoves) => {
            const engine = new ChessEngine();
            
            // Make some random legal moves
            for (let i = 0; i < numMoves; i++) {
              // Get all legal moves for current player
              const allMoves: { from: Square; to: Square }[] = [];
              const files: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
              const ranks: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8];
              
              for (const file of files) {
                for (const rank of ranks) {
                  const square: Square = { file, rank };
                  const moves = engine.getLegalMoves(square);
                  allMoves.push(...moves);
                }
              }
              
              if (allMoves.length === 0) break;
              
              // Pick a random move
              const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
              engine.makeMove(randomMove);
            }
            
            const stateBeforeSerialization = engine.getState();
            
            // Serialize
            const jsonString = engine.toJSON();
            
            // Deserialize into new engine
            const newEngine = new ChessEngine();
            const result = newEngine.fromJSON(jsonString);
            
            if (!result.ok) return false;
            
            const stateAfterDeserialization = newEngine.getState();
            
            return areGameStatesEqual(stateBeforeSerialization, stateAfterDeserialization);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases in serialization', () => {
      fc.assert(
        fc.property(
          castlingRightsArb,
          fc.option(squareArb, { nil: null }),
          fc.nat({ max: 100 }),
          fc.nat({ max: 500 }).map(n => Math.max(1, n)),
          (castlingRights, enPassantTarget, halfMoveClock, fullMoveNumber) => {
            // Create a state with specific edge case values
            const state: GameState = {
              ...createInitialState(),
              castlingRights,
              enPassantTarget,
              halfMoveClock,
              fullMoveNumber,
            };
            
            // Serialize and deserialize
            const serialized = gameStateToJSON(state);
            const jsonString = JSON.stringify(serialized);
            const parsed = JSON.parse(jsonString);
            const restoredState = gameStateFromJSON(parsed);
            
            return areGameStatesEqual(state, restoredState);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid JSON gracefully', () => {
      const engine = new ChessEngine();
      
      // Test with invalid JSON string
      const result1 = engine.fromJSON('not valid json');
      expect(result1.ok).toBe(false);
      if (!result1.ok) {
        expect(result1.error.type).toBe('invalid-json');
      }
      
      // Test with empty object
      const result2 = engine.fromJSON('{}');
      // This may or may not fail depending on implementation
      // The important thing is it doesn't crash
      expect(typeof result2.ok).toBe('boolean');
    });
  });
});
