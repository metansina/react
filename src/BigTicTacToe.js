import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

function BigSquare({value, onSquareClick, isWinning}) {
  return (
    <button className={`big-square ${isWinning ? 'winning' : ''}`} onClick={onSquareClick}>
      {value}
    </button>
  );
}

function BigBoard({xIsNext, squares, onPlay}) {
  function handleClick(i) {
    if (calculateBigWinner(squares) || squares[i]){
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext){
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    onPlay(nextSquares);
  } 

  const winnerInfo = calculateBigWinner(squares);
  const winner = winnerInfo ? winnerInfo.winner : null;
  const winningLine = winnerInfo ? winnerInfo.line : [];
  
  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  const boardRows = [];
  for (let row = 0; row < 30; row++) {
    const rowSquares = [];
    for (let col = 0; col < 30; col++) {
      const index = row * 30 + col;
      rowSquares.push(
        <BigSquare 
          key={index}
          value={squares[index]} 
          onSquareClick={() => handleClick(index)}
          isWinning={winningLine.includes(index)}
        />
      );
    }
    boardRows.push(
      <div key={row} className="big-board-row">
        {rowSquares}
      </div>
    );
  }

  return (
    <div className="big-board-container">
      <div className="status">{status}</div>
      <div className="big-board">
        {boardRows}
      </div>
    </div>
  );
}

export default function BigTicTacToe() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const playerName = searchParams.get('player');
  
  const [squares, setSquares] = useState(Array(900).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  function handlePlay(nextSquares) {
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  }

  return (
    <div className="game-room">
      <div className="room-header">
        <h2>Big Tic-Tac-Toe - Room {roomId}</h2>
        <p>Player: {playerName}</p>
        <button onClick={() => navigate(`/?player=${encodeURIComponent(playerName)}`)}>Back to Lobby</button>
      </div>
      
      <BigBoard xIsNext={xIsNext} squares={squares} onPlay={handlePlay} />
    </div>
  );
}

function calculateBigWinner(squares) {
  for (let row = 0; row < 30; row++) {
    for (let col = 0; col < 30; col++) {
      const index = row * 30 + col;
      if (!squares[index]) continue;
      
      // Check horizontal
      if (col <= 25) {
        const line = [index, index + 1, index + 2, index + 3, index + 4];
        if (line.every(i => squares[i] === squares[index])) {
          return { winner: squares[index], line };
        }
      }
      
      // Check vertical
      if (row <= 25) {
        const line = [index, index + 30, index + 60, index + 90, index + 120];
        if (line.every(i => squares[i] === squares[index])) {
          return { winner: squares[index], line };
        }
      }
      
      // Check diagonal (top-left to bottom-right)
      if (row <= 25 && col <= 25) {
        const line = [index, index + 31, index + 62, index + 93, index + 124];
        if (line.every(i => squares[i] === squares[index])) {
          return { winner: squares[index], line };
        }
      }
      
      // Check diagonal (top-right to bottom-left)
      if (row <= 25 && col >= 4) {
        const line = [index, index + 29, index + 58, index + 87, index + 116];
        if (line.every(i => squares[i] === squares[index])) {
          return { winner: squares[index], line };
        }
      }
    }
  }
  return null;
}