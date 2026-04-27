Local database setup (SQLite + Prisma)

1. Install dependencies

```bash
cd backend
npm install
```

2. Ensure `backend/.env` contains a `DATABASE_URL`. For local SQLite the default is:

```
DATABASE_URL="file:./dev.db"
```

3. Generate Prisma client

```bash
npx prisma generate
```

4. Create and apply migrations (this will create `dev.db`)

```bash
npx prisma migrate dev --name init
```

5. Seed the database with the existing in-repo seed data

```bash
node prisma/seed.js
# or
npm run prisma:seed
```

6. Start the backend

```bash
npm start
# or for dev with auto-restart
npm run dev
```

Notes:
- This project uses SQLite for local development. Switching to PostgreSQL or another provider requires updating `prisma/schema.prisma` and setting `DATABASE_URL` to a compatible connection string.
- The API endpoints remain the same; the server now persists users, blogs, pages and drops to the database.
