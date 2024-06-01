import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import 'tailwindcss/tailwind.css';

function App() {
  const [gameStart, setGameStart] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [player, setPlayer] = useState({ id: '', name: '' });
  const [currentTurn, setCurrentTurn] = useState('');
  const [cells, setCells] = useState(Array(9).fill(-1));
  const [socket, setSocket] = useState(null);
  const [player1, setPlayer1] = useState({ id: '', name: '' });
  const [player2, setPlayer2] = useState({ id: '', name: '' });

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('gamestart', (data) => {
      setGameStart(true);
      setPlayer({ id: newSocket.id, name: data.currentTurn === newSocket.id ? data.player1.name : data.player2.name });
      setPlayer1(data.player1);
      setPlayer2(data.player2);
      setCurrentTurn(data.currentTurn);
      setFormSubmitted(false);
    });

    newSocket.on('move', (data) => {
      setCells(data.cells);
      setCurrentTurn(data.currentTurn);
    });

    newSocket.on('opponentExit', () => {
      alert('Your opponent has left the game. You win!');
      resetGame();
    });

    return () => newSocket.disconnect();
  }, []);

  const handleClick = (cell) => {
    if (player.id === currentTurn && cells[cell] === -1) {
      const newCells = [...cells];
      newCells[cell] = player.id === player1.id ? 0 : 1;
      setCells(newCells);
      const newTurn = player.id === player1.id ? player2.id : player1.id;
      setCurrentTurn(newTurn);
      if (socket) {
        socket.emit('move', { cells: newCells, currentTurn: newTurn });
      }
      const winner = checkWinner(newCells);
      if (winner !== -1) {
        alert(`Player ${winner === 0 ? player1.name : player2.name} wins!`);
        resetGame();
      } else if (newCells.every(cell => cell !== -1)) {
        alert('Game is a draw!');
        resetGame();
      }
    } else {
      alert("It's not your turn or the cell is already taken!");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    if (socket && player.name) {
      socket.emit('join', player.name);
    }
  };

  const handleExit = () => {
    if (socket) {
      socket.emit('exit');
    }
    resetGame();
  };

  const checkWinner = (cells) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (cells[a] !== -1 && cells[a] === cells[b] && cells[a] === cells[c]) {
        return cells[a];
      }
    }

    return -1;
  };

  const resetGame = () => {
    setCells(Array(9).fill(-1));
    setGameStart(false);
    setFormSubmitted(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-4">Tic Tac Toe</h1>

      {formSubmitted && !gameStart && (
        <div className="waiting flex justify-center text-center mb-4">
          <p className="text-lg">Waiting for other players...</p>
        </div>
      )}

      {!formSubmitted && !gameStart && (
        <div className="form flex justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <input
              type="text"
              name="player"
              id="player"
              placeholder="Enter name"
              value={player.name}
              onChange={(e) => setPlayer({ ...player, name: e.target.value })}
              className="mb-2 p-2 border border-gray-300 rounded"
            />
            <input
              type="submit"
              value="Find Players"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 cursor-pointer"
            />
          </form>
        </div>
      )}

      {gameStart && (
        <>
          <div className="game-grid grid grid-cols-3 gap-2 max-w-sm mx-auto mt-4">
            {cells.map((cell, index) => (
              <div
                key={index}
                className="cell w-24 h-24 flex items-center justify-center border border-gray-300 text-4xl font-bold cursor-pointer hover:bg-gray-100"
                onClick={() => handleClick(index)}
              >
                {cell === 0 ? 'X' : cell === 1 ? 'O' : ''}
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <p className="text-lg">Current Turn: {currentTurn === player1.id ? player1.name : player2.name}</p>
          </div>

          <div className="text-center mt-4">
            <button onClick={resetGame} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
              Restart Game
            </button>
          </div>

          <div className="text-center mt-4">
            <button onClick={handleExit} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700">
              Exit Game
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
