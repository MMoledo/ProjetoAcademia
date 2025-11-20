# Produto: Acompanhamento de Treinos de Musculação (Mobile-first)

## 1. Resumo do produto
O sistema é um web app responsivo pensado para uso principal em smartphones, permitindo que praticantes de musculação cadastrem-se, gerenciem exercícios e treinos, agendem sessões em um calendário e registrem execuções com cargas, repetições e RIR. O foco é oferecer uma interface rápida e acessível para usuários que treinam sozinhos ou recebem acompanhamento remoto, incluindo anexos de mídia para suporte visual de técnica e evolução.

## 2. Arquitetura de telas (UX)
- **Autenticação**: Login, Cadastro, Recuperar senha.
- **Home/Dashboard**: próximo treino agendado, treino do dia, atalhos, resumo semanal.
- **Meus Treinos**: lista, criação, edição, duplicação, exclusão, detalhamento do modelo de treino.
- **Meus Exercícios**: CRUD de exercícios, galeria de mídia do exercício.
- **Calendário**: visão mensal/semana, agendar/visualizar treinos, acessar treino do dia.
- **Execução de Treino (sessão)**: checklist de exercícios/séries, registros de carga/rep/RIR, comentários do treino, anexos por série/exercício.
- **Histórico**: linha do tempo de sessões concluídas, filtros por período e exercício, detalhes com rep/RIR/observações.
- **Configurações/Perfil**: preferências (tema, unidade de carga, metas semanais), dados de conta.

### Fluxo de navegação
1. **Não autenticado**: Splash → Login ↔ Cadastro → Recuperar senha.
2. **Autenticado**: Home → (atalhos) Meus Treinos / Meus Exercícios / Calendário / Histórico / Perfil.
3. **Execução**: Home → Treino do dia (via calendário ou card) → Execução → Encerrar sessão → Histórico.
4. **Edição rápida**: Treino do dia → adicionar/ocultar exercício (somente na sessão) ou editar modelo (afetando treinos futuros) via modal com opção clara de escopo.

## 3. Detalhamento funcional
### Autenticação
- Cadastro: nome, e-mail, senha com validação de complexidade; opt-in de lembretes.
- Login persistente com sessão segura (refresh token/httpOnly).
- Recuperar senha via e-mail.

### Home/Dashboard
- Cards: próximo treino agendado, treino do dia (com botão "Iniciar"), métricas semanais (treinos concluídos, volume total, aderência à meta), streak de dias ativos.
- Atalhos: Meus Treinos, Exercícios, Calendário, Histórico.
- Estado vazio: sugestão de criar primeiro treino ou usar templates.

### Meus Exercícios
- Lista com filtros por grupo muscular/equipamento/favoritos.
- Formulário de criação/edição: nome*, grupo muscular, equipamentos, observações, tags, padrão de séries (aquecimento/preparação/trabalho) com repetições e RIR/falha configuráveis.
- Mídia: upload/visualização de fotos e vídeos, miniaturas e player; ação para remover mídia.
- Reutilização: exercício serve de base para múltiplos treinos.

### Meus Treinos (modelos)
- Criar/editar/excluir/duplicar treinos-modelo (ex.: Upper 1).
- Organizar exercícios com ordem e variações específicas: séries (aquecimento/preparação/trabalho), repetições, RIR/falha, tempo de descanso opcional.
- Edição com escopo: alterar só neste treino-modelo ou propagar para outros treinos que compartilham o exercício.
- Salvar como template público/privado (futuro) e favoritá-los.

### Calendário
- Visual mensal e semanal; destaque para treino do dia; ícones para concluído (check), agendado (ponto), faltante (alerta).
- Agendar treino: selecionar data → escolher treino-modelo → opcional: meta de duração/observação.
- Reagendar por arrastar (drag) ou menu de contexto.

### Execução de Treino (sessão)
- Header com nome do treino, data, status (em andamento/concluído), timer e botão de encerrar.
- Lista de exercícios na ordem definida; cada exercício expande séries.
- Por série de trabalho: peso, repetições, RIR (ou checkbox "até a falha"), observações rápidas; atalho "replicar valores" para próximas séries.
- Ajustes pontuais: adicionar/remover exercício apenas nesta sessão; botão "Aplicar ao modelo" para tornar permanente.
- Anexos: fotos/vídeos por exercício/série; visualização inline.
- Comentário geral da sessão e percepção de esforço.

### Histórico
- Timeline por dia, com filtro por período, grupo muscular e tipo de treino.
- Detalhe da sessão: cargas/rep/RIR por série, anexos, comentários, volume total e comparação com sessões anteriores do mesmo treino/exercício.
- Exportar dados (CSV/JSON) e compartilhamento rápido.

### Configurações/Perfil
- Dados pessoais; alternância de unidade (kg/lb), tema (claro/escuro), lembretes, metas semanais (n treinos), privacidade de mídia.

## 4. Modelo de dados (alto nível)
- **User**: id, name, email, password_hash, preferences (unidade, tema, metas, lembretes), created_at.
- **Exercise**: id, user_id, name, muscle_group, equipment, notes, default_sets (estrutura JSON para aquecimento/preparação/trabalho), tags, created_at.
- **WorkoutTemplate**: id, user_id, name, description, exercises (ordem + ajustes de séries/rep/RIR/descanso), is_favorite, created_at.
- **WorkoutSchedule**: id, user_id, workout_template_id, date, status (scheduled/completed/skipped), note.
- **WorkoutSession**: id, user_id, workout_template_id (opcional), scheduled_id (opcional), date, duration, perceived_effort, comment, volume_total.
- **WorkoutExerciseInstance**: id, session_id, exercise_id, name_snapshot, order, sets[] (peso, reps, rir/falha, observação), media_ids[].
- **ExerciseMedia**: id, user_id, exercise_id (opcional), session_id (opcional), file_url, type (image/video), thumbnail_url, created_at, visibility.
- **Streak/Stats (derivadas)**: vistas materializadas ou cálculos em API para métricas e dashboard.

Relações principais:
- User 1:N Exercise, WorkoutTemplate, WorkoutSchedule, WorkoutSession.
- WorkoutTemplate N:M Exercise (com ordem e ajustes via tabela de junção WorkoutTemplateExercise).
- WorkoutSchedule referencia WorkoutTemplate; WorkoutSession referencia Schedule opcionalmente.
- WorkoutExerciseInstance referencia Exercise (snapshot) e pertence à Session.
- ExerciseMedia pode referenciar Exercise ou WorkoutExerciseInstance.

## 5. Sugestão de tecnologias
- **Front-end**: Next.js (App Router) + React + TypeScript; UI mobile-first com Tailwind CSS; componente de calendário (e.g., react-day-picker); Zustand ou React Query para estado/cache; formulários com React Hook Form + Zod.
- **Back-end**: API REST ou GraphQL com NestJS/Express (TypeScript) ou FastAPI (Python). Sugestão: NestJS REST + Prisma.
- **Banco de dados**: PostgreSQL (relacional, transações, consultas ricas para histórico/relatórios). Armazenar sets como linhas para análises; campos JSON apenas para presets.
- **Storage**: serviço de objetos (S3/Cloudflare R2) para mídia; CDN para entrega.
- **Autenticação**: JWT access + refresh httpOnly; proteção CSRF; rate limiting; opção de OAuth social futura.
- **Infra**: Deploy em Vercel (front) + Render/Fly.io (API) + Supabase/RDS (DB) + S3; monitoramento (Sentry) e logs estruturados.

## 6. Esqueleto de implementação
### Estrutura de pastas (monorepo opcional)
```
.
├── apps
│   ├── web/ (Next.js)
│   └── api/ (NestJS)
├── packages
│   ├── ui/ (design system compartilhado)
│   └── config/ (eslint, tsconfig)
└── docs/ (especificações)
```

### Componentes principais (front)
- `components/layout/NavBarMobile.tsx`: navegação inferior com ícones grandes; acesso rápido a Home, Treinos, Exercícios, Calendário, Perfil.
- `components/dashboard/Tiles.tsx`: cards de próximo treino, treino do dia e métricas semanais.
- `components/workout/ExerciseForm.tsx`: CRUD de exercício com presets de séries (aquecimento/preparação/trabalho) e galeria.
- `components/workout/WorkoutBuilder.tsx`: montagem de treino arrastando/ordenando exercícios, escolha de escopo de edição.
- `components/schedule/Calendar.tsx`: agenda com estados (agendado, concluído, perdido) e atalho para iniciar.
- `components/session/SessionTracker.tsx`: UI de execução com inputs rápidos de carga/rep/RIR, replicar valores e anexos inline.
- `components/history/SessionDetail.tsx`: comparação de sessões e gráfico de evolução do exercício.

### Endpoints básicos (REST NestJS)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/forgot`.
- `GET/POST/PATCH/DELETE /exercises` (lista com filtros; inclui upload de mídia via URL assinado).
- `GET/POST/PATCH/DELETE /workouts` (templates); `POST /workouts/:id/duplicate`.
- `GET/POST/PATCH/DELETE /schedules` (agendamento por data).
- `GET/POST/PATCH/DELETE /sessions` (execução do treino) com payload de sets e mídia vinculada.
- `GET /stats/overview` (dashboard) e `GET /stats/exercise/:id` (evolução por exercício).

### Exemplo de schema (Prisma simplificado)
```prisma
model User {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  password    String
  preferences Json?
  exercises   Exercise[]
  templates   WorkoutTemplate[]
  schedules   WorkoutSchedule[]
  sessions    WorkoutSession[]
}

model Exercise {
  id            String   @id @default(cuid())
  user          User     @relation(fields: [userId], references: [id])
  userId        String
  name          String
  muscleGroup   String?
  equipment     String?
  notes         String?
  defaultSets   Json?
  tags          String[]
  media         ExerciseMedia[]
  templateLinks WorkoutTemplateExercise[]
}

model WorkoutTemplate {
  id          String   @id @default(cuid())
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  name        String
  description String?
  exercises   WorkoutTemplateExercise[]
  isFavorite  Boolean  @default(false)
}

model WorkoutTemplateExercise {
  id                 String   @id @default(cuid())
  template           WorkoutTemplate @relation(fields: [templateId], references: [id])
  templateId         String
  exercise           Exercise @relation(fields: [exerciseId], references: [id])
  exerciseId         String
  order              Int
  overrideSets       Json?
  restSeconds        Int?
}

model WorkoutSchedule {
  id          String   @id @default(cuid())
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  template    WorkoutTemplate @relation(fields: [templateId], references: [id])
  templateId  String
  date        DateTime
  status      String   @default("scheduled")
  note        String?
  session     WorkoutSession?
}

model WorkoutSession {
  id            String   @id @default(cuid())
  user          User     @relation(fields: [userId], references: [id])
  userId        String
  template      WorkoutTemplate? @relation(fields: [templateId], references: [id])
  templateId    String?
  schedule      WorkoutSchedule? @relation(fields: [scheduleId], references: [id])
  scheduleId    String?
  date          DateTime @default(now())
  durationMin   Int?
  perceivedEffort Int?
  comment       String?
  volumeTotal   Int?
  exercises     WorkoutExerciseInstance[]
}

model WorkoutExerciseInstance {
  id          String   @id @default(cuid())
  session     WorkoutSession @relation(fields: [sessionId], references: [id])
  sessionId   String
  exercise    Exercise @relation(fields: [exerciseId], references: [id])
  exerciseId  String
  nameSnapshot String
  order       Int
  sets        Json
  media       ExerciseMedia[]
}

model ExerciseMedia {
  id          String   @id @default(cuid())
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  exercise    Exercise? @relation(fields: [exerciseId], references: [id])
  exerciseId  String?
  sessionExercise WorkoutExerciseInstance? @relation(fields: [sessionExerciseId], references: [id])
  sessionExerciseId String?
  fileUrl     String
  thumbnailUrl String?
  type        String
  visibility  String  @default("private")
  createdAt   DateTime @default(now())
}
```

## 7. Lista de melhorias futuras
- Notificações push/email: lembrete de treino do dia e de registrar sessão.
- Gamificação: streaks, metas semanais com badges, ranking pessoal de consistência.
- Modo offline com sync posterior; cache otimista na execução de treino.
- Coaching remoto: compartilhamento de treinos com treinador, feedback via comentários em série.
- Inteligência de progressão: sugestões de carga/rep com base no histórico e RIR; alertas de platô.
- Integração com wearables (Apple Health/Google Fit) para ritmo cardíaco e calorias.
- Exportação/backup completo e importação de planilhas.
- A/B test de UI para uso com uma mão (thumb zone) e gestos rápidos (swipe para completar série).
