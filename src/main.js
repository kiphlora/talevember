// ==============================================
// Talevember 2025 - Calendar Logic (refined)
// ==============================================

// Select DOM elements
const calendarEl = document.getElementById('calendar');
const monthYearEl = document.getElementById('month-year');
const themeToggle = document.getElementById('theme-toggle');

// Calendar constants
const year = 2025;
const month = 10; // November (0-based)
const daysInMonth = 30;
const firstDay = new Date(year, month, 1).getDay();

let prompts = [];

// ------------------------------
// Load prompt data from JSON file
// ------------------------------
fetch('../data/prompts2025.json')
  .then(res => res.json())
  .then(data => {
    prompts = data;
    buildCalendar();
  })
  .catch(err => console.error('Error loading prompts:', err));

// ------------------------------
// Build the main calendar grid
// ------------------------------
function buildCalendar() {
  const stored = JSON.parse(localStorage.getItem('talevemberProgress') || '{}');
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
  monthYearEl.textContent = `${monthName} ${year}`;

  // Fill placeholders before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.classList.add('day', 'empty');
    calendarEl.appendChild(empty);
  }

  // Generate day cards
  for (let day = 1; day <= daysInMonth; day++) {
    const p = prompts[day - 1] || {};
    const card = document.createElement('div');
    card.classList.add('day');
    card.dataset.day = day;

    // Day number
    const number = document.createElement('div');
    number.classList.add('day-number');
    if (isToday(day)) number.classList.add('today');
    number.textContent = day;

    // Checkbox
    const checkbox = document.createElement('div');
    checkbox.classList.add('day-checkbox');
    if (stored[day]) checkbox.classList.add('checked');
    if (stored[day]) card.classList.add('completed');

    // Title
    const title = document.createElement('div');
    title.classList.add('prompt-title');
    title.textContent = p.title || 'Untitled Prompt';

    // Append and add click event
    card.append(checkbox, number, title);
    calendarEl.appendChild(card);

    // Clicking anywhere toggles completion
    card.addEventListener('click', () => toggleCompletion(day, checkbox, card));
  }
}

// ------------------------------
// Utility: check if today
// ------------------------------
function isToday(day) {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
}

// ------------------------------
// Toggle completion
// ------------------------------
function toggleCompletion(day, checkbox, card) {
  const data = JSON.parse(localStorage.getItem('talevemberProgress') || '{}');
  const checked = checkbox.classList.toggle('checked');
  card.classList.toggle('completed', checked);
  data[day] = checked;
  localStorage.setItem('talevemberProgress', JSON.stringify(data));
}

