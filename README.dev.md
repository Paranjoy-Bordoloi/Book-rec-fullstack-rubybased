Developer onboarding (Windows-focused)

This file shows quick steps to get the project running on Windows for development and testing.

1) Install Ruby

- This project targets the Ruby version in `.ruby-version` (ruby-3.4.5). Use RubyInstaller for Windows or a version manager.

2) Install dependencies

```powershell
# From project root
bundle install
```

3) Start MongoDB (Docker recommended)

```powershell
# Start a temporary MongoDB container
docker run --rm -d -p 27017:27017 --name myapp-mongo mongo:6
```

4) Set environment variables (PowerShell examples)

```powershell
# Example to override Mongoid client URI for development
$env:MONGOID_CLIENT_DEFAULT_URI = 'mongodb://localhost:27017/my_app_development'
```

5) Run linters and scans (CI uses these exact commands)

```powershell
bin/brakeman --no-pager
bin/rubocop -f github
bin/importmap audit
```

6) Run tests

```powershell
# Ensure MongoDB is available, then run tests (system tests require Chrome)
$env:RAILS_ENV = 'test'; bin\rails db:test:prepare test test:system
```

7) Create Mongoid indexes (if you change indexes in models)

```powershell
bin/rails runner "Mongoid::Tasks::Database.create_indexes"
```

If you prefer WSL, use your normal Linux tooling inside WSL (install Docker Desktop and enable WSL integration).
