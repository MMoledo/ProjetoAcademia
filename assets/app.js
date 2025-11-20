import {
  createUser,
  getUserByEmail,
  ensureSeedUser,
} from './db.js';

const STORAGE_KEY = 'projeto-academia-state-v2';
const GOOGLE_CLIENT_ID = 'SEU_CLIENT_ID_GOOGLE';

function buildDefaults() {
  const exercises = [
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

  const workouts = [
    { id: crypto.randomUUID(), name: 'Upper 1', exerciseIds: [exercises[0].id] },
    { id: crypto.randomUUID(), name: 'Lower 1', exerciseIds: [exercises[1].id] },
  ];

  const schedule = [
    {
      id: crypto.randomUUID(),
      workoutId: workouts[0].id,
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: crypto.randomUUID(),
      workoutId: workouts[1].id,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    },
  ];

  return {
    exercises,
    workouts,
    schedule,
    sessions: [],
  };
}

let state = {
  userId: null,
  profiles: {},
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
  googleLoginBtn: document.getElementById('googleLoginBtn'),
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    state = JSON.parse(stored);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureProfile(userId) {
  if (!state.profiles[userId]) {
    state.profiles[userId] = buildDefaults();
    saveState();
  }
  return state.profiles[userId];
}

function getUserData() {
  if (!state.userId) return null;
  return ensureProfile(state.userId);
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

function requireAuth() {
  if (!state.userId) {
    elements.authInfo.textContent = 'Faça login para acessar o restante do app.';
    setActiveSection('authSection');
    return false;
  }
  return true;
}

function renderHome() {
  if (!requireAuth()) return;
  const data = getUserData();
  const today = new Date().toISOString().split('T')[0];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const fromDate = startOfWeek.toISOString().split('T')[0];
  const completedThisWeek = data.sessions.filter((s) => s.date >= fromDate).length;
  const scheduledToday = data.schedule.find((s) => s.date === today);
  const next = data.schedule.filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];

  elements.homeMetrics.innerHTML = `
    <div class="metric"><p class="muted">Treinos na semana</p><strong>${completedThisWeek}</strong></div>
    <div class="metric"><p class="muted">Exercícios cadastrados</p><strong>${data.exercises.length}</strong></div>
    <div class="metric"><p class="muted">Treinos montados</p><strong>${data.workouts.length}</strong></div>
    <div class="metric"><p class="muted">Sessões concluídas</p><strong>${data.sessions.length}</strong></div>
  `;

  if (next) {
    const workout = data.workouts.find((w) => w.id === next.workoutId);
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
  const data = getUserData();
  const list = data.exercises
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
      const ex = data.exercises.find((e) => e.id === btn.dataset.editEx);
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
    });
  });

  elements.exerciseList.querySelectorAll('[data-delete-ex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = data.exercises.findIndex((e) => e.id === btn.dataset.deleteEx);
      if (idx >= 0) {
        data.exercises.splice(idx, 1);
        saveState();
        renderExercises();
        renderWorkouts();
      }
    });
  });
}

function renderWorkouts() {
  const data = getUserData();
  elements.workoutExercises.innerHTML = data.exercises
    .map((ex) => `<option value="${ex.id}">${ex.name}</option>`)
    .join('');
  elements.scheduleWorkout.innerHTML = data.workouts.map((w) => `<option value="${w.id}">${w.name}</option>`).join('');

  elements.workoutTemplate.innerHTML = `<option value="">Sem modelo</option>${data.workouts
    .map((w) => `<option value="${w.id}">${w.name}</option>`)
    .join('')}`;

  const list = data.workouts
    .map((w) => {
      const exercises = w.exerciseIds
        .map((id) => data.exercises.find((ex) => ex.id === id)?.name || 'Exercício removido')
        .join(', ');
      return `
        <div class="list-item">
          <h4>${w.name}</h4>
          <p class="muted">${exercises || 'Sem exercícios'}</p>
          <div class="workout-actions">
            <button class="ghost-btn" data-edit-workout="${w.id}">Editar</button>
            <button class="ghost-btn" data-delete-workout="${w.id}">Excluir</button>
          </div>
        </div>
      `;
    })
    .join('');
  elements.workoutList.innerHTML = list || '<p class="muted">Nenhum treino cadastrado.</p>';

  elements.workoutList.querySelectorAll('[data-edit-workout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const w = data.workouts.find((wk) => wk.id === btn.dataset.editWorkout);
      if (!w) return;
      elements.workoutForm.dataset.editing = w.id;
      document.getElementById('workoutName').value = w.name;
      document.getElementById('workoutExercises').value = w.exerciseIds;
    });
  });

  elements.workoutList.querySelectorAll('[data-delete-workout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = data.workouts.findIndex((wk) => wk.id === btn.dataset.deleteWorkout);
      if (idx >= 0) {
        data.workouts.splice(idx, 1);
        saveState();
        renderWorkouts();
        renderSchedule();
      }
    });
  });
}

function renderSchedule() {
  const data = getUserData();
  const list = data.schedule
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const workout = data.workouts.find((w) => w.id === s.workoutId);
      return `
        <div class="list-item">
          <h4>${workout?.name || 'Treino'}</h4>
          <div class="details-row">
            <span class="pill">${s.date}</span>
          </div>
          <div class="workout-actions">
            <button class="ghost-btn" data-open-session="${s.id}">Abrir</button>
            <button class="ghost-btn" data-delete-schedule="${s.id}">Remover</button>
          </div>
        </div>
      `;
    })
    .join('');
  elements.scheduleList.innerHTML = list || '<p class="muted">Nenhum treino agendado.</p>';

  elements.scheduleList.querySelectorAll('[data-open-session]').forEach((btn) => {
    btn.addEventListener('click', () => openSession(btn.dataset.openSession));
  });

  elements.scheduleList.querySelectorAll('[data-delete-schedule]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = data.schedule.findIndex((s) => s.id === btn.dataset.deleteSchedule);
      if (idx >= 0) {
        data.schedule.splice(idx, 1);
        saveState();
        renderSchedule();
      }
    });
  });
}

function renderHistory() {
  const data = getUserData();
  const list = data.sessions
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((session) => {
      const workout = data.workouts.find((w) => w.id === session.workoutId);
      const totalVolume = session.entries.reduce((sum, ex) => sum + ex.sets.reduce((acc, set) => acc + set.weight * set.reps, 0), 0);
      return `
        <div class="list-item">
          <h4>${workout?.name || 'Treino'}</h4>
          <div class="details-row">
            <span class="pill">${session.date}</span>
            <span class="pill warn">Volume: ${totalVolume} kg</span>
          </div>
          <p class="muted">${session.notes || 'Sem observações'}</p>
        </div>
      `;
    })
    .join('');
  elements.historyList.innerHTML = list || '<p class="muted">Histórico vazio.</p>';
}

function openSession(scheduleId) {
  if (!requireAuth()) return;
  const data = getUserData();
  setActiveSection('sessionSection');
  const schedule = data.schedule.find((s) => s.id === scheduleId);
  if (!schedule) return;
  const workout = data.workouts.find((w) => w.id === schedule.workoutId);
  if (!workout) return;

  const exercises = workout.exerciseIds
    .map((id) => data.exercises.find((ex) => ex.id === id))
    .filter(Boolean);

  elements.sessionContent.innerHTML = exercises
    .map((ex) => {
      const setInputs = Array.from({ length: ex.workSets }, (_, idx) => {
        return `
          <label>Série ${idx + 1} - Peso (kg)
            <input type="number" inputmode="decimal" data-ex="${ex.id}" data-set-weight="${idx}" min="0" placeholder="0">
          </label>
          <label>Repetições
            <input type="number" inputmode="numeric" data-ex="${ex.id}" data-set-reps="${idx}" min="0" placeholder="0">
          </label>
          <label>RIR
            <input type="number" inputmode="numeric" data-ex="${ex.id}" data-set-rir="${idx}" min="0" max="10" placeholder="2">
          </label>
        `;
      }).join('');
      return `
        <div class="session-card">
          <h4>${ex.name}</h4>
          <p class="muted">${ex.notes || 'Concentre-se na técnica'}</p>
          <div class="session-sets">${setInputs}</div>
        </div>
      `;
    })
    .join('');

  elements.completeSessionBtn.onclick = () => completeSession(scheduleId);
}

function completeSession(scheduleId) {
  const data = getUserData();
  const schedule = data.schedule.find((s) => s.id === scheduleId);
  if (!schedule) return;
  const workout = data.workouts.find((w) => w.id === schedule.workoutId);
  const entries = workout.exerciseIds.map((exId) => {
    const sets = [];
    const exercise = data.exercises.find((ex) => ex.id === exId);
    for (let i = 0; i < exercise.workSets; i += 1) {
      const weight = Number(document.querySelector(`[data-ex="${exId}"][data-set-weight="${i}"]`)?.value || 0);
      const reps = Number(document.querySelector(`[data-ex="${exId}"][data-set-reps="${i}"]`)?.value || 0);
      const rir = Number(document.querySelector(`[data-ex="${exId}"][data-set-rir="${i}"]`)?.value || 0);
      sets.push({ weight, reps, rir });
    }
    return { exerciseId: exId, sets };
  });

  data.sessions.push({
    id: crypto.randomUUID(),
    workoutId: workout.id,
    date: new Date().toISOString().split('T')[0],
    entries,
    notes: document.getElementById('sessionNotes')?.value || '',
  });

  data.schedule = data.schedule.filter((s) => s.id !== scheduleId);
  saveState();
  renderHome();
  renderSchedule();
  renderHistory();
  setActiveSection('homeSection');
}

function bindForms() {
  elements.exerciseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = getUserData();
    const payload = {
      id: elements.exerciseForm.dataset.editing || crypto.randomUUID(),
      name: document.getElementById('exerciseName').value,
      group: document.getElementById('exerciseGroup').value,
      equipment: document.getElementById('exerciseEquipment').value,
      warmupSets: Number(document.getElementById('exerciseWarmup').value),
      prepSets: Number(document.getElementById('exercisePrep').value),
      workSets: Number(document.getElementById('exerciseWork').value),
      notes: document.getElementById('exerciseNotes').value,
      media: document.getElementById('exerciseMedia').value ? [document.getElementById('exerciseMedia').value] : [],
    };

    const existingIdx = data.exercises.findIndex((ex) => ex.id === payload.id);
    if (existingIdx >= 0) {
      data.exercises[existingIdx] = payload;
    } else {
      data.exercises.push(payload);
    }
    elements.exerciseForm.reset();
    delete elements.exerciseForm.dataset.editing;
    saveState();
    renderExercises();
    renderWorkouts();
  });

  elements.workoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = getUserData();
    const selectedExercises = Array.from(document.getElementById('workoutExercises').selectedOptions).map((o) => o.value);
    let exerciseIds = selectedExercises;
    const templateId = document.getElementById('workoutTemplate').value;
    if (!selectedExercises.length && templateId) {
      const template = data.workouts.find((w) => w.id === templateId);
      exerciseIds = template?.exerciseIds || [];
    }

    const payload = {
      id: elements.workoutForm.dataset.editing || crypto.randomUUID(),
      name: document.getElementById('workoutName').value,
      exerciseIds,
    };

    const existingIdx = data.workouts.findIndex((w) => w.id === payload.id);
    if (existingIdx >= 0) {
      data.workouts[existingIdx] = payload;
    } else {
      data.workouts.push(payload);
    }

    elements.workoutForm.reset();
    delete elements.workoutForm.dataset.editing;
    saveState();
    renderWorkouts();
    renderSchedule();
  });

  elements.scheduleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = getUserData();
    const payload = {
      id: crypto.randomUUID(),
      workoutId: document.getElementById('scheduleWorkout').value,
      date: document.getElementById('scheduleDate').value,
    };
    data.schedule.push(payload);
    elements.scheduleForm.reset();
    saveState();
    renderSchedule();
  });
}

function bindNavigation() {
  elements.navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.target === 'authSection') {
        setActiveSection('authSection');
        return;
      }
      if (!requireAuth()) return;
      setActiveSection(btn.dataset.target);
    });
  });
}

function bindThemeToggle() {
  elements.themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
  });
}

function bindAuth() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const user = await getUserByEmail(email);
    if (!user || user.password !== password) {
      elements.authInfo.textContent = 'Credenciais inválidas.';
      return;
    }
    state.userId = user.id;
    ensureProfile(user.id);
    saveState();
    elements.authInfo.textContent = `Bem-vindo(a), ${user.name}!`;
    renderAll();
    setActiveSection('homeSection');
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const existing = await getUserByEmail(email);
    if (existing) {
      elements.authInfo.textContent = 'Já existe uma conta com este e-mail.';
      return;
    }
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      provider: 'local',
      createdAt: new Date().toISOString(),
    };
    await createUser(newUser);
    state.userId = newUser.id;
    ensureProfile(newUser.id);
    saveState();
    elements.authInfo.textContent = 'Conta criada com sucesso!';
    renderAll();
    setActiveSection('homeSection');
    registerForm.reset();
  });

  elements.logoutBtn.addEventListener('click', () => {
    state.userId = null;
    saveState();
    setActiveSection('authSection');
  });

  elements.googleLoginBtn.addEventListener('click', handleGoogleLogin);
}

async function handleGoogleLogin() {
  if (window.google && GOOGLE_CLIENT_ID !== 'SEU_CLIENT_ID_GOOGLE') {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        const profile = decodeJwtCredential(response.credential);
        await completeGoogleLogin(profile);
      },
    });
    window.google.accounts.id.prompt();
  } else {
    await completeGoogleLogin({
      name: 'Usuário Google Demo',
      email: 'demo.google@projetoacademia.com',
      sub: 'google-demo-user',
    });
    elements.authInfo.textContent = 'Login com Google (modo demonstração). Configure seu CLIENT_ID para uso real.';
  }
}

function decodeJwtCredential(credential) {
  try {
    const payload = credential.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (err) {
    console.error('Não foi possível ler o token do Google', err);
    return null;
  }
}

async function completeGoogleLogin(profile) {
  if (!profile) return;
  const email = profile.email || `${profile.sub}@google-user.local`;
  const existing = await getUserByEmail(email);
  const user = existing || {
    id: crypto.randomUUID(),
    name: profile.name || 'Usuário Google',
    email,
    password: null,
    provider: 'google',
    createdAt: new Date().toISOString(),
  };
  if (!existing) {
    await ensureSeedUser(user);
  }
  state.userId = user.id;
  ensureProfile(user.id);
  saveState();
  elements.authInfo.textContent = `Autenticado como ${user.name} via Google.`;
  renderAll();
  setActiveSection('homeSection');
}

function renderAll() {
  if (!state.userId) return;
  renderHome();
  renderExercises();
  renderWorkouts();
  renderSchedule();
  renderHistory();
}

async function seedDemoUser() {
  const demoUser = {
    id: 'demo-user',
    name: 'Demo',
    email: 'demo@projetoacademia.com',
    password: '123456',
    provider: 'local',
    createdAt: new Date().toISOString(),
  };
  await ensureSeedUser(demoUser);
}

async function init() {
  loadState();
  await seedDemoUser();
  bindNavigation();
  bindThemeToggle();
  bindAuth();
  bindForms();

  if (state.userId) {
    renderAll();
    setActiveSection('homeSection');
  } else {
    setActiveSection('authSection');
  }
}

init();
