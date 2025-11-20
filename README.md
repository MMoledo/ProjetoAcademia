# ProjetoAcademia

Site mobile-first para acompanhamento de treinos. Abra `index.html` em um servidor estático (ex.: `python -m http.server 8000`) e gerencie exercícios, treinos, calendário e histórico.

## Login e base de dados
- Usuários são armazenados em IndexedDB com suporte a cadastro local e login via Google.
- O botão **Entrar com Google** funciona em modo demonstração por padrão; para uso real, defina seu `client_id` no arquivo `assets/app.js` (constante `GOOGLE_CLIENT_ID`).
- Cada usuário autenticado possui seus próprios exercícios, treinos, agendamentos e sessões persistidos em localStorage.

Documentação de UX, arquitetura e requisitos está em [`docs/product_design.md`](docs/product_design.md).
