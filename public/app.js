// ================================
//  State
// ================================
const state = {
    filter: 'all',       // 'all' | 'active' | 'completed'
    searchQuery: '',
    loading: false,
};

// ================================
//  API
// ================================

async function apiFetch(method, path, body) {
    const options = { method, headers: {} };
    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const res = await fetch(path, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Request failed (' + res.status + ')');
    }
    return data;
}

// ================================
//  Task operations
// ================================

async function loadTasks() {
    setLoading(true);
    clearError();

    const params = new URLSearchParams();
    if (state.filter === 'active')    params.set('done', '0');
    if (state.filter === 'completed') params.set('done', '1');
    if (state.searchQuery)            params.set('q', state.searchQuery);

    const qs = params.toString();
    try {
        const tasks = await apiFetch('GET', '/tasks' + (qs ? '?' + qs : ''));
        renderTasks(tasks);
    } catch (err) {
        showError(err.message);
        renderTasks([]);
    } finally {
        setLoading(false);
    }
}

async function createTask(title) {
    clearError();
    try {
        await apiFetch('POST', '/tasks', { title });
        await loadTasks();
    } catch (err) {
        showError(err.message);
    }
}

async function toggleTask(id, currentDone) {
    clearError();
    try {
        await apiFetch('PUT', '/tasks/' + id, { done: currentDone ? 0 : 1 });
        await loadTasks();
    } catch (err) {
        showError(err.message);
    }
}

async function updateTaskTitle(id, title) {
    clearError();
    try {
        await apiFetch('PUT', '/tasks/' + id, { title });
        await loadTasks();
    } catch (err) {
        showError(err.message);
        await loadTasks();
    }
}

async function deleteTask(id) {
    clearError();
    const item = document.querySelector('.task-item[data-id="' + id + '"]');
    if (item) {
        item.classList.add('removing');
        await new Promise(function (resolve) { setTimeout(resolve, 180); });
    }
    try {
        await apiFetch('DELETE', '/tasks/' + id);
        await loadTasks();
    } catch (err) {
        showError(err.message);
        await loadTasks();
    }
}

// ================================
//  Render
// ================================

function renderTasks(tasks) {
    const list    = document.getElementById('taskList');
    const empty   = document.getElementById('emptyState');
    const counter = document.getElementById('taskCount');

    list.innerHTML = '';

    if (tasks.length === 0) {
        empty.hidden = false;
        counter.textContent = '';
    } else {
        empty.hidden = true;
        tasks.forEach(function (task) {
            list.appendChild(buildTaskEl(task));
        });
        const remaining = tasks.filter(function (t) { return !t.done; }).length;
        counter.textContent = remaining + ' task' + (remaining !== 1 ? 's' : '') + ' remaining';
    }
}

function buildTaskEl(task) {
    const item = document.createElement('div');
    item.className = 'task-item' + (task.done ? ' task-done' : '');
    item.setAttribute('role', 'listitem');
    item.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('button');
    checkbox.className = 'task-checkbox';
    checkbox.setAttribute('aria-label', task.done ? 'Mark as active' : 'Mark as done');
    checkbox.innerHTML = '<svg viewBox="0 0 12 10" aria-hidden="true"><polyline points="1,5 4.5,8.5 11,1"/></svg>';
    checkbox.addEventListener('click', function () { toggleTask(task.id, task.done); });

    // Title
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;
    title.title = 'Double-click to edit';
    title.addEventListener('dblclick', function () { startEdit(item, task); });

    // Delete
    const del = document.createElement('button');
    del.className = 'task-delete';
    del.setAttribute('aria-label', 'Delete task');
    del.innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>';
    del.addEventListener('click', function () { deleteTask(task.id); });

    item.appendChild(checkbox);
    item.appendChild(title);
    item.appendChild(del);
    return item;
}

function startEdit(item, task) {
    const titleEl = item.querySelector('.task-title');
    if (!titleEl) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.title;
    input.maxLength = 200;
    input.setAttribute('aria-label', 'Edit task title');

    titleEl.replaceWith(input);
    input.focus();
    input.select();

    let committed = false;

    function commit() {
        if (committed) return;
        committed = true;
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== task.title) {
            updateTaskTitle(task.id, newTitle);
        } else {
            loadTasks();
        }
    }

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter')  { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { committed = true; loadTasks(); }
    });

    input.addEventListener('blur', commit);
}

// ================================
//  UI helpers
// ================================

function setLoading(on) {
    state.loading = on;
    document.getElementById('loadingBar').classList.toggle('visible', on);
}

function showError(msg) {
    const el = document.getElementById('errorBanner');
    el.textContent = msg;
    el.hidden = false;
}

function clearError() {
    const el = document.getElementById('errorBanner');
    el.hidden = true;
    el.textContent = '';
}

function debounce(fn, delay) {
    var timer;
    return function () {
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(null, args); }, delay);
    };
}

// ================================
//  Init
// ================================

document.addEventListener('DOMContentLoaded', function () {

    // Add task
    document.getElementById('addForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var input = document.getElementById('addInput');
        var title = input.value.trim();
        if (!title) return;
        input.value = '';
        createTask(title);
    });

    // Filter
    document.getElementById('filterGroup').addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;
        document.querySelectorAll('.filter-btn').forEach(function (b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        state.filter = btn.dataset.filter;
        loadTasks();
    });

    // Search (debounced)
    var debouncedSearch = debounce(function (q) {
        state.searchQuery = q;
        loadTasks();
    }, 300);

    document.getElementById('searchInput').addEventListener('input', function (e) {
        debouncedSearch(e.target.value.trim());
    });

    // Initial load
    loadTasks();
});
