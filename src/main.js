// ==============================================
// Talevember 2026 - Calendar & Modal Logic
// ==============================================

const calendarEl = document.getElementById('calendar');
const monthYearEl = document.getElementById('month-year');

// Modal DOM elements
const modal = document.getElementById('prompt-modal');
const modalCloseBtn = document.getElementById('modal-close');
const modalPrevBtn = document.getElementById('modal-prev-btn');
const modalNextBtn = document.getElementById('modal-next-btn');
const modalDayBadge = document.getElementById('modal-day-badge');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalDescription = document.getElementById('modal-description');
const modalCompleteBtn = document.getElementById('modal-complete-btn');

// Constants
const year = 2026;
const month = 10; // November (0-based)
const daysInMonth = 30;
const firstDay = new Date(year, month, 1).getDay();

let prompts = [];
let currentActiveDay = null;

// ------------------------------
// Fetch Prompts & Init
// ------------------------------
fetch('../data/prompts2026.json')
  .then(res => res.json())
  .then(data => {
    prompts = data;
    buildCalendar();
    setupModalListeners();
  })
  .catch(err => console.error('Error loading prompts:', err));

// ------------------------------
// Build Calendar Grid
// ------------------------------
function buildCalendar() {
  const stored = JSON.parse(localStorage.getItem('talevemberProgress') || '{}');
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
  monthYearEl.textContent = `${monthName} ${year}`;

  calendarEl.innerHTML = '';

  // Empty leading days
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.classList.add('day', 'empty');
    calendarEl.appendChild(empty);
  }

  // Day cards
  for (let day = 1; day <= daysInMonth; day++) {
    const p = prompts[day - 1] || {};
    const card = document.createElement('div');
    card.classList.add('day');
    card.dataset.day = day;

    const number = document.createElement('div');
    number.classList.add('day-number');
    if (isToday(day)) number.classList.add('today');
    number.textContent = day;

    const checkbox = document.createElement('div');
    checkbox.classList.add('day-checkbox');
    if (stored[day]) checkbox.classList.add('checked');
    if (stored[day]) card.classList.add('completed');

    const title = document.createElement('div');
    title.classList.add('prompt-title');
    title.textContent = p.title || 'Untitled Prompt';

    card.append(checkbox, number, title);
    calendarEl.appendChild(card);

    // Isolated checkbox click
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCompletion(day, checkbox, card);
    });

    // Card click opens modal
    card.addEventListener('click', () => openModal(day));
  }
}

// ------------------------------
// Modal Controller
// ------------------------------
function openModal(dayNumber) {
  if (dayNumber < 1 || dayNumber > daysInMonth) return;
  
  currentActiveDay = dayNumber;
  const promptData = prompts[dayNumber - 1] || {};

  modalDayBadge.textContent = `November ${dayNumber}, ${year}`;
  modalTitle.textContent = promptData.title || `Day ${dayNumber} Prompt`;

  if (promptData.title2) {
    modalSubtitle.textContent = promptData.title2;
    modalSubtitle.style.display = 'block';
  } else {
    modalSubtitle.style.display = 'none';
  }

  modalDescription.textContent = promptData.description || 
    `Write a story, game scenario, poem, or vignette inspired by "${promptData.title}". Let the prompt guide your creative exploration for today!`;

  // Update navigation buttons
  modalPrevBtn.disabled = (dayNumber <= 1);
  modalNextBtn.disabled = (dayNumber >= daysInMonth);

  // Sync completion button state
  updateModalButtonState(dayNumber);

  // Smooth visibility transition
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.add('visible');
  });
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('visible');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  currentActiveDay = null;
}

function updateModalButtonState(day) {
  const data = JSON.parse(localStorage.getItem('talevemberProgress') || '{}');
  const isDone = !!data[day];
  const btnText = modalCompleteBtn.querySelector('.btn-text');

  if (isDone) {
    modalCompleteBtn.classList.add('is-completed');
    btnText.textContent = 'Completed';
  } else {
    modalCompleteBtn.classList.remove('is-completed');
    btnText.textContent = 'Mark as Completed';
  }
}

function setupModalListeners() {
  // Close Button Click
  modalCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  // Prev / Next Navigation Clicks
  modalPrevBtn.addEventListener('click', () => {
    if (currentActiveDay > 1) openModal(currentActiveDay - 1);
  });

  modalNextBtn.addEventListener('click', () => {
    if (currentActiveDay < daysInMonth) openModal(currentActiveDay + 1);
  });

  // Backdrop click (closes when clicking background outside content card)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Keyboard Navigation: Escape to close, Left/Right arrows to step through prompts
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden') || !modal.classList.contains('visible')) return;

    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft' && currentActiveDay > 1) {
      openModal(currentActiveDay - 1);
    } else if (e.key === 'ArrowRight' && currentActiveDay < daysInMonth) {
      openModal(currentActiveDay + 1);
    }
  });

  // Toggle completion inside modal
  modalCompleteBtn.addEventListener('click', () => {
    if (!currentActiveDay) return;

    const data = JSON.parse(localStorage.getItem('talevemberProgress') || '{}');
    const newState = !data[currentActiveDay];
    data[currentActiveDay] = newState;
    localStorage.setItem('talevemberProgress', JSON.stringify(data));

    updateModalButtonState(currentActiveDay);

    // Sync back to grid card
    const card = document.querySelector(`.day[data-day="${currentActiveDay}"]`);
    if (card) {
      const checkbox = card.querySelector('.day-checkbox');
      checkbox.classList.toggle('checked', newState);
      card.classList.toggle('completed', newState);
    }
  });
}

// ------------------------------
// Utilities
// ------------------------------
function isToday(day) {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
}

function toggleCompletion(day, checkbox, card) {
  const data = JSON.parse(localStorage.getItem('talevemberProgress') || '{}');
  const checked = checkbox.classList.toggle('checked');
  card.classList.toggle('completed', checked);
  data[day] = checked;
  localStorage.setItem('talevemberProgress', JSON.stringify(data));

  if (currentActiveDay === day) {
    updateModalButtonState(day);
  }
}