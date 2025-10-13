import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import socket from './socket';

function Square({value, onSquareClick, isWinning}) {
  return (
    <button className={`square ${isWinning ? 'winning' : ''}`} onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({xIsNext, squares, onPlay, canPlay, isMyTurn, playersCount, playerName, players, playerLeft}) {
  function handleClick(i) {
    if (calculateWinner(squares) || squares[i] || !canPlay){
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

  const winnerInfo = calculateWinner(squares);
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
  } else if (squares.every(square => square !== null)) {
    status = 'Draw!';
  } else if (playersCount < 2) {
    status = 'Waiting for second player...';
  } else if (isMyTurn) {
    status = 'Your turn!';
  } else {
    status = 'Waiting for opponent\'s move...';
  }

  const boardRows = [];
  for (let row = 0; row < 3; row++) {
    const rowSquares = [];
    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      rowSquares.push(
        <Square 
          key={index}
          value={squares[index]} 
          onSquareClick={() => handleClick(index)}
          isWinning={winningLine.includes(index)}
        />
      );
    }
    boardRows.push(
      <div key={row} className="board-row">
        {rowSquares}
      </div>
    );
  }

  const isGameOver = winner || squares.every(square => square !== null) || playerLeft;

  return (
    <>
      <div className="status">{status}</div>
      {isGameOver && <div className="game-over" style={{marginBottom: '20px'}}>Game over. Return to lobby to start another game.</div>}
      {boardRows}
    </>
  );
}

export default function GameRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const playerName = searchParams.get('player');
  const isHost = searchParams.get('host') === 'true';

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
  
  const [history, setHistory] = useState([Array(9).fill(null)]);
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
        <h2>Room {roomId}</h2>
        <p>Player: {playerName} {isHost && '(Host)'}</p>
        <button onClick={() => {
          socket.emit('leaveEvent');
          navigate(`/?player=${encodeURIComponent(playerName)}`);
        }}>Back to Lobby</button>
      </div>
      
      <div className="game">
        <div className="game-board">
          <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} canPlay={canPlay} isMyTurn={isMyTurn} playersCount={players.length} playerName={playerName} players={players} playerLeft={playerLeft} />
        </div>

      </div>
    </div>
  );
}

function calculateWinner (squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  } 
  return null;
}