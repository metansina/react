import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import Lobby from './Lobby';
import GameRoom from './GameRoom';
import BigTicTacToe from './BigTicTacToe';

function GameRouter() {
  const [searchParams] = useSearchParams();
  const gameType = searchParams.get('game');
  
  if (gameType === 'big-tic-tac-toe') {
    return <BigTicTacToe />;
  }
  return <GameRoom />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game/:roomId" element={<GameRouter />} />
      </Routes>
    </Router>
  );
}