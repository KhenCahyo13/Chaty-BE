import { Server } from 'socket.io';
import http from "http";

export let io: Server;

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173'],
            credentials: true,
        }
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
            console.log(`User ${userId} disconnected`);
            socket.leave(`user:${userId}`);
        });
    });
}