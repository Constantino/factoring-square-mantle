import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { DATABASE_CONNECTION_STRING } from '../config/constants';

const pool = new Pool({
    connectionString: DATABASE_CONNECTION_STRING,
});

// Create migrations table to track which migrations have been run
async function ensureMigrationsTable(): Promise<void> {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `;
    await pool.query(createTableQuery);
}

// Get list of executed migrations
async function getExecutedMigrations(): Promise<string[]> {
    const result = await pool.query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map((row) => row.filename);
}

// Mark a migration as executed
async function markMigrationAsExecuted(filename: string): Promise<void> {
    await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
}

// Execute a single migration file
async function executeMigration(filePath: string, filename: string): Promise<void> {
    console.log(`Executing migration: ${filename}`);

    const sql = readFileSync(filePath, 'utf-8');

    // Execute the migration in a transaction
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(sql);
        await markMigrationAsExecuted(filename);
        await client.query('COMMIT');
        console.log(`✓ Successfully executed: ${filename}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`✗ Failed to execute: ${filename}`, error);
        throw error;
    } finally {
        client.release();
    }
}

// Run all pending migrations
export async function runMigrations(): Promise<void> {
    try {
        console.log('Starting migration process...');

        // Ensure migrations table exists
        await ensureMigrationsTable();

        // Get migrations directory
        const migrationsDir = join(__dirname, '.');
        const files = readdirSync(migrationsDir)
            .filter((file) => file.endsWith('.sql'))
            .sort(); // Execute in alphabetical order

        if (files.length === 0) {
            console.log('No migration files found.');
            return;
        }

        // Get already executed migrations
        const executedMigrations = await getExecutedMigrations();

        // Execute pending migrations
        let executedCount = 0;
        for (const file of files) {
            if (executedMigrations.includes(file)) {
                console.log(`⊘ Skipping already executed: ${file}`);
                continue;
            }

            const filePath = join(migrationsDir, file);
            await executeMigration(filePath, file);
            executedCount++;
        }

        if (executedCount === 0) {
            console.log('All migrations are up to date.');
        } else {
            console.log(`\n✓ Migration process completed. ${executedCount} migration(s) executed.`);
        }
    } catch (error) {
        console.error('Migration process failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => {
            console.log('Migrations completed successfully.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migrations failed:', error);
            process.exit(1);
        });
}

