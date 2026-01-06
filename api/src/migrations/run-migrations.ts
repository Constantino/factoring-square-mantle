#!/usr/bin/env node
import { runMigrations } from './runner';

runMigrations()
    .then(() => {
        console.log('Migrations completed successfully.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migrations failed:', error);
        process.exit(1);
    });

