const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

//simple health check
app.get('/health', (req, res) => res.json({ok: true}));

//Get all tasks
app.get('/tasks', (req, res) => {
    let sql = 'SELECT id, title, done FROM tasks';
    const conditions = [];
    const params = [];

    const {done} = req.query;
    if (done !== undefined) {
        if (done !== '0' && done !== '1') {
            res.status(400).json({error: 'done must be 0 or 1'});
            return;
        }
        conditions.push('done = ?');
        params.push(Number(done));
    }
    const {q} = req.query;
    if (q !== undefined) {
        if (typeof q !== 'string' || !q.trim()) {
            return res.status(400).json({error: 'q must be a non-empty string'});
        }
        conditions.push('LOWER(title) LIKE ?');
        params.push(`%${q.trim().toLocaleLowerCase()}%`);
    }
    const {sort, dir} = req.query;

    // Whitelist and defaults
    const SORT_COLUMNS = new Set(['id', 'title', 'done']);
    let sortCol = sort ? String(sort).toLowerCase() : 'id';
    let sortDir = dir ? String(dir).toLowerCase() : 'asc';

    // Validate
    if (!SORT_COLUMNS.has(sortCol)) {
        return res.status(400).json({error: 'sort must be one of: id, title, done'});
    }
    if (sortDir !== 'asc' && sortDir !== 'desc') {
        return res.status(400).json({error: "dir must be 'asc' or 'desc'"});
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ` ORDER BY ${sortCol} ${sortDir.toLocaleUpperCase()}`;
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Failed to retrieve tasks:', err.message);
            return res.status(500).json({error: 'failed to retrieve tasks'});
        }
        console.log('GET /tasks', {sql, params, count: rows.length});
        res.json(rows);
    })
});

//create task
app.post('/tasks', (req, res) => {
    const {title} = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({error: 'title required (non-empty string)'});
    }
    const sql = 'INSERT INTO tasks (title, done) VALUES (?, 0)';
    db.run(sql, [title.trim()], function (err) {
        if (err) {
            console.error('Insert failed:', err.message);
            return res.status(500).json({error: 'failed to create task'});
        }
        // this.lastID is the new row id
        db.get('SELECT id, title, done FROM tasks WHERE id = ?', [this.lastID], (err2, row) => {
            if (err2) {
                console.error('Fetch after insert failed:', err2.message);
                return res.status(500).json({error: 'failed to fetch created task'});
            }
            console.log('Created task:', row);
            res.status(201).json(row);
        });
    });
});

// Get on task by id
app.get('/tasks/:id', (req, res) => {
    const {id} = req.params;
    const sql = 'SELECT id, title, done FROM tasks WHERE id = ?';
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('Failed to retrieve task:', err.message);
            return res.status(500).json({error: 'task not found'});
        }
        if (!row) return res.status(404).json({error: 'task not found'});
        console.log('Fetched task:', row);
        res.json(row);
    });
});

// Update a task (partial: title and/or done)
app.put('/tasks/:id', (req, res) => {
    const {id} = req.params;
    let {title, done} = req.body;

    // If nothing to update:
    const hasTitle = typeof title == 'string';
    const hasDone = done === 0 || done === 1 || done === '0' || done === '1';
    if (!hasTitle && !hasDone) {
        return res.status(400).json({error: 'provide title (string) and/or done(0 or 1)'});
    }

    //Normalize inputs
    if (hasTitle) {
        title = title.trim();
        if (!title) return res.status(400).json({error: 'title cannot be empty'});
    } else {
        title = null; // keep current via COALESCE
    }
    if (hasDone) {
        done = Number(done);
        if (!(done === 0 || done === 1)) {
            return res.status(400).json({error: 'done must be 0 or 1'});
        }
    } else {
        done = null; // keep current via COALESCE
    }
    const sql = `
        UPDATE tasks
        SET title = COALESCE(?, title),
            done  = COALESCE(?, done)
        WHERE id = ?
    `;
    db.run(sql, [title, done, id], function (err) {
        if (err) {
            console.error('Update failed:', err.message);
            return res.status(500).json({error: 'failed to update task'});
        }
        if (this.changes === 0) return res.status(400).json({error: 'task not found'});

        db.get('SELECT id, title, done FROM tasks WHERE id = ?', [id], (err2, row) => {
            if (err2) {
                console.error('Fetch after update failed', err2.message);
                return res.status(500).json({error: 'failed to fetch updated task'});
            }
            console.log('Updated task:', row);
            res.json(row);
        });
    });
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
    const {id} = req.params;
    const sql = 'DELETE FROM tasks WHERE id = ?';
    db.run(sql, [id], function (err) {
        if (err) {
            console.error('Delete failed:', err.message);
            return res.status(500).json({error: 'failed to delete task'});
        }
        if (this.changes === 0) return res.status(404).json({error: 'task not found'});
        console.log('Deleted task id:', id);
        res.json({deleted: true, id: Number(id)});
    });
});