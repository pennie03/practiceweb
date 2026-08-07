const welcomeScreen = document.getElementById('welcomeScreen');
const deskScreen = document.getElementById('deskScreen');
const enterBtn = document.getElementById('enterBtn');
const dateTime = document.getElementById('dateTime');
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const workInput = document.getElementById('workInput');
const breakInput = document.getElementById('breakInput');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const moodButtons = document.querySelectorAll('.mood-btn');
const journalTitle = document.getElementById('journalTitle');
const journalEntry = document.getElementById('journalEntry');
const saveEntryBtn = document.getElementById('saveEntryBtn');
const moodSummary = document.getElementById('moodSummary');
const entryList = document.getElementById('entryList');
const trailLayer = document.getElementById('trailLayer');
const focusOverlay = document.getElementById('focusOverlay');
const focusPanel = document.querySelector('.focus-panel');
const focusOverlayBtn = document.getElementById('focusOverlayBtn');
const closeFocusBtn = document.getElementById('closeFocusBtn');
const focusHeading = document.getElementById('focusHeading');
const focusMessage = document.getElementById('focusMessage');
const focusExtra = document.getElementById('focusExtra');
const phrasePreview = document.getElementById('phrasePreview');
const phraseChips = document.querySelectorAll('.phrase-chip');
const playLocalBtn = document.getElementById('playLocalBtn');
const pauseLocalBtn = document.getElementById('pauseLocalBtn');
const volumeSlider = document.getElementById('volumeSlider');
const localAudio = document.getElementById('localAudio');

const storageKey = 'cozy-study-state-v2';

let workMinutes = 25;
let breakMinutes = 5;
let timeLeft = workMinutes * 60;
let timerRunning = false;
let intervalId = null;
let currentMode = 'work';
let selectedMood = 'focused';
let tasks = [];
let journalEntries = [];
let volume = 0.5;
let isAudioPlaying = false;

const moodMessages = {
  focused: 'your mood is centered and ready to focus.',
  calm: 'your mood is soft and steady.',
  happy: 'your mood is light and bright.',
  tired: 'you need a gentle pause and a sip of something warm.',
  creative: 'your mood is sparkly and imaginative.'
};

const focusTips = [
  'pick one tiny task and begin with your favorite pen.',
  'set a 10-minute start and let the page feel easy.',
  'take your notes in short bursts and let your mind breathe.'
];

const breakIdeas = [
  'stretch your shoulders and sip water slowly.',
  'walk to the window and look at the sky for a moment.',
  'do a tiny tidy-up and then come back with fresh eyes.'
];

function updateClock() {
  const now = new Date();
  dateTime.textContent = now.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timeLeft);
}

function saveState() {
  const state = {
    workMinutes,
    breakMinutes,
    currentMode,
    timeLeft,
    selectedMood,
    tasks,
    journalEntries,
    theme: document.body.dataset.theme,
    journalTitle: journalTitle.value,
    journalEntry: journalEntry.value,
    volume,
    isAudioPlaying
  };
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function restoreState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    return;
  }

  try {
    const state = JSON.parse(saved);
    workMinutes = state.workMinutes || 25;
    breakMinutes = state.breakMinutes || 5;
    currentMode = state.currentMode || 'work';
    timeLeft = state.timeLeft || workMinutes * 60;
    selectedMood = state.selectedMood || 'focused';
    tasks = state.tasks || [];
    journalEntries = state.journalEntries || [];
    journalTitle.value = state.journalTitle || '';
    journalEntry.value = state.journalEntry || '';
    document.body.dataset.theme = state.theme || 'peach';
    volume = state.volume ?? 0.5;
    isAudioPlaying = Boolean(state.isAudioPlaying);

    workInput.value = workMinutes;
    breakInput.value = breakMinutes;
    renderTasks();
    renderEntries();
    updateMood(selectedMood);
    renderTimer();
    volumeSlider.value = volume;
    localAudio.volume = volume;
  } catch (error) {
    console.warn('could not restore saved state', error);
  }
}

function startTimer() {
  if (timerRunning) {
    return;
  }

  showFocusOverlay();
  timerRunning = true;
  intervalId = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      clearInterval(intervalId);
      timerRunning = false;
      currentMode = currentMode === 'work' ? 'break' : 'work';
      timeLeft = currentMode === 'work' ? workMinutes * 60 : breakMinutes * 60;
      showFocusOverlay();
      renderTimer();
      saveState();
      return;
    }
    renderTimer();
    saveState();
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(intervalId);
  saveState();
}

function resetTimer() {
  pauseTimer();
  timeLeft = currentMode === 'work' ? workMinutes * 60 : breakMinutes * 60;
  renderTimer();
  saveState();
}

function syncTimerSettings() {
  workMinutes = Number(workInput.value) || 25;
  breakMinutes = Number(breakInput.value) || 5;
  if (currentMode === 'work') {
    timeLeft = workMinutes * 60;
  } else {
    timeLeft = breakMinutes * 60;
  }
  renderTimer();
  saveState();
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' complete' : ''}`;
    item.innerHTML = `
      <span>${task.text}</span>
      <button type="button" class="task-complete">${task.completed ? '✓' : '○'}</button>
    `;

    item.querySelector('.task-complete').addEventListener('click', () => completeTask(task));
    taskList.appendChild(item);
  });
}

function addTask(event) {
  event.preventDefault();
  const value = taskInput.value.trim();
  if (!value) {
    return;
  }

  tasks.push({ text: value, completed: false });
  taskInput.value = '';
  renderTasks();
  saveState();
}

function completeTask(task) {
  const target = tasks.find((item) => item.text === task.text && item.completed === task.completed);
  if (!target) {
    return;
  }

  target.completed = true;
  renderTasks();
  saveState();
}

function updateMood(selection) {
  selectedMood = selection;
  moodButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mood === selection);
  });
  moodSummary.textContent = moodMessages[selection];
  saveState();
}

function renderEntries() {
  entryList.innerHTML = '';
  if (!journalEntries.length) {
    entryList.innerHTML = '<p class="focus-extra">no saved entries yet. write one and keep it close.</p>';
    return;
  }

  journalEntries.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'entry-item';
    item.innerHTML = `
      <strong>${entry.title}</strong>
      <p>${entry.note}</p>
      <small>${entry.mood} · ${entry.date}</small>
    `;
    entryList.appendChild(item);
  });
}

function saveJournal() {
  const title = journalTitle.value.trim();
  const note = journalEntry.value.trim();

  if (!title || !note) {
    moodSummary.textContent = 'please add both a title and a little note before saving.';
    return;
  }

  journalEntries.unshift({
    title,
    note,
    mood: selectedMood,
    date: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  });

  journalTitle.value = '';
  journalEntry.value = '';
  renderEntries();
  moodSummary.textContent = 'your note is tucked away safely.';
  saveState();
}

function showFocusOverlay() {
  const heading = currentMode === 'work' ? 'focus mode' : 'break time';
  const message = currentMode === 'work'
    ? focusTips[Math.floor(Math.random() * focusTips.length)]
    : breakIdeas[Math.floor(Math.random() * breakIdeas.length)];

  focusPanel.classList.remove('is-visible');
  focusOverlay.classList.remove('hidden');
  focusOverlay.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => {
    focusHeading.textContent = heading;
    focusMessage.textContent = message;
    focusExtra.innerHTML = currentMode === 'work'
      ? '<p>try one small task first, then let the rest come after.</p>'
      : '<p>take a slow sip of water or look out the window for a moment.</p>';
    focusPanel.classList.add('is-visible');
  });
}

function hideFocusOverlay() {
  focusPanel.classList.remove('is-visible');
  setTimeout(() => {
    focusOverlay.classList.add('hidden');
    focusOverlay.setAttribute('aria-hidden', 'true');
  }, 180);
}

function playLocalAudio() {
  localAudio.volume = volume;
  localAudio.play().then(() => {
    isAudioPlaying = true;
    saveState();
  }).catch(() => {
    isAudioPlaying = false;
  });
}

function pauseLocalAudio() {
  localAudio.pause();
  isAudioPlaying = false;
  saveState();
}

function updateVolume(nextValue) {
  volume = Number(nextValue);
  localAudio.volume = volume;
  if (isAudioPlaying) {
    localAudio.play().catch(() => {});
  }
  saveState();
}

function addTrail(event) {
  const dot = document.createElement('span');
  dot.className = 'trail-dot';
  dot.style.left = `${event.clientX}px`;
  dot.style.top = `${event.clientY}px`;
  trailLayer.appendChild(dot);
  setTimeout(() => dot.remove(), 700);
}

function init() {
  updateClock();
  setInterval(updateClock, 1000);
  restoreState();
  renderTimer();

  enterBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden');
    deskScreen.classList.remove('hidden');
    saveState();
  });

  focusOverlayBtn.addEventListener('click', showFocusOverlay);
  closeFocusBtn.addEventListener('click', hideFocusOverlay);
  focusOverlay.addEventListener('click', (event) => {
    if (event.target === focusOverlay) {
      hideFocusOverlay();
    }
  });

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);
  workInput.addEventListener('change', syncTimerSettings);
  breakInput.addEventListener('change', syncTimerSettings);

  taskForm.addEventListener('submit', addTask);

  moodButtons.forEach((button) => {
    button.addEventListener('click', () => updateMood(button.dataset.mood));
  });

  saveEntryBtn.addEventListener('click', saveJournal);

  playLocalBtn.addEventListener('click', playLocalAudio);
  pauseLocalBtn.addEventListener('click', pauseLocalAudio);
  volumeSlider.addEventListener('input', (event) => updateVolume(event.target.value));

  document.getElementById('themePeach').addEventListener('click', () => {
    document.body.dataset.theme = 'peach';
    saveState();
  });

  document.getElementById('themeLavender').addEventListener('click', () => {
    document.body.dataset.theme = 'lavender';
    saveState();
  });

  document.getElementById('themeSage').addEventListener('click', () => {
    document.body.dataset.theme = 'sage';
    saveState();
  });

  document.getElementById('themeMint').addEventListener('click', () => {
    document.body.dataset.theme = 'mint';
    saveState();
  });

  document.getElementById('themeDark').addEventListener('click', () => {
    document.body.dataset.theme = 'dark';
    saveState();
  });

  document.getElementById('themePeach').insertAdjacentHTML('afterend', '<button id="themeMonochrome" class="pill-btn">monochrome</button>');
  document.getElementById('themeMonochrome').addEventListener('click', () => {
    document.body.dataset.theme = 'monochrome';
    saveState();
  });

  phraseChips.forEach((chip) => {
    chip.addEventListener('mouseenter', () => {
      phrasePreview.textContent = chip.dataset.phrase;
    });
    chip.addEventListener('mouseleave', () => {
      phrasePreview.textContent = 'hover over a phrase to see a little cheer.';
    });
  });

  document.addEventListener('pointermove', addTrail);
}

init();
