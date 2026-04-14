# Corbin & Hudson - Run and Deploy Guide

This project is full-stack:
- frontend in [frontend](frontend)
- backend in [backend](backend)
- backend also serves frontend static files in production

Current auth flow:
- Site opens directly (no forced login page)
- Header includes Log In and Create A Blog actions
- Login is required for blog operations

## Project structure

- frontend: static UI (HTML + CSS + React via CDN)
- backend: Express API and static hosting for frontend

## 1) Run full-stack locally

From the backend folder, run:

```powershell
cd backend
npm install
```

Set environment variable (PowerShell):

```powershell
$env:JWT_SECRET="replace-with-a-strong-secret"
```

Start server:

```powershell
npm run dev
```

Or:

```powershell
npm start
```

Then open http://localhost:4000

## 1.1) Frontend API setup

In `frontend/index.html`, set this value if needed:

```html
<script>
  window.BLOG_API_URL = "http://localhost:4000/api";
</script>
```

In production, this override is optional. The app can auto-resolve API base URL.

## API routes

- GET /api/health
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me
- GET /api/blogs
- GET /api/blogs?q=design&limit=3
- GET /api/blogs/:id
- POST /api/blogs (requires `Authorization: Bearer <token>` and `editor`/`administrator` role)
- PUT /api/blogs/:id (requires token + `editor`/`administrator`; only owner or administrator)
- DELETE /api/blogs/:id (requires token + `editor`/`administrator`; only owner or administrator)

### Access model

- Visitors can open and read the blog site without logging in.
- Login/signup is used when a user wants to operate blog content (create/update/delete).

## 2) Deploy full-stack on Render (recommended)

This repository already includes [render.yaml](render.yaml), so deployment is quick.

1. Push this repo to GitHub.
2. Open Render dashboard.
3. Click New, then Blueprint.
4. Select this repository.
5. Render detects [render.yaml](render.yaml) and creates one web service.
6. Wait until deploy finishes.
7. Open the generated Render URL.

Render service settings used:
- Root directory: backend
- Build command: npm install
- Start command: npm start
- Environment variable: JWT_SECRET auto-generated

Note:
- Data is currently in-memory, so users and created blogs reset after service restart.

## 3) Frontend-only quick test (optional)

From the frontend folder, run:

```powershell
cd frontend
python -m http.server 5500
```

Then open http://localhost:5500

## 4) Deploy on Netlify (frontend only)

### Option A: Drag and drop
1. Open Netlify dashboard.
2. Go to "Sites" -> "Add new site" -> "Deploy manually".
3. Drag this folder into the upload area.

### Option B: Connect Git repo
1. Push this folder to GitHub.
2. In Netlify, click "Add new site" -> "Import an existing project".
3. Build command: leave empty
4. Publish directory: `frontend`

## 5) Deploy on Vercel

### Option A: Import Git repository
1. Push this folder to GitHub.
2. In Vercel, click "Add New..." -> "Project".
3. Import the repo.
4. Framework preset: Other
5. Build command: empty
6. Output directory: `frontend`

### Option B: Vercel CLI

```powershell
npm i -g vercel
vercel
```

Follow prompts and choose this folder.

## 6) Deploy on GitHub Pages (frontend only)

1. Push project files to a GitHub repository root.
2. Go to repo Settings -> Pages.
3. Source: "Deploy from a branch".
4. Branch: `main` and folder `/frontend`.
5. Save and wait for deployment URL.

## Notes

- This app uses hash routing (`#/page/help-center`), so no rewrite rules are required for deep links.
- If you later switch to path routing (for example `/page/help-center`), add rewrite config for SPA fallback.
