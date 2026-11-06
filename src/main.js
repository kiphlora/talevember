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
// Helper: Wrap Day Numbers (1 to 30 Cycle)
// ------------------------------
function getNextDay(day) {
  return day >= daysInMonth ? 1 : day + 1;
}

function getPrevDay(day) {
  return day <= 1 ? daysInMonth : day - 1;
}

// ------------------------------
// Modal Controller
// ------------------------------
function openModal(dayNumber) {
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

  // Markdown rendering with fallback
  if (promptData.description) {
    modalDescription.innerHTML = typeof marked !== 'undefined' 
      ? marked.parse(promptData.description) 
      : promptData.description;
  } else {
    modalDescription.textContent = `Write a story, game scenario, poem, or vignette inspired by "${promptData.title}". Let the prompt guide your creative exploration for today!`;
  }

  // Prev / Next buttons stay enabled for infinite looping
  modalPrevBtn.disabled = false;
  modalNextBtn.disabled = false;

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

// ------------------------------
// Modal Event Listeners & Gestures
// ------------------------------
function setupModalListeners() {
  // Close Button Click
  modalCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  // Prev / Next Navigation Clicks with Looping
  modalPrevBtn.addEventListener('click', () => {
    openModal(getPrevDay(currentActiveDay));
  });

  modalNextBtn.addEventListener('click', () => {
    openModal(getNextDay(currentActiveDay));
  });

  // Backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // -------------------------------------------------------------
  // TOUCH SWIPE GESTURES (LEFT, RIGHT, DOWN)
  // -------------------------------------------------------------
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  modal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  modal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    if (!currentActiveDay) return;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const minSwipeDistance = 50;

    // 1. SWIPE DOWN (Dismiss Modal)
    if (deltaY > minSwipeDistance && absY > absX) {
      closeModal();
      return;
    }

    // 2. HORIZONTAL SWIPES (Next / Prev with Looping)
    if (absX > minSwipeDistance && absX > absY) {
      if (deltaX < 0) {
        // Swiped Left -> Move to Next (Day 30 wraps to Day 1)
        openModal(getNextDay(currentActiveDay));
      } else {
        // Swiped Right -> Move to Prev (Day 1 wraps to Day 30)
        openModal(getPrevDay(currentActiveDay));
      }
    }
  }

  // Keyboard Navigation: Escape to close, Left/Right arrows to cycle
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden') || !modal.classList.contains('visible')) return;

    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      openModal(getPrevDay(currentActiveDay));
    } else if (e.key === 'ArrowRight') {
      openModal(getNextDay(currentActiveDay));
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