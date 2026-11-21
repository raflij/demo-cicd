const STORAGE_KEY = 'todo-app:tasks'

let loadFailed = false

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) {
      loadFailed = true
      return []
    }
    return parsed
  } catch (err) {
    console.error('Failed to load todos from localStorage', err)
    loadFailed = true
    return []
  }
}

function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    flashStatus('Saved')
    return true
  } catch (err) {
    console.error('Failed to save todos to localStorage', err)
    showSaveError()
    return false
  }
}

let todos = loadTodos()

const input = document.querySelector('#todo-input')
const list = document.querySelector('#todo-list')
const emptyState = document.querySelector('#empty-state')
const counter = document.querySelector('#todo-counter')
const clearCompleted = document.querySelector('#clear-completed')
const form = document.querySelector('#todo-form')
const statusEl = document.querySelector('#save-status')
const loadBanner = document.querySelector('#load-error-banner')
const undoToast = document.querySelector('#undo-toast')
const undoBtn = document.querySelector('#undo-action')
const undoLabel = document.querySelector('#undo-message')

let undoTimer = null

function flashStatus(text) {
  statusEl.textContent = text
  statusEl.classList.remove('opacity-0')
  statusEl.classList.add('opacity-100')
  clearTimeout(flashStatus._t)
  flashStatus._t = setTimeout(() => {
    statusEl.classList.remove('opacity-100')
    statusEl.classList.add('opacity-0')
  }, 1200)
}

function showSaveError() {
  statusEl.textContent = 'Could not save — check browser storage'
  statusEl.classList.remove('opacity-0')
  statusEl.classList.add('opacity-100', 'text-rose-600')
}

function newTodoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function showToast(message, actionLabel, onAction) {
  undoLabel.textContent = message
  undoBtn.textContent = actionLabel
  undoBtn.onclick = () => {
    hideToast()
    onAction()
  }
  undoToast.classList.remove('hidden')
  clearTimeout(undoTimer)
  undoTimer = setTimeout(hideToast, 6000)
}

function hideToast() {
  clearTimeout(undoTimer)
  undoToast.classList.add('hidden')
}

function renderTodos() {
  list.innerHTML = ''

  emptyState.classList.toggle('hidden', todos.length !== 0)
  const remaining = todos.filter((t) => !t.completed).length
  counter.textContent = remaining === 0 && todos.length > 0
    ? 'All done'
    : `${remaining} remaining`
  clearCompleted.classList.toggle('hidden', !todos.some((t) => t.completed))
  clearCompleted.disabled = todos.length === 0

  todos.forEach((todo, index) => {
    const item = document.createElement('li')
    item.dataset.id = todo.id
    item.tabIndex = 0
    item.setAttribute('aria-label', `Task ${index + 1}: ${todo.text}, ${todo.completed ? 'completed' : 'not completed'}`)
    item.className =
      'group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors' +
      (todo.completed ? ' bg-slate-50' : '')

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = `todo-${todo.id}`
    checkbox.checked = todo.completed
    checkbox.className = 'h-5 w-5 rounded border-slate-300 accent-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
    checkbox.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.completed ? 'not' : ''} completed`)
    checkbox.addEventListener('change', () => toggleTodo(todo.id))

    const label = document.createElement('label')
    label.htmlFor = `todo-${todo.id}`
    label.className =
      'flex-1 cursor-pointer select-none text-slate-800 ' +
      (todo.completed ? 'line-through text-slate-500' : '')
    label.textContent = todo.text

    const deleteBtn = document.createElement('button')
    deleteBtn.type = 'button'
    deleteBtn.setAttribute('aria-label', `Delete "${todo.text}"`)
    deleteBtn.className =
      'shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500'
    deleteBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18.36 6l-.56 1.27M21 12v.01M3 12v.01M6.64 6l.56 1.27M13 5h-2M5.45 9.11a1 1 0 00-.57.54L3 12l1.88 2.35a1 1 0 00.57.54L8 16h8l2.55 1.11a1 1 0 00.57-.54L21 12l-1.88-2.35a1 1 0 00-.57-.54L16 8H8zM12 5V4a1 1 0 00-1-1H8a1 1 0 00-1 1v1"/><line x1="4" y1="16" x2="4" y2="22"/><line x1="12" y1="16" x2="12" y2="22"/></svg>'
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id, index))

    item.append(checkbox, label, deleteBtn)
    list.appendChild(item)
  })

  saveTodos(todos)
}

function addTodo(text) {
  const trimmed = text.trim()
  if (!trimmed) return

  todos.push({ id: newTodoId(), text: trimmed, completed: false })
  renderTodos()
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id)
  if (todo) todo.completed = !todo.completed
  renderTodos()
}

function deleteTodo(id, index) {
  const removed = todos[index]
  const originalTodos = [...todos]
  todos = todos.filter((t) => t.id !== id)
  renderTodos()
  showToast(`Deleted "${removed.text}"`, 'Undo', () => {
    todos = originalTodos
    renderTodos()
  })
}

function clearCompletedTodos() {
  const removed = todos.filter((t) => t.completed)
  if (removed.length === 0) return
  const originalTodos = [...todos]
  todos = todos.filter((t) => !t.completed)
  renderTodos()
  showToast(`Cleared ${removed.length} completed`, 'Undo', () => {
    todos = originalTodos
    renderTodos()
  })
}

// Keyboard path: Enter to add, Escape to clear input, Delete key on focused row
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.activeElement === input) {
    input.value = ''
    input.blur()
  }
})

list.addEventListener('keydown', (event) => {
  if ((event.key === 'Delete' || event.key === 'Backspace') && event.target.dataset?.id) {
    event.preventDefault()
    deleteTodo(event.target.dataset.id, todos.findIndex((t) => t.id === event.target.dataset.id))
  }
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  addTodo(input.value)
  input.value = ''
  input.focus()
})

clearCompleted.addEventListener('click', clearCompletedTodos)

// Dismiss load-error banner
if (loadFailed) {
  loadBanner.classList.remove('hidden')
}
document.querySelector('#dismiss-load-error').addEventListener('click', () => {
  loadBanner.classList.add('hidden')
})

renderTodos()
