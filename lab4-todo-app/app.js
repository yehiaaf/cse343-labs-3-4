"use strict";

const STORAGE_KEY = "cse343-lab4-todos";
const TRASH_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 12H7L6 9z"/></svg>';
let todos = [];
let filter = "all";
let editingId = null; 
let nextId = 1;

const input = document.getElementById("new-todo");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");
const count = document.getElementById("count");
const clearCompletedBtn = document.getElementById("clear-completed");
const clearAllBtn = document.getElementById("clear-all");
const filterButtons = document.querySelectorAll(".filter");
function saveTodos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
    catch (error) {
    }
}
function loadTodos() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === null)
            return;
        const data = JSON.parse(saved);
        if (Array.isArray(data)) {
            todos = data.filter((t) => typeof t.id === "number" && typeof t.text === "string");
        }
    }
    catch (error) {
        todos = []; 
    }
    for (const t of todos) {
        if (t.id >= nextId)
            nextId = t.id + 1;
    }
}
function update() {
    saveTodos();
    render();
}
function addTodo() {
    const text = input.value.trim();
    if (text === "") {
        input.focus();
        return;
    }
    todos.push({ id: nextId, text: text, completed: false });
    nextId++;
    input.value = "";
    if (filter === "completed")
        filter = "all"; 
    update();
    input.focus();
}
function toggleTodo(id) {
    for (const t of todos) {
        if (t.id === id)
            t.completed = !t.completed;
    }
    update();
}
function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    if (editingId === id)
        editingId = null;
    update();
}

function finishEdit(id, newText) {
    if (editingId !== id)
        return; 
    editingId = null;
    const text = newText === null ? "" : newText.trim();
    if (text !== "") {
        for (const t of todos) {
            if (t.id === id)
                t.text = text;
        }
    }
    update();
}

function getVisibleTodos() {
    if (filter === "active")
        return todos.filter((t) => !t.completed);
    if (filter === "completed")
        return todos.filter((t) => t.completed);
    return todos;
}
function emptyMessage() {
    if (filter === "active")
        return "No active tasks. Nice work!";
    if (filter === "completed")
        return "No completed tasks yet.";
    return "Nothing here yet. Add your first task above.";
}
function makeRow(todo) {
    const row = document.createElement("li");
    if (todo.completed)
        row.classList.add("done");
    // checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "toggle";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `Mark "${todo.text}" as done`);
    checkbox.addEventListener("click", () => toggleTodo(todo.id));
    row.appendChild(checkbox);
    if (editingId === todo.id) {
        const field = document.createElement("input");
        field.type = "text";
        field.className = "edit";
        field.value = todo.text;
        field.maxLength = 120;
        field.setAttribute("aria-label", "Edit todo");
        field.addEventListener("keydown", (event) => {
            if (event.key === "Enter")
                finishEdit(todo.id, field.value);
            else if (event.key === "Escape")
                finishEdit(todo.id, null);
        });
        field.addEventListener("blur", () => finishEdit(todo.id, field.value));
        row.appendChild(field);
    }
    else {
        const label = document.createElement("span");
        label.className = "text";
        label.textContent = todo.text; // textContent, so typed HTML is shown as plain text
        label.addEventListener("dblclick", () => {
            editingId = todo.id;
            render();
        });
        row.appendChild(label);
    }


    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete";
    deleteBtn.setAttribute("aria-label", `Delete "${todo.text}"`);
    deleteBtn.innerHTML = TRASH_ICON; // fixed icon, not user text
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));
    row.appendChild(deleteBtn);
    return row;
}
function render() {
    list.innerHTML = "";
    const visible = getVisibleTodos();
    if (visible.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = emptyMessage();
        list.appendChild(empty);
    }
    else {
        for (const todo of visible) {
            list.appendChild(makeRow(todo));
        }
    }


    const left = todos.filter((t) => !t.completed).length;
    count.textContent = `${left} ${left === 1 ? "item" : "items"} left`;
    clearCompletedBtn.disabled = !todos.some((t) => t.completed);
    clearAllBtn.disabled = todos.length === 0;
    filterButtons.forEach((btn) => {
        const isActive = btn.dataset.filter === filter;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });
    if (editingId !== null) {
        const field = list.querySelector(".edit");
        if (field !== null) {
            field.focus();
            field.select();
        }
    }
}
addBtn.addEventListener("click", addTodo);
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter")
        addTodo();
});
filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        filter = btn.dataset.filter;
        render();
    });
});
clearCompletedBtn.addEventListener("click", () => {
    todos = todos.filter((t) => !t.completed);
    update();
});
clearAllBtn.addEventListener("click", () => {
    todos = [];
    editingId = null;
    update();
});




loadTodos();
render();