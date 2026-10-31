const WORKOUT_PLAN = {
  day1: {
    title: "Giorno 1 · Petto - Dorso - Polpacci",
    exercises: [
      { id: "d1_e1", name: "Chest Press", sets: 4, reps: "10", rest: 60 },
      { id: "d1_e2", name: "Pec Fly", sets: 4, reps: "10", rest: 60 },
      { id: "d1_e3", name: "Chest Press Inclinata", sets: 4, reps: "10", rest: 60 },
      { id: "d1_e4", name: "Curl con Manubri", sets: 4, reps: "10", rest: 60 },
      { id: "d1_e5", name: "Curl Singolo al Cavo", sets: 4, reps: "10", rest: 60 },
      { id: "d1_e6", name: "Curl a Martello", sets: 4, reps: "10", rest: 60 },
      { id: "d1_e7", name: "Calf Raise in Piedi", sets: 4, reps: "10", rest: 60 }
    ]
  },
  day2: {
    title: "Giorno 2 · Dorso -Tricipiti - Quadricipiti",
    exercises: [
      { id: "d2_e1", name: "Lat Machine", sets: 4, reps: "10", rest: 60 },
      { id: "d2_e2", name: "Pulley Basso", sets: 4, reps: "10", rest: 60 },
      { id: "d2_e3", name: "Hig Row", sets: 4, reps: "10", rest: 60 },
      { id: "d2_e4", name: "Dip", sets: 4, reps: "10", rest: 60 ,}
      { id: "d1_e5", name: "French Press", sets: 4, reps: "10", rest: 60 },
      { id: "d1_e6", name: "Push Down", sets: 4, reps: "10", rest: 60 },
      { id: "d1_e7", name: "Leg Extension Singola", sets: 4, reps: "10", rest: 60 },
    ]
  },
  day3: {
    title: "Giorno 3 · Spalle - Glutei",
    exercises: [
      { id: "d3_e1", name: "Arnold Press", sets: 4, reps: "10", rest: 60 },
      { id: "d3_e2", name: "Alazate Alternate", sets: 4, reps: "10", rest: 60 },
      { id: "d3_e3", name: "Alzate Laterali al Cavo", sets: 4, reps: "10", rest: 60 },
      { id: "d3_e4", name: "Leg Press", sets: 4, reps: "10", rest: 60 },
      { id: "d1_e5", name: "Squat", sets: 4, reps: "10", rest: 60 },
    ]
  },
  day4: {
    title: "Giorno 4 · Richiamo Generale",
    exercises: [
      { id: "d4_e1", name: "Richiamo Generale", rest: 60 }
    ]
  }
};

let currentDay = localStorage.getItem('active_day') || 'day1';
let workoutHistory = JSON.parse(localStorage.getItem('gym_workout_history')) || {};
let weekStatus = JSON.parse(localStorage.getItem('gym_week_status')) || {};
let timerInterval = null;
let remainingSeconds = 0;

let workoutStartTime = localStorage.getItem('gym_current_start_time')
  ? parseInt(localStorage.getItem('gym_current_start_time'), 10)
  : null;

let currentDate = new Date();

const dayTitleEl = document.getElementById('day-title');
const exercisesListEl = document.getElementById('exercises-list');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabIndicator = document.getElementById('tab-indicator');
const timerBar = document.getElementById('rest-timer');
const timerDisplay = document.getElementById('timer-display');
const progressFill = document.getElementById('progress-fill');
const weekDays = document.querySelectorAll('.week-day');
const startBtn = document.getElementById('start-workout');

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

function ensureTodayRecord() {
  const todayKey = getTodayKey();
  if (!workoutHistory[todayKey]) {
    workoutHistory[todayKey] = {
      dayType: currentDay,
      sets: {},
      durationSeconds: 0,
      saved: false
    };
  }
  return workoutHistory[todayKey];
}

function saveState() {
  localStorage.setItem('gym_workout_history', JSON.stringify(workoutHistory));
  localStorage.setItem('gym_week_status', JSON.stringify(weekStatus));
}

function updateWeekUI() {
  weekDays.forEach((el, index) => {
    el.classList.remove('active-orange', 'active-green');
    const status = weekStatus[index];
    if (status === 'orange') el.classList.add('active-orange');
    if (status === 'green') el.classList.add('active-green');
  });

  // Se l'allenamento di oggi è già iniziato (arancione) o salvato (verde), nascondi il tasto Inizia
  const todayIdx = getTodayIndex();
  if (weekStatus[todayIdx] === 'orange' || weekStatus[todayIdx] === 'green') {
    startBtn.classList.add('fade-out');
  } else {
    startBtn.classList.remove('fade-out');
  }
}

// Calcola la barra di progresso e controlla se tutte le serie sono completate
function updateProgressAndAutoCheck() {
  const dayData = WORKOUT_PLAN[currentDay];
  const todayRecord = ensureTodayRecord();
  const currentSavedSets = todayRecord.sets;

  let totalSets = 0;
  let completedSets = 0;

  dayData.exercises.forEach(ex => {
    for (let s = 1; s <= ex.sets; s++) {
      totalSets++;
      const key = `${ex.id}_s${s}`;
      if (currentSavedSets[key] && currentSavedSets[key].done) {
        completedSets++;
      }
    }
  });

  const percent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  progressFill.style.width = `${percent}%`;

  const todayIdx = getTodayIndex();

  // Se l'utente spunta il 100% degli esercizi, diventa verde e salva in automatico
  if (totalSets > 0 && completedSets === totalSets) {
    weekStatus[todayIdx] = 'green';
    todayRecord.saved = true;
    if (workoutStartTime && !todayRecord.durationSeconds) {
      todayRecord.durationSeconds = Math.max(60, Math.floor((Date.now() - workoutStartTime) / 1000));
    }
  } else if (!todayRecord.saved && weekStatus[todayIdx] === 'green') {
    weekStatus[todayIdx] = 'orange';
  }

  saveState();
  updateWeekUI();
}

// Cerca l'allenamento salvato precedente dello stesso Giorno X per mostrare i pesi di riferimento
function getPreviousWorkoutForDay(dayKey, excludeDateKey) {
  const sortedDates = Object.keys(workoutHistory)
    .filter(d => d < excludeDateKey && workoutHistory[d].dayType === dayKey && workoutHistory[d].saved)
    .sort((a, b) => b.localeCompare(a));

  return sortedDates.length > 0 ? workoutHistory[sortedDates[0]] : null;
}

function renderDay(dayKey) {
  currentDay = dayKey;
  localStorage.setItem('active_day', dayKey);
  const dayData = WORKOUT_PLAN[dayKey];
  dayTitleEl.textContent = dayData.title;
  exercisesListEl.innerHTML = '';

  const todayKey = getTodayKey();
  const todayRecord = ensureTodayRecord();
  todayRecord.dayType = dayKey;
  const currentSavedSets = todayRecord.sets;

  // Recupera i pesi della sessione precedente dello stesso giorno per usarli come suggerimento (placeholder)
  const prevRecord = getPreviousWorkoutForDay(dayKey, todayKey);

  dayData.exercises.forEach((ex, idx) => {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.style.animationDelay = `${idx * 0.05}s`;

    let setsHTML = '';
    for (let s = 1; s <= ex.sets; s++) {
      const key = `${ex.id}_s${s}`;
      const entry = currentSavedSets[key] || { weight: '', reps: '', done: false };
      const prevSet = prevRecord && prevRecord.sets && prevRecord.sets[key] ? prevRecord.sets[key] : null;

      const weightPlaceholder = prevSet && prevSet.weight ? prevSet.weight : '0';
      const repsPlaceholder = prevSet && prevSet.reps ? prevSet.reps : ex.reps;

      setsHTML += `
        <div class="set-row ${entry.done ? 'done' : ''}" data-key="${key}" data-rest="${ex.rest}">
          <span class="set-num">#${s}</span>
          <div class="input-box">
            <input type="number" step="0.5" placeholder="${weightPlaceholder}" value="${entry.weight}" data-field="weight">
            <span>kg</span>
          </div>
          <div class="input-box">
            <input type="number" placeholder="${repsPlaceholder}" value="${entry.reps}" data-field="reps">
            <span>rep</span>
          </div>
          <button class="check-btn" aria-label="Completa serie">✓</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-header">
        <div class="exercise-title">${ex.name}</div>
        <div class="exercise-meta">
          <span class="badge target">${ex.sets} × ${ex.reps}</span>
          <span class="badge">Rec ${ex.rest}s</span>
        </div>
      </div>
      <div class="sets-list">${setsHTML}</div>
    `;

    exercisesListEl.appendChild(card);
  });

  attachRowListeners();
  updateProgressAndAutoCheck();
}

function attachRowListeners() {
  document.querySelectorAll('.set-row').forEach(row => {
    const key = row.dataset.key;
    const restTime = parseInt(row.dataset.rest, 10);
    const todayRecord = ensureTodayRecord();
    const currentSavedSets = todayRecord.sets;

    row.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        if (!currentSavedSets[key]) currentSavedSets[key] = { weight: '', reps: '', done: false };
        currentSavedSets[key][input.dataset.field] = input.value;
        saveState();
      });
    });

    const checkBtn = row.querySelector('.check-btn');
    checkBtn.addEventListener('click', () => {
      if (!currentSavedSets[key]) currentSavedSets[key] = { weight: '', reps: '', done: false };
      currentSavedSets[key].done = !currentSavedSets[key].done;
      row.classList.toggle('done', currentSavedSets[key].done);

      // Se l'utente spunta una serie ma non aveva premuto "Inizia", avvia comunque lo stato arancione
      const todayIdx = getTodayIndex();
      if (!weekStatus[todayIdx]) {
        weekStatus[todayIdx] = 'orange';
        workoutStartTime = Date.now();
        localStorage.setItem('gym_current_start_time', workoutStartTime);
      }

      saveState();
      updateProgressAndAutoCheck();

      if (currentSavedSets[key].done) {
        startRestTimer(restTime);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    });
  });
}

// 1. PULSANTE "INIZIA": Bollino diventa ARANCIONE e il tasto sparisce
startBtn.addEventListener('click', () => {
  const todayIdx = getTodayIndex();
  weekStatus[todayIdx] = 'orange';
  workoutStartTime = Date.now();
  localStorage.setItem('gym_current_start_time', workoutStartTime);

  const todayRecord = ensureTodayRecord();
  todayRecord.dayType = currentDay;

  saveState();
  updateWeekUI();

  if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
});

// 2. PULSANTE "SALVA ALLENAMENTO": Salva tutto a prescindere dalle serie completate e mette il bollino VERDE
document.getElementById('save-workout').addEventListener('click', () => {
  const todayIdx = getTodayIndex();
  const todayRecord = ensureTodayRecord();

  todayRecord.dayType = currentDay;
  todayRecord.saved = true;

  // Assicura che ogni input scritto anche senza spunta verde venga registrato
  document.querySelectorAll('.set-row').forEach(row => {
    const key = row.dataset.key;
    const weightVal = row.querySelector('input[data-field="weight"]').value;
    const repsVal = row.querySelector('input[data-field="reps"]').value;
    const isDone = row.classList.contains('done');

    if (!todayRecord.sets[key]) {
      todayRecord.sets[key] = { weight: '', reps: '', done: false };
    }
    todayRecord.sets[key].weight = weightVal;
    todayRecord.sets[key].reps = repsVal;
    // Se ha inserito kg o rep ma ha dimenticato la spunta, la consideriamo svolta nel salvataggio
    todayRecord.sets[key].done = isDone || (weightVal !== '' || repsVal !== '');
  });

  if (workoutStartTime) {
    todayRecord.durationSeconds = Math.max(60, Math.floor((Date.now() - workoutStartTime) / 1000));
  } else if (!todayRecord.durationSeconds) {
    todayRecord.durationSeconds = 2700; // Default 45 min se non aveva premuto Inizia
  }

  weekStatus[todayIdx] = 'green';
  saveState();
  renderDay(currentDay);
  updateWeekUI();

  if (navigator.vibrate) navigator.vibrate([60, 50, 100]);
  alert('Allenamento salvato nello storico del calendario!');
});

// 3. PULSANTE "ANNULLA ALLENAMENTO": Azzera l'allenamento di oggi e riporta il bollino BIANCO
document.getElementById('cancel-workout').addEventListener('click', () => {
  const conferma = confirm("Vuoi davvero annullare l'allenamento di oggi? Il bollino tornerà bianco e i dati inseriti oggi verranno rimossi.");
  if (!conferma) return;

  const todayIdx = getTodayIndex();
  const todayKey = getTodayKey();

  delete weekStatus[todayIdx];
  delete workoutHistory[todayKey];
  workoutStartTime = null;
  localStorage.removeItem('gym_current_start_time');

  clearInterval(timerInterval);
  timerBar.classList.add('hidden');

  saveState();
  renderDay(currentDay);
  updateWeekUI();
});

// Navigazione Viste (Allenamento <-> Calendario)
document.querySelectorAll('.nav-view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const view = btn.dataset.view;
    document.getElementById('view-workout').classList.toggle('hidden', view !== 'workout');
    document.getElementById('view-calendar').classList.toggle('hidden', view !== 'calendar');

    if (view === 'calendar') {
      renderCalendar();
      showDayDetail(getTodayKey());
    }
  });
});

// Griglia Calendario Mensile
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthTitle = document.getElementById('calendar-month-title');
  grid.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const options = { month: 'long', year: 'numeric' };
  monthTitle.textContent = currentDate.toLocaleDateString('it-IT', options);

  const firstDayIndex = new Date(year, month, 1).getDay();
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'cal-day';
    dayCell.textContent = day;

    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateKey = `${year}-${formattedMonth}-${formattedDay}`;

    const dayRecord = workoutHistory[dateKey];
    let isSavedWorkout = false;

    if (dayRecord) {
      const setsArr = dayRecord.sets ? Object.values(dayRecord.sets) : [];
      const allDone = setsArr.length > 0 && setsArr.every(s => s.done);
      if (dayRecord.saved || allDone) {
        isSavedWorkout = true;
      }
    }

    if (isSavedWorkout) {
      dayCell.classList.add('completed');
    }

    const dNow = new Date();
    if (year === dNow.getFullYear() && month === dNow.getMonth() && day === dNow.getDate()) {
      dayCell.classList.add('today');
    }

    dayCell.addEventListener('click', () => {
      document.querySelectorAll('.cal-day').forEach(c => c.style.outline = 'none');
      dayCell.style.outline = '2px solid #a855f7';
      showDayDetail(dateKey);
    });

    grid.appendChild(dayCell);
  }
}

// RIEPILOGO COMPLETO NEL CALENDARIO (Ogni esercizio, ogni serie, Kg, Rep e Progresso/Regresso)
function showDayDetail(dateKey) {
  const detailContainer = document.getElementById('calendar-detail');
  const record = workoutHistory[dateKey];

  if (!record || (!record.saved && (!record.sets || Object.keys(record.sets).length === 0))) {
    detailContainer.innerHTML = `
      <div class="cal-detail-header">
        <div>
          <div class="cal-detail-title">Data: ${dateKey}</div>
        </div>
      </div>
      <p class="cal-placeholder">Nessun allenamento salvato in questa data.</p>
    `;
    return;
  }

  const dayKey = record.dayType || 'day1';
  const dayPlan = WORKOUT_PLAN[dayKey];
  const planName = dayPlan ? dayPlan.title : "Allenamento";

  // Durata
  let durationText = "⏱️ N/D";
  if (record.durationSeconds && record.durationSeconds > 0) {
    const mins = Math.max(1, Math.round(record.durationSeconds / 60));
    durationText = `⏱️ ${mins} min`;
  }

  // Cerca l'allenamento precedente dello stesso giorno per calcolare il progresso/regresso
  const prevRecord = getPreviousWorkoutForDay(dayKey, dateKey);

  let html = `
    <div class="cal-detail-header">
      <div>
        <div class="cal-detail-title">${dateKey}</div>
        <div class="cal-detail-sub">${planName}</div>
      </div>
      <span class="cal-duration-pill">${durationText}</span>
    </div>
    <div style="max-height: 360px; overflow-y: auto; padding-right: 4px;">
  `;

  if (dayPlan && dayPlan.exercises) {
    dayPlan.exercises.forEach(ex => {
      html += `
        <div class="cal-ex-card">
          <div class="cal-ex-title">
            <span>${ex.name}</span>
            <span style="font-size:11px; color:#9ca3af;">Target: ${ex.sets}×${ex.reps}</span>
          </div>
      `;

      for (let s = 1; s <= ex.sets; s++) {
        const setKey = `${ex.id}_s${s}`;
        const setData = (record.sets && record.sets[setKey]) ? record.sets[setKey] : null;
        const prevSetData = (prevRecord && prevRecord.sets && prevRecord.sets[setKey]) ? prevRecord.sets[setKey] : null;

        const w = setData && setData.weight !== '' ? parseFloat(setData.weight) : null;
        const r = setData && setData.reps !== '' ? parseInt(setData.reps, 10) : null;
        const wasDone = setData && (setData.done || w !== null || r !== null);

        // Calcolo confronto Progresso / Regresso rispetto alla volta precedente
        let diffBadge = '';
        if (wasDone && prevSetData && prevSetData.weight !== '') {
          const prevW = parseFloat(prevSetData.weight);
          const prevR = parseInt(prevSetData.reps || 0, 10);
          const currW = w || 0;
          const currR = r || 0;

          if (currW > prevW) {
            const diffW = +(currW - prevW).toFixed(1);
            diffBadge = `<span class="cal-diff-badge up">+${diffW} kg ▲</span>`;
          } else if (currW < prevW) {
            const diffW = +(currW - prevW).toFixed(1);
            diffBadge = `<span class="cal-diff-badge down">${diffW} kg ▼</span>`;
          } else if (currR > prevR) {
            diffBadge = `<span class="cal-diff-badge up">+${currR - prevR} rep ▲</span>`;
          } else if (currR < prevR) {
            diffBadge = `<span class="cal-diff-badge down">${currR - prevR} rep ▼</span>`;
          } else {
            diffBadge = `<span class="cal-diff-badge same">= uguale</span>`;
          }
        }

        if (wasDone) {
          html += `
            <div class="cal-set-row">
              <span class="cal-set-num">#${s}</span>
              <span class="cal-set-values">${w !== null ? w : 0} kg × ${r !== null ? r : 0} rep</span>
              ${diffBadge}
            </div>
          `;
        } else {
          html += `
            <div class="cal-set-row skipped">
              <span class="cal-set-num">#${s}</span>
              <span class="cal-set-values">Serie non svolta</span>
            </div>
          `;
        }
      }

      html += `</div>`;
    });
  }

  html += `</div>`;
  detailContainer.innerHTML = html;
}

document.getElementById('prev-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

function startRestTimer(seconds) {
  clearInterval(timerInterval);
  remainingSeconds = seconds;
  updateTimerUI();
  timerBar.classList.remove('hidden');

  timerInterval = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerBar.classList.add('hidden');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } else {
      updateTimerUI();
    }
  }, 1000);
}

function updateTimerUI() {
  const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const s = String(remainingSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
}

document.getElementById('timer-add').addEventListener('click', () => {
  remainingSeconds += 15;
  updateTimerUI();
});

document.getElementById('timer-skip').addEventListener('click', () => {
  clearInterval(timerInterval);
  timerBar.classList.add('hidden');
});

tabBtns.forEach((btn, index) => {
  if (btn.dataset.day === currentDay) {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tabIndicator.style.transform = `translateX(${index * 100}%)`;
  }

  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tabIndicator.style.transform = `translateX(${index * 100}%)`;
    renderDay(btn.dataset.day);
  });
});

// Avvio iniziale
renderDay(currentDay);
updateWeekUI();
