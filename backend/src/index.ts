import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import songsRouter from './routes/songs';
import playlistsRouter from './routes/playlists';
import playlistSharingRouter from './routes/playlistSharing';
import searchRouter from './routes/search';
import favoritesRouter from './routes/favorites';
import usersRouter from './routes/users';
import artistsRouter from './routes/artists';
import albumsRouter from './routes/albums';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/songs', songsRouter);
// Playlist sharing routes must come first to match specific paths like /playlists/:id/visibility
app.use('/playlists', playlistSharingRouter);
// General playlist routes
app.use('/playlists', playlistsRouter);
app.use('/search', searchRouter);
app.use('/favorites', favoritesRouter);
app.use('/users', usersRouter);
app.use('/artists', artistsRouter);
app.use('/albums', albumsRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  });

export default app;
