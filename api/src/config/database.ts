import { Pool } from 'pg';
import { DATABASE_CONNECTION_STRING } from './constants';

if (!DATABASE_CONNECTION_STRING) {
    console.error('ERROR: DATABASE_CONNECTION_STRING is not set in environment variables');
    console.error('Please check your .env file and ensure DATABASE_CONNECTION_STRING is configured');
}

export const pool = new Pool({
    connectionString: DATABASE_CONNECTION_STRING,
});

// Test the connection
pool.on('connect', () => {
    console.log('Database connected successfully');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Don't exit in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
        console.error('Database connection error details:', {
            message: err.message,
            code: (err as any).code,
            address: (err as any).address,
            port: (err as any).port
        });
    }
});

// Test database connection on startup
export const testConnection = async (): Promise<void> => {
    try {
        if (!DATABASE_CONNECTION_STRING) {
            throw new Error('DATABASE_CONNECTION_STRING is not configured');
        }
        const result = await pool.query('SELECT NOW()');
        console.log('Database connection test successful:', result.rows[0]);
    } catch (error) {
        console.error('Database connection test failed:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                code: (error as any).code
            });
        }
        throw error;
    }
};

