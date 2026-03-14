import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { exchangeRoutes } from './routes/exchange.js';
import { boardRoutes } from './routes/boards.js';
import { postRoutes } from './routes/posts.js';
import { commentRoutes } from './routes/comments.js';
import { likeRoutes } from './routes/likes.js';
import { uploadRoutes } from './routes/upload.js';
import { notificationRoutes } from './routes/notifications.js';
import { translateRoutes } from './routes/translate.js';
import { chatRoutes } from './routes/chats.js';
import { pushRoutes } from './routes/push.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/exchange', exchangeRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/posts/:postId/comments', commentRoutes);
app.use('/api/posts/:postId/likes', likeRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/push', pushRoutes);

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[K-Connect] Server running on http://localhost:${PORT}`);
});




