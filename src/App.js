import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './Lobby';
import GameRoom from './GameRoom';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game/:roomId" element={<GameRoom />} />
      </Routes>
    </Router>
  );
}