# 📝 Express + SQLite Tasks API

A simple yet powerful **Tasks API** built with **Express.js** and **SQLite**.  
Supports creating, reading, updating, deleting, filtering, searching, sorting, and pagination of tasks.  
Currently **functional and in active development** 🚀.

---

## ✨ Features
- ➕ **Create** new tasks  
- 📋 **List** tasks with:
  - 🔍 Filtering by completion status
  - 📝 Text search in titles
  - 📊 Sorting by title or completion status
  - 📄 Pagination with `limit` and `offset`  
- ✏️ **Update** existing tasks  
- ❌ **Delete** tasks  
- 💾 **SQLite** for easy local storage  

---

## 📦 Installation
```bash
# Clone this repository
git clone git@github.com:timLP79/express-sqlite-tasks-api.git

# Go inside the project folder
cd express-sqlite-tasks-api

# Install dependencies
npm install
```
---

## ▶️ Usage

```bash
# Start the server
node index.js
```

The API will be available at http://localhost:3000  
Example request: GET /tasks?done=1&q=meeting&sort=title&dir=asc

---

## 🔮 Next Steps
- Planned improvements for future updates:
  - 🛠️ **Add** more robust error handling for invalid query parameters
  - 🧩 **Add** support for partial updates (PATCH)
  - 🗂️ **Implement** task categories for better organization
  - 🧪 **Create** unit tests for core API functions
  - 💻 **Add** a frontend interface to interact with the API visually
