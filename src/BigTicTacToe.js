import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import socket from './socket';

function BigSquare({value, onSquareClick, isWinning}) {
  return (
    <button className={`big-square ${isWinning ? 'winning' : ''}`} onClick={onSquareClick}>
      {value}
    </button>
  );
}

function BigBoard({xIsNext, squares, onPlay, canPlay, isMyTurn, playersCount, playerName, players, playerLeft}) {
  function handleClick(i) {
    if (calculateBigWinner(squares) || squares[i] || !canPlay){
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
  if (playerLeft) {
    status = 'Second player left the game, you won!';
  } else if (winner) {
    const playerIndex = players.indexOf(playerName);
    const playerSymbol = playerIndex === 0 ? 'X' : 'O';
    if (winner === playerSymbol) {
      status = 'You won! Congratulations!';
    } else {
      status = 'You lost! Don\'t worry, try again!';
    }
  } else if (playersCount < 2) {
    status = 'Waiting for second player...';
  } else if (isMyTurn) {
    status = 'Your turn!';
  } else {
    status = 'Waiting for opponent\'s move...';
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

  const isGameOver = winner || playerLeft;

  return (
    <div className="big-board-container">
      <div className="status">{status}</div>
      {isGameOver && <div className="game-over" style={{marginBottom: '20px'}}>Game over. Return to lobby to start another game.</div>}
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

  useEffect(() => {
    // First register user, then join event with small delay
    socket.emit('userJoin', playerName);
    setTimeout(() => {
      socket.emit('joinEvent', roomId);
    }, 100);
    
    socket.on('gameState', (gameData) => {
      setHistory(gameData.history);
      setCurrentMove(gameData.currentMove);
      setPlayers(gameData.players);
    });
    
    socket.on('playerLeft', () => {
      setPlayerLeft(true);
    });
    
    return () => {
      socket.off('gameState');
      socket.off('playerLeft');
    };
  }, [roomId]);
  
  const [history, setHistory] = useState([Array(900).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [players, setPlayers] = useState([]);
  const [playerLeft, setPlayerLeft] = useState(false);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  
  const playerIndex = players.indexOf(playerName);
  const isMyTurn = playerIndex !== -1 && (currentMove % 2) === playerIndex;
  const canPlay = players.length === 2 && isMyTurn;

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    const nextMove = nextHistory.length - 1;
    
    // send move to server
    socket.emit('makeMove', roomId, nextHistory, nextMove);
  }

  return (
    <div className="game-room">
      <div className="room-header">
        <h2>Big Tic-Tac-Toe - Room {roomId}</h2>
        <p>Player: {playerName}</p>
        <button onClick={() => {
          socket.emit('leaveEvent');
          navigate(`/?player=${encodeURIComponent(playerName)}`);
        }}>Back to Lobby</button>
      </div>
      
      <BigBoard xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} canPlay={canPlay} isMyTurn={isMyTurn} playersCount={players.length} playerName={playerName} players={players} playerLeft={playerLeft} />
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