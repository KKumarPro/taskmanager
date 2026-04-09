/**
 * Task Manager — Frontend
 * Communicates with the PHP/MySQL REST API at API_BASE.
 */

// Point directly at tasks.php — no mod_rewrite needed.
// IDs are passed as PATH_INFO: tasks.php/42
const API_BASE = "http://localhost/taskmanager/backend/tasks.php";

// ─── STATE ────────────────────────────────────────────────────────────────────
let tasks = [];
let filter = "all"; // 'all' | 'active' | 'completed'
let editingId = null;

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const taskList = document.getElementById("taskList");
const addForm = document.getElementById("addForm");
const taskInput = document.getElementById("taskInput");
const errorBanner = document.getElementById("errorBanner");
const statsEl = document.getElementById("stats");
const filters = document.getElementById("filters");
const modalOverlay = document.getElementById("modalOverlay");
const modalInput = document.getElementById("modalInput");
const modalClose = document.getElementById("modalClose");
const modalCancel = document.getElementById("modalCancel");
const modalSave = document.getElementById("modalSave");

// ─── API ──────────────────────────────────────────────────────────────────────
async function api(method, path = "", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── LOAD TASKS ───────────────────────────────────────────────────────────────
async function loadTasks() {
  showLoading();
  hideError();
  try {
    tasks = await api("GET");
    render();
  } catch (err) {
    showError(err.message);
    taskList.innerHTML = "";
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;
  taskInput.disabled = true;
  hideError();
  try {
    const task = await api("POST", "", { title });
    tasks.unshift(task);
    taskInput.value = "";
    render();
  } catch (err) {
    showError(err.message);
  } finally {
    taskInput.disabled = false;
    taskInput.focus();
  }
});

// ─── TOGGLE COMPLETE ─────────────────────────────────────────────────────────
async function toggleTask(id) {
  const task = tasks.find((t) => t.id == id);
  if (!task) return;
  try {
    const updated = await api("PATCH", `/${id}`, {
      completed: !task.completed,
    });
    Object.assign(task, updated);
    render();
  } catch (err) {
    showError(err.message);
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteTask(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.classList.add("removing");
  await new Promise((r) => setTimeout(r, 200));
  try {
    await api("DELETE", `/${id}`);
    tasks = tasks.filter((t) => t.id != id);
    render();
  } catch (err) {
    if (el) el.classList.remove("removing");
    showError(err.message);
  }
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function openEditModal(id) {
  const task = tasks.find((t) => t.id == id);
  if (!task) return;
  editingId = id;
  modalInput.value = task.title;
  modalOverlay.classList.remove("hidden");
  modalInput.focus();
  modalInput.select();
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  editingId = null;
}

modalClose.addEventListener("click", closeModal);
modalCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

modalInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveEdit();
});

modalSave.addEventListener("click", saveEdit);

async function saveEdit() {
  const title = modalInput.value.trim();
  if (!title || !editingId) return;
  try {
    const updated = await api("PATCH", `/${editingId}`, { title });
    const task = tasks.find((t) => t.id == editingId);
    if (task) Object.assign(task, updated);
    closeModal();
    render();
  } catch (err) {
    showError(err.message);
  }
}

// ─── FILTERS ─────────────────────────────────────────────────────────────────
filters.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  filter = btn.dataset.filter;
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  render();
});

// ─── RENDER ───────────────────────────────────────────────────────────────────
function render() {
  const visible = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  // Stats
  const remaining = tasks.filter((t) => !t.completed).length;
  statsEl.textContent = `${remaining} remaining`;

  if (visible.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">◻</span>
        ${
          filter === "all"
            ? "No tasks yet. Add one above."
            : filter === "active"
              ? "No active tasks."
              : "No completed tasks."
        }
      </div>`;
    return;
  }

  taskList.innerHTML = visible
    .map(
      (task) => `
    <div class="task-item ${task.completed ? "completed" : ""}" data-id="${task.id}">
      <input
        type="checkbox"
        class="task-check"
        ${task.completed ? "checked" : ""}
        aria-label="Mark complete"
        onchange="toggleTask(${task.id})"
      />
      <span class="task-title">${escapeHTML(task.title)}</span>
      <span class="task-meta">${formatDate(task.createdAt)}</span>
      <div class="task-actions">
        <button class="task-btn edit" onclick="openEditModal(${task.id})" title="Edit">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M9.5 1.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="task-btn delete" onclick="deleteTask(${task.id})" title="Delete">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  `,
    )
    .join("");
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function showLoading() {
  taskList.innerHTML = `
    <div class="loading" id="loading">
      <span class="spinner"></span>
      Loading tasks…
    </div>`;
}

function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.classList.remove("hidden");
  setTimeout(() => errorBanner.classList.add("hidden"), 4000);
}

function hideError() {
  errorBanner.classList.add("hidden");
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadTasks();
