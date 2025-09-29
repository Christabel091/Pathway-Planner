# Pathway Planner – Full Stack App

This is the **Pathway Planner** project.  
Tech stack:

- **Frontend**: Vite + React + JS
- **Backend**: Node.js + Express + Prisma (MySQL)
- **Database**: MySQL (provider to be set up)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ (recommend v20 LTS)
- npm (comes with Node)
- Git
- Access to a **MySQL database**

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone git@github.com:Christabel091/Pathway-Planner.git
cd Pathway-Planner
```

---

### 2. Backend Setup

The backend lives in the `backend/` folder.

#### Install dependencies

```bash
cd backend
npm install
```

#### Environment variables

Create a `.env` file inside `backend/` with the following:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME?sslaccept=strict" (url not edited entirely yet. )
PORT=3000
NODE_ENV=development
```

**TODO**: replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DBNAME` once we have a shared MySQL instance.

#### Prisma setup

Prisma was already initialized with MySQL as the datasource.
**TODO**: once DB instance is finalized

- Generate Prisma client:
  ```bash
  npx prisma generate
  ```
- Apply migrations (once DB is ready):
  ```bash
  npx prisma migrate dev --name init
  ```

#### Run backend

```bash
npm run dev
```

---

### 3. Frontend Setup

The frontend lives in the `frontend/` folder.

#### Install dependencies

```bash
cd ../frontend
npm install
```

#### Run frontend

```bash
npm run dev
```

Frontend available at: [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
Pathway-Planner/
  backend/
    prisma/
      schema.prisma   # Prisma schema (DB models)
      seed.js
    src/
      index.js        # Express entry point
    .env              # Backend environment variables
  frontend/
    src/
      App.jsx         # Root React component
      components/     # UI components
    vite.config.js    # Vite configuration
    .env              # (optional frontend env vars, e.g. API URL)
  README.md
```

---

## Next Steps (Team To-Do)

- [ ] Set up a shared MySQL instance (PlanetScale/Aiven/etc).
- [ ] Add the connection string to `backend/.env`.
- [ ] Run migrations (`npx prisma migrate dev`) to sync schema.
- [ ] Seed database if needed (`node prisma/seed.js`).
- [ ] Confirm frontend calls API at `http://localhost:3000` (or Render URL in production).

---

## Useful Commands

### Backend

- Generate Prisma client:
  ```bash
  npx prisma generate
  ```
- Run new migration:
  ```bash
  npx prisma migrate dev --name <migration-name>
  ```
- Apply migrations in prod:
  ```bash
  npx prisma migrate deploy
  ```
- Start dev server:
  ```bash
  npm run dev
  ```

### Frontend

- Start dev server:
  ```bash
  npm run dev
  ```
- Build for production:
  ```bash
  npm run build
  ```
- Preview production build:
  ```bash
  npm run preview
  ```

---

## Deployment

- **Backend**: Deploy Node.js service on [Render](https://render.com/) (or another provider).

  - Build Command: `npm ci && npx prisma generate && npx prisma migrate deploy`
  - Start Command: `node src/index.js`
  - Set `DATABASE_URL` in Render environment variables.

- **Frontend**: Deploy as static site (Render Static Site, Vercel, or Netlify).
  - Build Command: `npm ci && npm run build`
  - Publish Directory: `dist`

---
sayuriiii