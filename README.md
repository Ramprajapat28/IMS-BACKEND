# Fitistan IMS - Backend

## Overview
This is the backend service for the Fitistan Inventory Management System. It provides APIs for managing products, inventory items, orders, and locations.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Query Builder**: Knex.js
- **Migrations**: Knex Migrations

## Setup & Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your environment:

   - Update `PGHOST`, `PGUSER`, `PGPASSWORD`, and other database credentials.
3. Database Migrations:
   ```bash
   npx knex migrate:latest
   ```
4. Start the server:
   ```bash
   npm start
   ```

## API Documentation
The API follow a standard RESTful structure. Key modules include:
- `/products`: Product template management.
- `/inventory`: Individual item tracking and location management.
- `/orders`: Processing sales and returns.

For deep technical details on managers, models, and categorization logic, see [BACKEND_GUIDE.md](./BACKEND_GUIDE.md).
