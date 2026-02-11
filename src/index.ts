import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { appConfig } from './config/app';
import authController from './modules/auth/auth.controller';
import privateConversationController from './modules/private-conversation/private-conversation.controller';
import privateMessageController from './modules/private-message/private-message.controller';

const app = express();
const corsMiddleware = cors({
    origin: ['http://localhost:5173'],
});
const { port } = appConfig;

app.use(corsMiddleware);
app.use(express.json());

const api = express.Router();

// Route List
api.get('/', (_req, res) => {
    res.json({ message: 'Chaty API already running' });
});
api.use('/auth', authController);
api.use('/private-conversations', privateConversationController);
api.use('/private-messages', privateMessageController);

app.use('/api/v1', api);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
