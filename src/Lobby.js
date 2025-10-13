import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import socket from './socket';

export default function Lobby() {
  const [searchParams] = useSearchParams();
  const returnedPlayer = searchParams.get('player');
  
  const [playerName, setPlayerName] = useState(returnedPlayer || '');
  const [isNameSet, setIsNameSet] = useState(!!returnedPlayer);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isNameSet) {
      socket.emit('userJoin', playerName);
      socket.emit('request_to_listEvents');
    }

    socket.on('response_for_listEvents', (eventsList) => {
      setEvents(eventsList);
    });

    return () => {
      socket.off('response_for_listEvents');
    };
  }, [isNameSet, playerName]);

  const setName = () => {
    if (playerName.trim()) {
      setIsNameSet(true);
    }
  };

  const createEvent = (gameType) => {
    socket.emit('createEvent', playerName, gameType, (eventId) => {
      const gameParam = gameType === 'big' ? '&game=big-tic-tac-toe' : '';
      navigate(`/game/${eventId}?player=${encodeURIComponent(playerName)}${gameParam}`);
    });
  };

  const joinEvent = (event) => {
    socket.emit('joinEvent', event.id);
    const gameParam = event.gameType === 'big' ? '&game=big-tic-tac-toe' : '';
    navigate(`/game/${event.id}?player=${encodeURIComponent(playerName)}${gameParam}`);
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
        <h2>Create New Game:</h2>
        <div className="game-item" onClick={() => createEvent('standard')}>
          <h3>Standard Tic-Tac-Toe</h3>
          <p>Classic 3x3 board game</p>
        </div>
        <div className="game-item" onClick={() => createEvent('big')}>
          <h3>Big Tic-Tac-Toe</h3>
          <p>30x30 board, get 5 in a row to win</p>
        </div>
      </div>
      
      {events.length > 0 && (
        <div className="events-list">
          <h2>Join Existing Games:</h2>
          {events.map(event => (
            <div key={event.id} className="game-item" onClick={() => joinEvent(event)}>
              <h3>{event.gameType === 'big' ? 'Big Tic-Tac-Toe' : 'Standard Tic-Tac-Toe'}</h3>
              <p>Players: {event.players.join(', ')}</p>
              <p>Created: {new Date(event.createdAt).toLocaleTimeString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}