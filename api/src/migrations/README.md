# Database Migrations

This directory contains SQL migration files for the database schema.

## Running Migrations

### Development
```bash
npm run migrate
```

### Production (after building)
```bash
npm run build
npm run migrate:prod
```

## How It Works

1. The migration runner automatically creates a `migrations` table to track which migrations have been executed.
2. Migration files are executed in alphabetical order (by filename).
3. Each migration is run in a transaction - if it fails, it will be rolled back.
4. Once a migration is successfully executed, it is marked as completed and won't run again.

## Creating New Migrations

1. Create a new SQL file in this directory with a descriptive name, e.g., `002_add_new_column.sql`
2. The file should contain valid PostgreSQL SQL statements
3. Run `npm run migrate` to execute the new migration

## Migration Files

- `001_create_borrower_kybs_table.sql` - Creates the BorrowerKYBs table with all required fields

