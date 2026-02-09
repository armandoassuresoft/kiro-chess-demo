import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChessBoard } from '../ChessBoard';
import type { GameState, Square, File, Rank } from '../../engine/types';
import { INITIAL_BOARD } from '../../engine/boardUtils';

// Helper to create initial game state
const createInitialGameState = (): GameState => ({
  board: INITIAL_BOARD,
  currentPlayer: 'white',
  castlingRights: {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  },
  enPassantTarget: null,
  halfMoveClock: 0,
  fullMoveNumber: 1,
  moveHistory: [],
  positionHistory: [],
});

describe('ChessBoard', () => {
  const mockOnSquareClick = jest.fn();

  beforeEach(() => {
    mockOnSquareClick.mockClear();
  });

  describe('Initial Position Rendering', () => {
    it('renders an 8x8 chess board', () => {
      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={null}
          legalMoves={[]}
          onSquareClick={mockOnSquareClick}
        />
      );

      const board = screen.getByTestId('chess-board');
      expect(board).not.toBeNull();
      
      // Should have 64 squares
      const squares = screen.getAllByRole('button');
      expect(squares).toHaveLength(64);
    });

    it('renders all 32 pieces in starting positions', () => {
      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={null}
          legalMoves={[]}
          onSquareClick={mockOnSquareClick}
        />
      );

      // White pieces on rank 1
      expect(screen.getByTestId('square-a1').textContent).toContain('♖');
      expect(screen.getByTestId('square-b1').textContent).toContain('♘');
      expect(screen.getByTestId('square-c1').textContent).toContain('♗');
      expect(screen.getByTestId('square-d1').textContent).toContain('♕');
      expect(screen.getByTestId('square-e1').textContent).toContain('♔');
      expect(screen.getByTestId('square-f1').textContent).toContain('♗');
      expect(screen.getByTestId('square-g1').textContent).toContain('♘');
      expect(screen.getByTestId('square-h1').textContent).toContain('♖');

      // White pawns on rank 2
      const files: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      files.forEach(file => {
        expect(screen.getByTestId(`square-${file}2`).textContent).toContain('♙');
      });

      // Black pawns on rank 7
      files.forEach(file => {
        expect(screen.getByTestId(`square-${file}7`).textContent).toContain('♟');
      });

      // Black pieces on rank 8
      expect(screen.getByTestId('square-a8').textContent).toContain('♜');
      expect(screen.getByTestId('square-b8').textContent).toContain('♞');
      expect(screen.getByTestId('square-c8').textContent).toContain('♝');
      expect(screen.getByTestId('square-d8').textContent).toContain('♛');
      expect(screen.getByTestId('square-e8').textContent).toContain('♚');
      expect(screen.getByTestId('square-f8').textContent).toContain('♝');
      expect(screen.getByTestId('square-g8').textContent).toContain('♞');
      expect(screen.getByTestId('square-h8').textContent).toContain('♜');
    });

    it('renders empty squares on ranks 3-6', () => {
      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={null}
          legalMoves={[]}
          onSquareClick={mockOnSquareClick}
        />
      );

      const files: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const emptyRanks: Rank[] = [3, 4, 5, 6];

      emptyRanks.forEach(rank => {
        files.forEach(file => {
          const square = screen.getByTestId(`square-${file}${rank}`);
          // Empty squares should not contain piece symbols
          expect(square.querySelector('[data-testid^="piece-"]')).toBeNull();
        });
      });
    });
  });

  describe('Piece Placement Accuracy', () => {
    it('correctly identifies piece types via data-testid', () => {
      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={null}
          legalMoves={[]}
          onSquareClick={mockOnSquareClick}
        />
      );

      // Check specific piece types are rendered with correct test IDs
      expect(screen.getByTestId('square-e1').querySelector('[data-testid="piece-white-king"]')).not.toBeNull();
      expect(screen.getByTestId('square-d1').querySelector('[data-testid="piece-white-queen"]')).not.toBeNull();
      expect(screen.getByTestId('square-e8').querySelector('[data-testid="piece-black-king"]')).not.toBeNull();
      expect(screen.getByTestId('square-d8').querySelector('[data-testid="piece-black-queen"]')).not.toBeNull();
    });

    it('handles square click events', () => {
      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={null}
          legalMoves={[]}
          onSquareClick={mockOnSquareClick}
        />
      );

      fireEvent.click(screen.getByTestId('square-e2'));
      expect(mockOnSquareClick).toHaveBeenCalledWith({ file: 'e', rank: 2 });
    });
  });

  describe('Square Highlighting States', () => {
    it('highlights selected square', () => {
      const selectedSquare: Square = { file: 'e', rank: 2 };
      
      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={selectedSquare}
          legalMoves={[]}
          onSquareClick={mockOnSquareClick}
        />
      );

      const square = screen.getByTestId('square-e2');
      // Selected squares have green background (#7fc97f)
      expect(square.style.backgroundColor).toBe('rgb(127, 201, 127)');
    });

    it('shows legal move indicators', () => {
      const selectedSquare: Square = { file: 'e', rank: 2 };
      const legalMoves: Square[] = [
        { file: 'e', rank: 3 },
        { file: 'e', rank: 4 },
      ];

      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          onSquareClick={mockOnSquareClick}
        />
      );

      // Legal move squares should have indicators
      const e3Square = screen.getByTestId('square-e3');
      const e4Square = screen.getByTestId('square-e4');
      
      expect(e3Square.querySelector('[data-testid="legal-move-indicator"]')).not.toBeNull();
      expect(e4Square.querySelector('[data-testid="legal-move-indicator"]')).not.toBeNull();
    });

    it('highlights king in check', () => {
      const kingInCheck: Square = { file: 'e', rank: 1 };

      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={null}
          legalMoves={[]}
          onSquareClick={mockOnSquareClick}
          kingInCheck={kingInCheck}
        />
      );

      const kingSquare = screen.getByTestId('square-e1');
      // Check squares have red background (#e74c3c)
      expect(kingSquare.style.backgroundColor).toBe('rgb(231, 76, 60)');
    });

    it('does not show legal move indicator on non-legal squares', () => {
      const selectedSquare: Square = { file: 'e', rank: 2 };
      const legalMoves: Square[] = [{ file: 'e', rank: 3 }];

      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          onSquareClick={mockOnSquareClick}
        />
      );

      // d3 is not a legal move
      const d3Square = screen.getByTestId('square-d3');
      expect(d3Square.querySelector('[data-testid="legal-move-indicator"]')).toBeNull();
    });
  });

  describe('Board Orientation', () => {
    it('renders board with white at bottom by default', () => {
      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={null}
          legalMoves={[]}
          onSquareClick={mockOnSquareClick}
        />
      );

      // First square rendered should be a8 (top-left from white's perspective)
      const squares = screen.getAllByRole('button');
      expect(squares[0].getAttribute('data-square')).toBe('a8');
      // Last square should be h1 (bottom-right)
      expect(squares[63].getAttribute('data-square')).toBe('h1');
    });

    it('renders flipped board with black at bottom', () => {
      render(
        <ChessBoard
          gameState={createInitialGameState()}
          selectedSquare={null}
          legalMoves={[]}
          onSquareClick={mockOnSquareClick}
          isFlipped={true}
        />
      );

      // First square rendered should be h1 (top-left from black's perspective)
      const squares = screen.getAllByRole('button');
      expect(squares[0].getAttribute('data-square')).toBe('h1');
      // Last square should be a8 (bottom-right)
      expect(squares[63].getAttribute('data-square')).toBe('a8');
    });
  });
});
