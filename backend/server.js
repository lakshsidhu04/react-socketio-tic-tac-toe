const http = require('http');
const path = require('path');
const cors = require('cors');
const express = require('express');
const { Server } = require('socket.io');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: '*'
}));

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

let waitingPlayer = null;
let players = {};

io.on('connection', (socket) => {
    console.log('A user connected with id', socket.id);

    socket.on('join', (playerName) => {
        console.log(`Player joined: ${playerName}`);
        players[socket.id] = playerName;

        if (waitingPlayer) {
            console.log('Starting game');
            const player1 = { id: waitingPlayer, name: players[waitingPlayer] };
            const player2 = { id: socket.id, name: playerName };
            const num = Math.random();
            console.log(num);
            const currentTurn = num < 0.5 ? player1.id : player2.id;

            io.emit('gamestart', {
                player1,
                player2,
                currentTurn
            });

            waitingPlayer = null;
        } else {
            waitingPlayer = socket.id;
            console.log('Waiting for another player');
        }
    });

    socket.on('move', (data) => {
        io.emit('move', data);
    });

    socket.on('exit', () => {
        console.log(`Player ${players[socket.id]} exited the game`);
        const opponentId = Object.keys(players).find(id => id !== socket.id);
        if (opponentId) {
            io.to(opponentId).emit('opponentExit');
        }
        delete players[socket.id];
    });

    socket.on('disconnect', () => {
        console.log('User disconnected with id', socket.id);
        if (waitingPlayer === socket.id) {
            waitingPlayer = null;
        }
        delete players[socket.id];
    });
});

server.listen(3000, () => {
    console.log('Listening on *:3000');
});
