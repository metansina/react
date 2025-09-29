import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Lobby() {
  const [searchParams] = useSearchParams();
  const returnedPlayer = searchParams.get('player');
  
  const [playerName, setPlayerName] = useState(returnedPlayer || '');
  const [isNameSet, setIsNameSet] = useState(!!returnedPlayer);
  const navigate = useNavigate();

  const setName = () => {
    if (playerName.trim()) {
      setIsNameSet(true);
    }
  };

  const selectGame = (gameType) => {
    const roomId = Date.now().toString();
    navigate(`/game/${roomId}?player=${encodeURIComponent(playerName)}&game=${gameType}`);
  };

  if (!isNameSet) {
    return (
      <div className="lobby_1">
        <h1>Welcome to Game Lobby!</h1>
        <div className="name-input">
          <p>Enter your name:</p>
          <input
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setName()}
          />
          <button onClick={setName} disabled={!playerName.trim()}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby_2">
      <h1>Welcome, {playerName}!</h1>
      
      <div className="games-list">
        <h2>Available Games:</h2>
        <div className="game-item" onClick={() => selectGame('tic-tac-toe')}>
          <h3>Tic-Tac-Toe</h3>
          <p>Classic X's and O's game</p>
        </div>
        <div className="game-item" onClick={() => selectGame('big-tic-tac-toe')}>
          <h3>Big Tic-Tac-Toe</h3>
          <p>30x30 board, get 5 in a row to win</p>
        </div>
      </div>
    </div>
  );
}