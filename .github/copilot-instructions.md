<!-- Copilot / AI agent instructions for this Rails + Mongoid app -->

# Repo snapshot (short)

- Rails 8 monolith using Mongoid (MongoDB) instead of ActiveRecord.
- Frontend: Importmap + Stimulus + Turbo; JS lives under `app/javascript`.
- API namespace: `app/controllers/api/v1/*` (example: `books_controller.rb`).
- Use project `bin/` wrappers (CI relies on them): `bin/rails`, `bin/brakeman`, `bin/rubocop`, `bin/importmap`.

# What an AI agent must know to be productive

- Data layer: models use Mongoid. Inspect `app/models/*.rb` for fields, validations, and indexes; do not assume ActiveRecord APIs (no joins/AR transactions).
- Routes: API endpoints are namespaced under `/api/v1`. Modify `config/routes.rb` and add controllers under `app/controllers/api/v1`.
- Tests: CI runs `RAILS_ENV=test bin/rails db:test:prepare test test:system`. Tests expect a MongoDB available (dev: `my_app_development`; test: `my_app_test` — see `config/mongoid.yml`).

# Exact commands CI runs (mirror these locally)

- Security scan: `bin/brakeman --no-pager`
- JS dependency audit: `bin/importmap audit`
- Lint: `bin/rubocop -f github`
- Run tests: `RAILS_ENV=test bin/rails db:test:prepare test test:system`

# MongoDB specifics (practical examples)

- Default hosts: `localhost:27017`. Test DB: `my_app_test`. To override, set a Mongoid client URI env var before running Rails (PowerShell example):

```powershell
$env:MONGOID_CLIENT_DEFAULT_URI = 'mongodb://localhost:27017/my_app_development'
```

- Quick local MongoDB (Docker):

```powershell
docker run --rm -d -p 27017:27017 --name myapp-mongo mongo:6
```

- Inspect DB with `mongosh`:

```powershell
mongosh --host localhost --port 27017
# then: show dbs; use my_app_development; db.books.find().pretty()
```

- Build indexes defined in models:

```powershell
bin/rails runner "Mongoid::Tasks::Database.create_indexes"
```

# Project-specific conventions & patterns

- Prefer thin controllers; return JSON in API controllers with `render json: ...`.
- Add API tests under `test/` or `spec/` (this repo has both test and spec folders; follow existing tests’ style when changing behavior).
- When adding JavaScript modules, update `config/importmap.rb` and place code in `app/javascript`.

# Safe editing checklist for AI agents

- Update `config/routes.rb` for new API endpoints and add matching controller files under `app/controllers/api/v1`.
- Update or add model indexes via Mongoid model macros; run the index creation command above.
- Use `bin/` wrappers when invoking tasks locally to match CI.
- Never commit credentials; always reference env var names (e.g., `MONGOID_CLIENT_DEFAULT_URI`, `REDIS_URL`).

---

If you want this expanded into a one-page developer onboarding (Windows-focused setup, `bin/setup` script, or a sample controller test), say which and I'll add it.