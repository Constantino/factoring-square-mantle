import 'dotenv/config';
import express, { Application } from 'express';
import { PORT } from './config/constants';
import { testConnection } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(express.json());

// Routes
app.use('/', routes);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
    try {
        // Test database connection before starting server
        await testConnection();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

