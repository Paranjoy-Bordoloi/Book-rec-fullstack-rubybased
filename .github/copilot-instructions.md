<!-- Copilot / AI agent instructions for this Rails + Mongoid app -->
# Quick orientation

This repository is a Rails 8 API+HTML application using Mongoid (MongoDB) as the primary ORM, Propshaft for assets, and Importmap for ESM JavaScript. Key directories:

- `app/` — standard Rails app code (controllers, models, views, javascript).
- `config/` — boot and environment configuration. See `config/mongoid.yml` for DB clients.
- `bin/` — project CLI wrappers (use `bin/rails`, `bin/brakeman`, `bin/rubocop`, `bin/importmap`, etc.).
- `.github/workflows/ci.yml` — CI commands and test sequence (see "CI & test commands" below).

# Big picture and patterns

- Architecture: Rails monolith (controllers + views + API namespaces). API controllers live under `app/controllers/api/v1/` (example: `app/controllers/api/v1/books_controller.rb`).
- Data layer: Mongoid models (no ActiveRecord). Look for `app/models/*.rb` and `config/mongoid.yml` for environment DB names.
- Frontend: Importmap + Stimulus/Turbo. JavaScript modules are in `app/javascript/controllers/*` and loaded with importmap entries (see `config/importmap.rb`).

# Project-specific conventions

- Use the `bin/` scripts for build, lint, and security scans — CI calls them directly. Examples: `bin/rails`, `bin/brakeman`, `bin/rubocop`, `bin/importmap`.
- Routes: API endpoints are namespaced under `/api/v1` (see `config/routes.rb`). When adding endpoints, follow the same namespace and controller folder pattern.
- Tests: `rake`/`bin/rails` test tasks use MongoDB local instances. Tests set `RAILS_ENV=test` and expect a running MongoDB on `localhost:27017` unless CI provides a different client URI.

# CI & test commands (copyable)

- Static analysis (run locally):
  - `bin/brakeman --no-pager`
  - `bin/rubocop -f github`
  - `bin/importmap audit`
- Run the test suite (uses system dependencies like Chrome for system tests):
  - `RAILS_ENV=test bin/rails db:test:prepare test test:system`

# Integration & external dependencies

- Database: MongoDB (configured in `config/mongoid.yml`). Default hosts point to `localhost:27017`.
- Optional: Redis is referenced in CI comments (used by Action Cable/Sidekiq if enabled). If you add Redis-backed features, wire `REDIS_URL` in env.
- Docker/Kamal: The project includes `Dockerfile` and `kamal` for deployment — follow existing Docker and Kamal files for production packaging.

## MongoDB specifics

- `config/mongoid.yml` defines clients and the test DB name. By default the test DB is `my_app_test` and development uses `my_app_development`.
- Tests and app expect MongoDB on `localhost:27017`. You can override connection using a full URI via environment variables; common patterns:

```powershell
# Set a MongoDB URI for local runs (PowerShell)
$env:MONGOID_CLIENT_DEFAULT_URI = 'mongodb://user:password@localhost:27017/my_app_development'

# Or set the driver URI used by tests
$env:MONGOID_CLIENT_DEFAULT_URI = 'mongodb://localhost:27017/my_app_test'
```

- Docker (quick mongod):

```powershell
docker run --rm -d -p 27017:27017 --name myapp-mongo mongo:6
```

- Open a shell with `mongosh` to inspect DBs and collections:

```powershell
mongosh --host localhost --port 27017
# then in mongosh: show dbs; use my_app_development; db.books.find().pretty()
```

- Creating indexes: Mongoid usually defines indexes in model classes. To build them manually run (Rails runner):

```powershell
bin/rails runner "Mongoid::Tasks::Database.create_indexes"
```

- Common pitfalls for AI agents working here:
  - Do not assume relational DB concepts (no joins/transactions like ActiveRecord). Use Mongoid query patterns (see `app/models/*`).
  - Tests may leave data in the test DB if interrupted; prefer running `bin/rails db:test:prepare` which CI uses.
  - If CI uses a different MongoDB URI, it will be set in CI environment; don't hardcode credentials in code.

# Examples and idioms

- API controller pattern: keep controllers thin, return JSON directly using `render json: ...`. Example: `app/controllers/api/v1/books_controller.rb`.
- Routes example: `resources :books, only: [:index, :show]` is defined in `config/routes.rb` under the `api/v1` namespace.

# When editing code, prefer these low-risk changes first

- Add small controller actions + corresponding tests under `test/controllers` or `test/integration`.
- Update importmap entries in `config/importmap.rb` when adding JS modules under `app/javascript`.

# Where to look when something breaks

- Boot/runtime errors: `config/boot.rb`, `config/application.rb`.
- DB issues: `config/mongoid.yml` and environment variables used to override `uri`.
- CI failures: check `.github/workflows/ci.yml` to see which bin scripts the CI runs; run them locally with the same env.

# Notes for AI agents

- Preserve controller namespaces and file locations. For API changes, update `config/routes.rb` and corresponding tests.
- Use `bin/` wrappers instead of calling `rails`/`ruby` directly to match CI behavior and dependency resolution.
- Do not assume ActiveRecord APIs — models use Mongoid. Inspect `app/models` for fields and associations.

If anything above is unclear or you'd like more specifics (CI secrets, local env setups, or sample integration tests), tell me which area to expand.

## Try it locally (Windows developer hints)

- Ruby: this repo targets `ruby-3.4.5` (see `.ruby-version`). Use your Ruby manager of choice (rbenv, rvm, or RubyInstaller on Windows) to install that version.
- MongoDB: tests and the app expect a running MongoDB on `localhost:27017` by default. On Windows, install MongoDB Community or use Docker:

```powershell
# Start a MongoDB container (Docker must be installed)
docker run --rm -d -p 27017:27017 --name myapp-mongo mongo:6
```

- Run linters and scans locally using the `bin/` wrappers (these are what CI runs):

```powershell
bin/brakeman --no-pager
bin/rubocop -f github
bin/importmap audit
```

- Run tests locally (system tests require Chrome):

```powershell
# Ensure MongoDB is available and then:
$env:RAILS_ENV = 'test'; bin\rails db:test:prepare test test:system
```
