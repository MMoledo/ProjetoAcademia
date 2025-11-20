const STORAGE_KEY = 'projeto-academia-state-v1';

const defaultExercises = [
  {
    id: crypto.randomUUID(),
    name: 'Supino Reto com Barra',
    group: 'Peito',
    equipment: 'Barra',
    warmupSets: 2,
    prepSets: 2,
    workSets: 3,
    notes: 'Controlar a excêntrica em 2s',
    media: ['https://youtu.be/ViKKRdhYijc'],
  },
  {
    id: crypto.randomUUID(),
    name: 'Agachamento Livre',
    group: 'Quadríceps',
    equipment: 'Barra',
    warmupSets: 2,
    prepSets: 1,
    workSets: 4,
    notes: 'Atenção à postura neutra',
    media: [],
  },
];

const defaultWorkouts = [
  {
    id: crypto.randomUUID(),
    name: 'Upper 1',
    exerciseIds: [],
  },
  {
    id: crypto.randomUUID(),
    name: 'Lower 1',
    exerciseIds: [],
  },
];

defaultWorkouts[0].exerciseIds = [defaultExercises[0].id];
defaultWorkouts[1].exerciseIds = [defaultExercises[1].id];

const defaultSchedule = [
  {
    id: crypto.randomUUID(),
    workoutId: defaultWorkouts[0].id,
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: crypto.randomUUID(),
    workoutId: defaultWorkouts[1].id,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  },
];

let state = {
  users: [],
  userId: null,
  exercises: defaultExercises,
  workouts: defaultWorkouts,
  schedule: defaultSchedule,
  sessions: [],
};

const elements = {
  sections: document.querySelectorAll('main > section'),
  navButtons: document.querySelectorAll('.bottom-nav button, .quick-actions button'),
  authSection: document.getElementById('authSection'),
  homeSection: document.getElementById('homeSection'),
  exercisesSection: document.getElementById('exercisesSection'),
  workoutsSection: document.getElementById('workoutsSection'),
  calendarSection: document.getElementById('calendarSection'),
  sessionSection: document.getElementById('sessionSection'),
  historySection: document.getElementById('historySection'),
  authInfo: document.getElementById('authInfo'),
  homeMetrics: document.getElementById('homeMetrics'),
  nextWorkoutInfo: document.getElementById('nextWorkoutInfo'),
  goToTodayWorkout: document.getElementById('goToTodayWorkout'),
  logoutBtn: document.getElementById('logoutBtn'),
  exerciseList: document.getElementById('exerciseList'),
  exerciseForm: document.getElementById('exerciseForm'),
  workoutForm: document.getElementById('workoutForm'),
  workoutTemplate: document.getElementById('workoutTemplate'),
  workoutExercises: document.getElementById('workoutExercises'),
  workoutList: document.getElementById('workoutList'),
  scheduleForm: document.getElementById('scheduleForm'),
  scheduleWorkout: document.getElementById('scheduleWorkout'),
  scheduleList: document.getElementById('scheduleList'),
  sessionContent: document.getElementById('sessionContent'),
  completeSessionBtn: document.getElementById('completeSessionBtn'),
  historyList: document.getElementById('historyList'),
  themeToggle: document.getElementById('themeToggle'),
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    state = JSON.parse(stored);
  } else {
    saveState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setActiveSection(targetId) {
  elements.sections.forEach((section) => {
    section.classList.toggle('hidden', section.id !== targetId);
  });
  elements.navButtons.forEach((btn) => {
    const matches = btn.dataset.target === targetId;
    btn.classList.toggle('active', matches);
  });
}

function requireAuth(action) {
  if (!state.userId) {
    elements.authInfo.textContent = 'Faça login para acessar o restante do app.';
    setActiveSection('authSection');
    return false;
  }
  return true;
}

function currentUser() {
  return state.users.find((u) => u.id === state.userId);
}

function renderHome() {
  if (!requireAuth()) return;
  const today = new Date().toISOString().split('T')[0];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const fromDate = startOfWeek.toISOString().split('T')[0];
  const completedThisWeek = state.sessions.filter((s) => s.date >= fromDate).length;
  const scheduledToday = state.schedule.find((s) => s.date === today);
  const next = state.schedule
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  elements.homeMetrics.innerHTML = `
    <div class="metric"><p class="muted">Treinos na semana</p><strong>${completedThisWeek}</strong></div>
    <div class="metric"><p class="muted">Exercícios cadastrados</p><strong>${state.exercises.length}</strong></div>
    <div class="metric"><p class="muted">Treinos montados</p><strong>${state.workouts.length}</strong></div>
    <div class="metric"><p class="muted">Sessões concluídas</p><strong>${state.sessions.length}</strong></div>
  `;

  if (next) {
    const workout = state.workouts.find((w) => w.id === next.workoutId);
    elements.nextWorkoutInfo.textContent = `${workout?.name || 'Treino'} em ${next.date}`;
  } else {
    elements.nextWorkoutInfo.textContent = 'Sem treinos agendados.';
  }

  elements.goToTodayWorkout.onclick = () => {
    if (!scheduledToday) {
      alert('Nenhum treino agendado para hoje.');
      return;
    }
    openSession(scheduledToday.id);
  };
}

function renderExercises() {
  const list = state.exercises
    .map((ex) => {
      const media = ex.media?.length ? `<span class="pill">${ex.media.length} mídia(s)</span>` : '';
      return `
        <div class="list-item">
          <h4>${ex.name}</h4>
          <div class="details-row">
            ${ex.group ? `<span class="pill">${ex.group}</span>` : ''}
            ${ex.equipment ? `<span class="pill warn">${ex.equipment}</span>` : ''}
            <span class="muted">${ex.workSets} séries de trabalho</span>
          </div>
          <p class="muted">${ex.notes || 'Sem observações'}</p>
          <div class="exercise-actions">
            <button class="ghost-btn" data-edit-ex="${ex.id}">Editar</button>
            <button class="ghost-btn" data-delete-ex="${ex.id}">Excluir</button>
          </div>
        </div>
      `;
    })
    .join('');
  elements.exerciseList.innerHTML = list || '<p class="muted">Nenhum exercício cadastrado.</p>';

  elements.exerciseList.querySelectorAll('[data-edit-ex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ex = state.exercises.find((e) => e.id === btn.dataset.editEx);
      if (!ex) return;
      elements.exerciseForm.dataset.editing = ex.id;
      document.getElementById('exerciseName').value = ex.name;
      document.getElementById('exerciseGroup').value = ex.group || '';
      document.getElementById('exerciseEquipment').value = ex.equipment || '';
      document.getElementById('exerciseWarmup').value = ex.warmupSets;
      document.getElementById('exercisePrep').value = ex.prepSets;
      document.getElementById('exerciseWork').value = ex.workSets;
      document.getElementById('exerciseNotes').value = ex.notes || '';
      document.getElementById('exerciseMedia').value = ex.media?.[0] || '';
      setActiveSection('exercisesSection');
    });
  });

  elements.exerciseList.querySelectorAll('[data-delete-ex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.exercises = state.exercises.filter((e) => e.id !== btn.dataset.deleteEx);
      saveState();
      renderExercises();
      syncWorkoutSelectors();
    });
  });
}

function syncWorkoutSelectors() {
  elements.workoutExercises.innerHTML = state.exercises
    .map((ex) => `<option value="${ex.id}">${ex.name}</option>`)
    .join('');
  elements.scheduleWorkout.innerHTML =
    '<option value="">Selecione</option>' +
    state.workouts.map((w) => `<option value="${w.id}">${w.name}</option>`).join('');
  elements.workoutTemplate.innerHTML =
    '<option value="">Sem modelo</option>' +
    state.workouts.map((w) => `<option value="${w.id}">${w.name}</option>`).join('');
}

function renderWorkouts() {
  const list = state.workouts
    .map((w) => {
      const exercises = w.exerciseIds
        .map((id) => state.exercises.find((e) => e.id === id)?.name || 'Exercício removido')
        .join(', ');
      return `
        <div class="list-item">
          <h4>${w.name}</h4>
          <p class="muted">${exercises || 'Nenhum exercício adicionado'}</p>
          <div class="workout-actions">
            <button class="ghost-btn" data-edit-workout="${w.id}">Editar</button>
            <button class="ghost-btn" data-duplicate-workout="${w.id}">Duplicar</button>
            <button class="ghost-btn" data-delete-workout="${w.id}">Excluir</button>
          </div>
        </div>
      `;
    })
    .join('');
  elements.workoutList.innerHTML = list || '<p class="muted">Nenhum treino salvo.</p>';

  elements.workoutList.querySelectorAll('[data-edit-workout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const workout = state.workouts.find((w) => w.id === btn.dataset.editWorkout);
      if (!workout) return;
      elements.workoutForm.dataset.editing = workout.id;
      document.getElementById('workoutName').value = workout.name;
      [...elements.workoutExercises.options].forEach((opt) => {
        opt.selected = workout.exerciseIds.includes(opt.value);
      });
      setActiveSection('workoutsSection');
    });
  });

  elements.workoutList.querySelectorAll('[data-delete-workout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.workouts = state.workouts.filter((w) => w.id !== btn.dataset.deleteWorkout);
      saveState();
      renderWorkouts();
      syncWorkoutSelectors();
    });
  });

  elements.workoutList.querySelectorAll('[data-duplicate-workout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const base = state.workouts.find((w) => w.id === btn.dataset.duplicateWorkout);
      if (!base) return;
      const copy = { ...base, id: crypto.randomUUID(), name: `${base.name} (cópia)` };
      state.workouts.push(copy);
      saveState();
      renderWorkouts();
      syncWorkoutSelectors();
    });
  });
}

function renderSchedule() {
  const list = state.schedule
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const workout = state.workouts.find((w) => w.id === s.workoutId);
      return `
        <div class="list-item">
          <div class="details-row">
            <span class="pill">${s.date}</span>
            <span>${workout?.name || 'Treino removido'}</span>
          </div>
          <button class="ghost-btn" data-remove-schedule="${s.id}">Remover</button>
        </div>
      `;
    })
    .join('');
  elements.scheduleList.innerHTML = list || '<p class="muted">Nenhum agendamento.</p>';
  elements.scheduleList.querySelectorAll('[data-remove-schedule]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.schedule = state.schedule.filter((s) => s.id !== btn.dataset.removeSchedule);
      saveState();
      renderSchedule();
    });
  });
}

function openSession(scheduleId) {
  const schedule = state.schedule.find((s) => s.id === scheduleId);
  if (!schedule) return;
  const workout = state.workouts.find((w) => w.id === schedule.workoutId);
  const exercises = workout?.exerciseIds.map((id) => state.exercises.find((e) => e.id === id)).filter(Boolean) || [];
  const session = {
    id: scheduleId,
    workoutId: workout?.id,
    date: schedule.date,
    logs: exercises.map((ex) => ({
      exerciseId: ex.id,
      sets: Array.from({ length: ex.workSets || 3 }, () => ({ weight: '', reps: '', rir: '' })),
    })),
  };
  state.sessions = state.sessions.filter((s) => s.id !== scheduleId);
  state.sessions.push(session);
  saveState();
  renderSession(session);
  setActiveSection('sessionSection');
}

function renderSession(session) {
  const workout = state.workouts.find((w) => w.id === session.workoutId);
  elements.sessionContent.innerHTML = `
    <p class="muted">${session.date} · ${workout?.name || 'Treino'}</p>
    ${session.logs
      .map((log) => {
        const exercise = state.exercises.find((e) => e.id === log.exerciseId);
        return `
          <div class="session-card" data-exercise="${log.exerciseId}">
            <div class="section-header">
              <h4>${exercise?.name || 'Exercício'}</h4>
              ${exercise?.media?.[0] ? `<a class="muted" href="${exercise.media[0]}" target="_blank">Vídeo</a>` : ''}
            </div>
            <div class="session-sets">
              ${log.sets
                .map((set, index) => `
                  <label> Série ${index + 1}
                    <input type="number" placeholder="Carga (kg)" value="${set.weight}" data-set-weight="${index}">
                  </label>
                  <label>
                    <input type="number" placeholder="Reps" value="${set.reps}" data-set-reps="${index}">
                  </label>
                  <label>
                    <input type="text" placeholder="RIR ou falha" value="${set.rir}" data-set-rir="${index}">
                  </label>
                `)
                .join('')}
            </div>
          </div>
        `;
      })
      .join('')}
    <label>Observações gerais
      <textarea id="sessionNotes" rows="3" placeholder="Como foi o treino?"></textarea>
    </label>
  `;

  elements.sessionContent.querySelectorAll('[data-set-weight]').forEach((input) => {
    input.addEventListener('input', () => updateSessionSet(session.id, input));
  });
  elements.sessionContent.querySelectorAll('[data-set-reps]').forEach((input) => {
    input.addEventListener('input', () => updateSessionSet(session.id, input));
  });
  elements.sessionContent.querySelectorAll('[data-set-rir]').forEach((input) => {
    input.addEventListener('input', () => updateSessionSet(session.id, input));
  });
}

function updateSessionSet(sessionId, input) {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  const exerciseId = input.closest('[data-exercise]').dataset.exercise;
  const setIndex = Number(input.dataset.setWeight || input.dataset.setReps || input.dataset.setRir);
  const log = session.logs.find((l) => l.exerciseId === exerciseId);
  if (!log) return;
  const key = input.dataset.setWeight !== undefined ? 'weight' : input.dataset.setReps !== undefined ? 'reps' : 'rir';
  log.sets[setIndex][key] = input.value;
  saveState();
}

function renderHistory() {
  const list = state.sessions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((session) => {
      const workout = state.workouts.find((w) => w.id === session.workoutId);
      const volume = session.logs.reduce((total, log) => {
        return (
          total +
          log.sets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0)
        );
      }, 0);
      return `
        <div class="list-item">
          <div class="details-row">
            <span class="pill">${session.date}</span>
            <span>${workout?.name || 'Treino'}</span>
            <span class="muted">Volume: ${volume} kg·reps</span>
          </div>
        </div>
      `;
    })
    .join('');
  elements.historyList.innerHTML = list || '<p class="muted">Sem sessões concluídas.</p>';
}

// Event listeners

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const user = state.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    elements.authInfo.textContent = 'Credenciais não encontradas. Cadastre-se primeiro.';
    return;
  }
  state.userId = user.id;
  saveState();
  elements.authInfo.textContent = `Bem-vindo, ${user.name}!`;
  setActiveSection('homeSection');
  renderHome();
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  if (state.users.some((u) => u.email === email)) {
    elements.authInfo.textContent = 'Já existe uma conta com este e-mail.';
    return;
  }
  const newUser = { id: crypto.randomUUID(), name, email, password };
  state.users.push(newUser);
  state.userId = newUser.id;
  saveState();
  elements.authInfo.textContent = `Conta criada. Bem-vindo, ${name}!`;
  setActiveSection('homeSection');
  renderHome();
});

elements.logoutBtn.addEventListener('click', () => {
  state.userId = null;
  saveState();
  setActiveSection('authSection');
});

elements.navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target !== 'authSection' && !requireAuth()) return;
    setActiveSection(target);
    if (target === 'homeSection') renderHome();
    if (target === 'exercisesSection') renderExercises();
    if (target === 'workoutsSection') renderWorkouts();
    if (target === 'calendarSection') renderSchedule();
    if (target === 'historySection') renderHistory();
  });
});

elements.exerciseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!requireAuth()) return;
  const payload = {
    id: elements.exerciseForm.dataset.editing || crypto.randomUUID(),
    name: document.getElementById('exerciseName').value,
    group: document.getElementById('exerciseGroup').value,
    equipment: document.getElementById('exerciseEquipment').value,
    warmupSets: Number(document.getElementById('exerciseWarmup').value || 0),
    prepSets: Number(document.getElementById('exercisePrep').value || 0),
    workSets: Number(document.getElementById('exerciseWork').value || 3),
    notes: document.getElementById('exerciseNotes').value,
    media: document.getElementById('exerciseMedia').value
      ? [document.getElementById('exerciseMedia').value]
      : [],
  };
  const exists = state.exercises.find((e) => e.id === payload.id);
  if (exists) {
    Object.assign(exists, payload);
  } else {
    state.exercises.push(payload);
  }
  elements.exerciseForm.reset();
  delete elements.exerciseForm.dataset.editing;
  saveState();
  renderExercises();
  syncWorkoutSelectors();
});

elements.workoutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!requireAuth()) return;
  const name = document.getElementById('workoutName').value;
  const selectedExercises = [...elements.workoutExercises.selectedOptions].map((o) => o.value);
  const payload = {
    id: elements.workoutForm.dataset.editing || crypto.randomUUID(),
    name,
    exerciseIds: selectedExercises,
  };
  const existing = state.workouts.find((w) => w.id === payload.id);
  if (existing) {
    Object.assign(existing, payload);
  } else {
    state.workouts.push(payload);
  }
  elements.workoutForm.reset();
  delete elements.workoutForm.dataset.editing;
  saveState();
  renderWorkouts();
  syncWorkoutSelectors();
});

elements.workoutTemplate.addEventListener('change', () => {
  const baseId = elements.workoutTemplate.value;
  if (!baseId) return;
  const base = state.workouts.find((w) => w.id === baseId);
  if (!base) return;
  document.getElementById('workoutName').value = `${base.name} (novo)`;
  [...elements.workoutExercises.options].forEach((opt) => {
    opt.selected = base.exerciseIds.includes(opt.value);
  });
});

elements.scheduleForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!requireAuth()) return;
  const workoutId = elements.scheduleWorkout.value;
  const date = document.getElementById('scheduleDate').value;
  if (!workoutId) return alert('Selecione um treino.');
  if (!date) return alert('Escolha uma data.');
  const entry = { id: crypto.randomUUID(), workoutId, date };
  state.schedule.push(entry);
  saveState();
  renderSchedule();
});

elements.completeSessionBtn.addEventListener('click', () => {
  const current = state.sessions[state.sessions.length - 1];
  if (!current) return;
  current.completedAt = new Date().toISOString();
  saveState();
  alert('Treino salvo no histórico!');
  renderHistory();
  setActiveSection('historySection');
});

// Theme toggle
const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
if (prefersLight) document.documentElement.classList.add('light');

elements.themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
});

// Initialize
loadState();
syncWorkoutSelectors();
renderExercises();
renderWorkouts();
renderSchedule();

if (state.userId) {
  setActiveSection('homeSection');
  renderHome();
} else {
  setActiveSection('authSection');
}
