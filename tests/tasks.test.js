const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');

// Close the db connection after all tests so Jest can exit cleanly
afterAll(done => {
    db.close(done);
});

// Wipe all tasks before each test so tests don't bleed into each other
beforeEach(done => {
    db.run('DELETE FROM tasks', done);
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

describe('GET /health', () => {
    it('returns ok: true', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });
});

// ---------------------------------------------------------------------------
// POST /tasks
// ---------------------------------------------------------------------------

describe('POST /tasks', () => {
    it('creates a task and returns 201 with the new row', async () => {
        const res = await request(app)
            .post('/tasks')
            .send({ title: 'Buy milk' });

        expect(res.status).toBe(201);
        // Response must contain an id, the exact title, and done defaulting to 0
        expect(res.body).toMatchObject({ title: 'Buy milk', done: 0 });
        expect(typeof res.body.id).toBe('number');
    });

    it('trims leading and trailing whitespace from the title', async () => {
        const res = await request(app)
            .post('/tasks')
            .send({ title: '  Trim me  ' });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Trim me');
    });

    it('returns 400 when title is missing', async () => {
        const res = await request(app).post('/tasks').send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 when title is only whitespace', async () => {
        const res = await request(app)
            .post('/tasks')
            .send({ title: '   ' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// GET /tasks
// ---------------------------------------------------------------------------

describe('GET /tasks', () => {
    // Seed two tasks before each test in this block.
    // The outer beforeEach already cleared the table, so we start clean.
    beforeEach(async () => {
        await request(app).post('/tasks').send({ title: 'Task A' });
        await request(app).post('/tasks').send({ title: 'Task B' });
    });

    it('returns all tasks as an array', async () => {
        const res = await request(app).get('/tasks');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);
    });

    it('each task has id, title, and done fields', async () => {
        const res = await request(app).get('/tasks');
        for (const task of res.body) {
            expect(task).toHaveProperty('id');
            expect(task).toHaveProperty('title');
            expect(task).toHaveProperty('done');
        }
    });

    it('filters to only incomplete tasks with done=0', async () => {
        // Mark Task A as done
        const all = await request(app).get('/tasks');
        const firstId = all.body[0].id;
        await request(app).put(`/tasks/${firstId}`).send({ done: 1 });

        const res = await request(app).get('/tasks?done=0');
        expect(res.status).toBe(200);
        expect(res.body.every(t => t.done === 0)).toBe(true);
    });

    it('filters to only completed tasks with done=1', async () => {
        const all = await request(app).get('/tasks');
        const firstId = all.body[0].id;
        await request(app).put(`/tasks/${firstId}`).send({ done: 1 });

        const res = await request(app).get('/tasks?done=1');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].done).toBe(1);
    });

    it('filters by search query q (case-insensitive)', async () => {
        const res = await request(app).get('/tasks?q=task+a');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Task A');
    });

    it('returns 400 for an invalid done value', async () => {
        const res = await request(app).get('/tasks?done=5');
        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for an invalid sort column', async () => {
        const res = await request(app).get('/tasks?sort=password');
        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for an invalid dir value', async () => {
        const res = await request(app).get('/tasks?dir=sideways');
        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// GET /tasks/:id
// ---------------------------------------------------------------------------

describe('GET /tasks/:id', () => {
    it('returns the task for a valid id', async () => {
        const created = await request(app)
            .post('/tasks')
            .send({ title: 'Find me' });
        const { id } = created.body;

        const res = await request(app).get(`/tasks/${id}`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id, title: 'Find me', done: 0 });
    });

    it('returns 404 for an id that does not exist', async () => {
        const res = await request(app).get('/tasks/99999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// PUT /tasks/:id
// ---------------------------------------------------------------------------

describe('PUT /tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
        const res = await request(app)
            .post('/tasks')
            .send({ title: 'Original' });
        taskId = res.body.id;
    });

    it('updates the title', async () => {
        const res = await request(app)
            .put(`/tasks/${taskId}`)
            .send({ title: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated');
    });

    it('marks a task as done', async () => {
        const res = await request(app)
            .put(`/tasks/${taskId}`)
            .send({ done: 1 });

        expect(res.status).toBe(200);
        expect(res.body.done).toBe(1);
    });

    it('updates title and done in the same request', async () => {
        const res = await request(app)
            .put(`/tasks/${taskId}`)
            .send({ title: 'Both', done: 1 });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ title: 'Both', done: 1 });
    });

    it('does not change fields that are not sent', async () => {
        // Only update done; title should remain unchanged
        await request(app).put(`/tasks/${taskId}`).send({ done: 1 });
        const res = await request(app).get(`/tasks/${taskId}`);

        expect(res.body.title).toBe('Original');
        expect(res.body.done).toBe(1);
    });

    it('returns 400 when body contains neither title nor done', async () => {
        const res = await request(app).put(`/tasks/${taskId}`).send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 when title is only whitespace', async () => {
        const res = await request(app)
            .put(`/tasks/${taskId}`)
            .send({ title: '   ' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 for an id that does not exist', async () => {
        const res = await request(app)
            .put('/tasks/99999')
            .send({ done: 1 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// DELETE /tasks/:id
// ---------------------------------------------------------------------------

describe('DELETE /tasks/:id', () => {
    it('deletes the task and returns { deleted: true, id }', async () => {
        const created = await request(app)
            .post('/tasks')
            .send({ title: 'Delete me' });
        const { id } = created.body;

        const res = await request(app).delete(`/tasks/${id}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ deleted: true, id });
    });

    it('task is gone after deletion', async () => {
        const created = await request(app)
            .post('/tasks')
            .send({ title: 'Gone' });
        const { id } = created.body;

        await request(app).delete(`/tasks/${id}`);
        const check = await request(app).get(`/tasks/${id}`);
        expect(check.status).toBe(404);
    });

    it('returns 404 for an id that does not exist', async () => {
        const res = await request(app).delete('/tasks/99999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBeDefined();
    });
});
