# Task Manager

A simple full-stack Task Manager application.

**Stack:** HTML · CSS · Vanilla JavaScript · PHP · MySQL

---

## Requirements

- PHP 7.4+ with MySQLi extension
- MySQL 5.7+ or MariaDB 10+
- A local web server (Apache via XAMPP/WAMP/Laragon, or PHP's built-in server)

---

## Setup

### 1. Database

Open your MySQL client and run:

```sql
source /path/to/taskmanager/backend/schema.sql
```

Or copy-paste the contents of `backend/schema.sql` into phpMyAdmin and execute.

### 2. Backend

#### Option A — Apache (XAMPP / WAMP / Laragon)

1. Place the entire `taskmanager/` folder inside your web root (e.g. `htdocs/` or `www/`).
2. Make sure `mod_rewrite` is enabled.
3. The API will be available at `http://localhost/taskmanager/backend/tasks`.

#### Option B — PHP built-in server

```bash
cd backend
php -S localhost:8000
```

API will be at `http://localhost:8000/tasks`.

> If using Option B, update `API_BASE` in `frontend/app.js`:
> ```js
> const API_BASE = 'http://localhost:8000/tasks';
> ```

### 3. Database credentials

Edit `backend/index.php` if your MySQL credentials differ from the defaults:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');        // ← your password
define('DB_NAME', 'taskmanager');
```

### 4. Frontend

Open `frontend/index.html` directly in a browser, **or** serve it via the same web server:

```
http://localhost/taskmanager/frontend/
```

---

## API Reference

| Method   | Endpoint        | Body                          | Description        |
|----------|-----------------|-------------------------------|--------------------|
| GET      | /tasks          | —                             | List all tasks     |
| POST     | /tasks          | `{ "title": "..." }`          | Create a task      |
| PATCH    | /tasks/:id      | `{ "completed": true/false }` | Toggle status      |
| PATCH    | /tasks/:id      | `{ "title": "..." }`          | Edit title         |
| DELETE   | /tasks/:id      | —                             | Delete a task      |

All responses are JSON. Errors return `{ "error": "..." }` with an appropriate HTTP status code.

---

## Features

- Add, complete, edit, and delete tasks
- Filter by All / Active / Completed
- Loading and error states
- Dates shown per task

---

## Assumptions & Trade-offs

- **In-MySQL storage** is used (no file-based fallback) — tasks persist across refreshes automatically.
- **No authentication** — this is a demo; a real app would require user sessions.
- **CORS is open** (`*`) for local development. Lock it down in production.
- Frontend is a single-page vanilla JS app — no build step, no dependencies.
- The `.htaccess` rewrite rule requires Apache `mod_rewrite`. If unavailable, append `index.php` to the API path (e.g. `http://localhost/taskmanager/backend/index.php/tasks`).
