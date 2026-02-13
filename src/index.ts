import 'dotenv/config';

import { initSocket } from '@lib/socket/socket';
import cors from 'cors';
import express from 'express';
import http from 'http';

import { appConfig } from './config/app';
import authController from './modules/auth/auth.controller';
import meController from './modules/me/me.controller';
import privateConversationController from './modules/private-conversation/private-conversation.controller';
import privateMessageController from './modules/private-message/private-message.controller';
import userController from './modules/user/user.controller';

const app = express();
const { port } = appConfig;

app.use(
    cors({
        credentials: true,
        origin: 'http://localhost:5173',
    })
);

app.use(express.json());

const api = express.Router();

api.get('/', (_req, res) => {
    res.json({ message: 'Chaty API already running' });
});
api.use('/me', meController);
api.use('/auth', authController);
api.use('/private-conversations', privateConversationController);
api.use('/private-messages', privateMessageController);
api.use('/users', userController);

app.use('/api/v1', api);

const server = http.createServer(app);

initSocket(server);

server.listen(port);
