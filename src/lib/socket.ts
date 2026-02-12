import http from 'http';
import { Server } from 'socket.io';

export let io: Server;

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            credentials: true,
            origin: ['http://localhost:5173'],
        },
    });

    io.on('connection', (socket) => {
        const userId = socket.handshake.auth.userId;

        if (!userId) {
            socket.disconnect();
            return;
        }

        // Room per user
        socket.join(`user:${userId}`);

        socket.on('disconnect', () => {
            socket.leave(`user:${userId}`);
        });
    });
};
