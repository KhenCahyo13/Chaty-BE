import { setUserOnlineStatus } from '@modules/user/user.repository';
import http from 'http';
import { Server } from 'socket.io';

import { markUserConnected, markUserDisconnected } from './socket-presence';
import { registerPrivateCallHandlers } from './socket-private-call';
import {
    emitOfflinePresenceToPrivateConversations,
    registerPrivateConversationHandlers,
} from './socket-private-conversation';

export let io: Server;

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            credentials: true,
            origin: ['http://localhost:5173'],
        },
    });

    io.on('connection', async (socket) => {
        const userId = socket.handshake.auth.userId;

        if (!userId || typeof userId !== 'string') {
            socket.disconnect();
            return;
        }

        // Room per user
        socket.join(`user:${userId}`);
        const joinedPrivateConversationIds =
            registerPrivateConversationHandlers(io, socket, userId);
        registerPrivateCallHandlers(io, socket, userId);

        if (markUserConnected(userId)) {
            try {
                await setUserOnlineStatus(userId, true);
            } catch {
                // noop
            }
        }

        socket.on('disconnect', async () => {
            socket.leave(`user:${userId}`);
            if (!markUserDisconnected(userId)) {
                return;
            }

            const offlineAt = new Date();

            try {
                await setUserOnlineStatus(userId, false);
            } catch {
                // noop
            }

            emitOfflinePresenceToPrivateConversations(
                io,
                joinedPrivateConversationIds,
                userId,
                offlineAt
            );
        });
    });
};
