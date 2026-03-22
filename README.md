# Express + SQLite Tasks API

A full-stack task manager built with Node.js, Express, and SQLite. Includes a clean front-end UI served directly from Express, with full CRUD, filtering, text search, sorting, and inline editing.

---

## Tech Stack

- Node.js
- Express v5
- SQLite3
- Jest + Supertest (testing)

---

## Features

- Create, read, update, and delete tasks
- Filter tasks by completion status
- Full-text search on task titles
- Sort by id, title, or completion status (ascending/descending)

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
| GET | `/health` | Health check |
| GET | `/tasks` | List tasks (filter by `done`, search with `q`, sort with `sort`/`dir`) |
| POST | `/tasks` | Create a new task |
| GET | `/tasks/:id` | Get a single task by id |
| PUT | `/tasks/:id` | Update a task (title and/or done) |
| DELETE | `/tasks/:id` | Delete a task |

---

## Project Structure

```
express-sqlite-tasks-api/
├── src/
│   ├── index.js        # Express app and route handlers
│   └── db.js           # SQLite database setup
├── public/
│   ├── index.html      # Front-end UI
│   ├── styles.css
│   └── app.js
├── tests/
│   ├── setup.js        # Jest setup (points SQLite to :memory:)
│   └── tasks.test.js   # API integration tests (25 tests)
├── data.sql            # Database schema
├── jest.config.js
├── requests.http       # Manual HTTP test requests
├── package.json
└── README.md
```

---

## Testing

Tests use Jest and Supertest. Each test run uses an in-memory SQLite database -- your `data.db` is never touched.

```bash
npm test
```

25 integration tests cover all endpoints: happy paths, validation errors, 404s, partial updates, filtering, search, and deletion confirmation.

---

## Contact

- Email: timpalacios@u.boisestate.edu
- GitHub: [@timLP79](https://github.com/timLP79)
- LinkedIn: [tim-palacios](https://www.linkedin.com/in/tim-palacios/)
