const STORAGE_KEY = 'todo-app:tasks'

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) {
      console.warn('Invalid stored todo data, starting fresh.')
      return []
    }
    return parsed
  } catch (err) {
    console.error('Failed to load todos from localStorage', err)
    return []
  }
}

function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch (err) {
    console.error('Failed to save todos to localStorage', err)
  }
}

let todos = loadTodos()

const input = document.querySelector('#todo-input')
const list = document.querySelector('#todo-list')
const emptyState = document.querySelector('#empty-state')
const counter = document.querySelector('#todo-counter')
const clearCompleted = document.querySelector('#clear-completed')
const form = document.querySelector('#todo-form')

function newTodoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function renderTodos() {
  list.innerHTML = ''

  emptyState.classList.toggle('hidden', todos.length !== 0)
  counter.textContent = `${todos.filter((t) => !t.completed).length} remaining`
  clearCompleted.classList.toggle('hidden', !todos.some((t) => t.completed))

  todos.forEach((todo) => {
    const item = document.createElement('li')
    item.dataset.id = todo.id
    item.className =
      'group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors' +
      (todo.completed ? ' opacity-60' : '')

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = todo.completed
    checkbox.className = 'h-5 w-5 rounded border-slate-300 text-indigo-600 accent-indigo-600'
    checkbox.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.completed ? 'not' : ''} completed`)
    checkbox.addEventListener('change', () => toggleTodo(todo.id))

    const label = document.createElement('span')
    label.className =
      'flex-1 cursor-pointer select-none text-slate-800 ' +
      (todo.completed ? 'line-through text-slate-400' : '')
    label.textContent = todo.text
    label.addEventListener('click', () => checkbox.click())

    const deleteBtn = document.createElement('button')
    deleteBtn.type = 'button'
    deleteBtn.textContent = 'Delete'
    deleteBtn.className =
      'rounded-md px-2 py-1 text-xs font-medium text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100'
    deleteBtn.setAttribute('aria-label', `Delete "${todo.text}"`)
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id))

    item.append(checkbox, label, deleteBtn)
    list.appendChild(item)
  })

  saveTodos(todos)
}

function addTodo(text) {
  const trimmed = text.trim()
  if (!trimmed) return

  todos.push({ id: newTodoId(), text: trimmed, completed: false, createdAt: new Date().toISOString() })
  renderTodos()
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id)
  if (todo) todo.completed = !todo.completed
  renderTodos()
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id)
  renderTodos()
}

function clearCompletedTodos() {
  todos = todos.filter((t) => !t.completed)
  renderTodos()
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  addTodo(input.value)
  input.value = ''
  input.focus()
})

clearCompleted.addEventListener('click', clearCompletedTodos)

renderTodos()
