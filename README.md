# Express + SQLite Tasks API

A REST API for managing tasks, built with Node.js, Express, and SQLite. Supports full CRUD with filtering, text search, sorting, and pagination.

---

## Tech Stack

- Node.js
- Express v5
- SQLite3

---

## Features

- Create, read, update, and delete tasks
- Filter tasks by completion status
- Full-text search on task titles
- Sort by title or completion status (ascending/descending)
- Paginate results with `limit` and `offset`

---

## Getting Started

### Installation

```bash
git clone git@github.com:timLP79/express-sqlite-tasks-api.git
cd express-sqlite-tasks-api
npm install
```

### Usage

```bash
npm start
```

The API will be available at `http://localhost:3000`.

Example request:

```
GET /tasks?done=1&q=meeting&sort=title&dir=asc
```

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List tasks (filtering, search, sort, pagination) |
| POST | `/tasks` | Create a new task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

---

## Project Structure

```
express-sqlite-tasks-api/
├── src/
│   ├── index.js        # Express app and route handlers
│   └── db.js           # SQLite database setup
├── data.sql            # Database schema
├── requests.http       # Manual HTTP test requests
├── package.json
└── README.md
```

---

## Contact

- Email: timpalacios@u.boisestate.edu
- GitHub: [@timLP79](https://github.com/timLP79)
- LinkedIn: [tim-palacios](https://www.linkedin.com/in/tim-palacios/)
