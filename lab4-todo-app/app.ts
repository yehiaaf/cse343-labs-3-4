
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "cse343-lab4-todos";
const TRASH_ICON =
  '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 12H7L6 9z"/></svg>';

let todos: Todo[] = [];
let filter: Filter = "all";
let editingId: number | null = null; 
let nextId: number = 1;

const input = document.getElementById("new-todo") as HTMLInputElement;
const addBtn = document.getElementById("add-btn") as HTMLButtonElement;
const list = document.getElementById("todo-list") as HTMLUListElement;
const count = document.getElementById("count") as HTMLSpanElement;
const clearCompletedBtn = document.getElementById("clear-completed") as HTMLButtonElement;
const clearAllBtn = document.getElementById("clear-all") as HTMLButtonElement;
const filterButtons = document.querySelectorAll<HTMLButtonElement>(".filter");

function saveTodos(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
  }
}

function loadTodos(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return;
    const data = JSON.parse(saved);
    if (Array.isArray(data)) {
      todos = data.filter((t) => typeof t.id === "number" && typeof t.text === "string");
    }
  } catch (error) {
    todos = []; 
  }
  for (const t of todos) {
    if (t.id >= nextId) nextId = t.id + 1;
  }
}

function update(): void {
  saveTodos();
  render();
}

function addTodo(): void {
  const text = input.value.trim();
  if (text === "") {
    input.focus();
    return;
  }
  todos.push({ id: nextId, text: text, completed: false });
  nextId++;
  input.value = "";
  if (filter === "completed") filter = "all"; 
  update();
  input.focus();
}

function toggleTodo(id: number): void {
  for (const t of todos) {
    if (t.id === id) t.completed = !t.completed;
  }
  update();
}

function deleteTodo(id: number): void {
  todos = todos.filter((t) => t.id !== id);
  if (editingId === id) editingId = null;
  update();
}



function finishEdit(id: number, newText: string | null): void {
  if (editingId !== id) return; 

  const text = newText === null ? "" : newText.trim();
  if (text !== "") {
    for (const t of todos) {
      if (t.id === id) t.text = text;
    }
  }
  update();
}

function getVisibleTodos(): Todo[] {
  if (filter === "active") return todos.filter((t) => !t.completed);
  if (filter === "completed") return todos.filter((t) => t.completed);
  return todos;
}

function emptyMessage(): string {
  if (filter === "active") return "No active tasks";
  if (filter === "completed") return "No completed tasks yet.";
  return "Nothing here,Add your first task above.";
}

function makeRow(todo: Todo): HTMLLIElement {
  const row = document.createElement("li");
  if (todo.completed) row.classList.add("done");

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
      if (event.key === "Enter") finishEdit(todo.id, field.value);
      else if (event.key === "Escape") finishEdit(todo.id, null);
    });
    field.addEventListener("blur", () => finishEdit(todo.id, field.value));
    row.appendChild(field);
  } else {
    const label = document.createElement("span");
    label.className = "text";
    label.textContent = todo.text; 
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

function render(): void {
  list.innerHTML = "";
  const visible = getVisibleTodos();
  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = emptyMessage();
    list.appendChild(empty);
  } else {
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
    const field = list.querySelector(".edit") as HTMLInputElement | null;
    if (field !== null) {
      field.focus();
      field.select();
    }
  }
}

addBtn.addEventListener("click", addTodo);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTodo();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter as Filter;
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