import 'dotenv/config';

import { initSocket } from '@lib/socket';
import cors from 'cors';
import express from 'express';
import http from 'http';

import { appConfig } from './config/app';
import authController from './modules/auth/auth.controller';
import privateConversationController from './modules/private-conversation/private-conversation.controller';
import privateMessageController from './modules/private-message/private-message.controller';

const app = express();
const { port } = appConfig;

app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
    })
);

app.use(express.json());

const api = express.Router();

api.get('/', (_req, res) => {
    res.json({ message: 'Chaty API already running' });
});
api.use('/auth', authController);
api.use('/private-conversations', privateConversationController);
api.use('/private-messages', privateMessageController);

app.use('/api/v1', api);

const server = http.createServer(app);

initSocket(server);

server.listen(port, () => {
    console.log(`HTTP + Socket server running on http://localhost:${port}`);
});
