# Book Recommendation Fullstack Ruby-based Application

This project is a fullstack book recommendation application built with Rails 8, using Mongoid (MongoDB) as the primary database. This guide explains how to set up and run the app entirely offline on your own device.

---

## Requirements

- **Ruby version**: (see `.ruby-version` or 3.4.5 here)
- **Bundler**: `gem install bundler`
- **MongoDB**: (local server required, e.g. `mongodb://localhost:27017`)
- **Git**: For cloning the repository
- **Node.js**: (Only if you plan to use JS build tools, not needed for Importmap/Propshaft)
- **Recommended**: Chrome (for system tests)

---

## Setup Instructions

1. **Clone the repository**
    ```bash
    git clone https://github.com/Paranjoy-Bordoloi/Book-rec-fullstack-rubybased.git
    cd Book-rec-fullstack-rubybased
    ```

2. **Install Ruby dependencies**
    ```bash
    bundle install
    ```

3. **Set up environment variables (if needed)**
    - By default, Mongoid uses `localhost:27017` for MongoDB. 
    - Customize by copying `.env.example` to `.env` and editing as needed.
    - To use a custom MongoDB URI, set `MONGOID_CLIENT_DEFAULT_URI`:
      ```bash
      export MONGOID_CLIENT_DEFAULT_URI='mongodb://localhost:27017/my_app_development'
      ```

---

## Database Setup (MongoDB)

1. **Start MongoDB**  
   If you don't have a local instance running, use Docker:
    ```bash
    docker run --rm -d -p 27017:27017 --name myapp-mongo mongo:6
    ```
   Or start your installed MongoDB server.

2. **(Optional) Create indexes**  
   If your models define custom indexes:
    ```bash
    bin/rails runner "Mongoid::Tasks::Database.create_indexes"
    ```

---

## Running the Application (Offline)

The app runs fully locally and offline. No cloud services are required after initial setup.

1. **Start the Rails server**
    ```bash
    bin/rails server
    ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

2. **(Optional) Open a Rails console**
    ```bash
    bin/rails console
    ```

---

## Running the Test Suite

1. **Prepare the test database**
    ```bash
    RAILS_ENV=test bin/rails db:test:prepare
    ```
2. **Run all tests**
    ```bash
    RAILS_ENV=test bin/rails test
    ```
   Or, for system tests (requires Chrome):
    ```bash
    RAILS_ENV=test bin/rails test:system
    ```

---

## Static Analysis (Security, Lint, JS Audit)

Run these checks locally (optional, but recommended):

- Brakeman (security):
  ```bash
  bin/brakeman --no-pager
  ```
- RuboCop (Ruby linting):
  ```bash
  bin/rubocop -f github
  ```
- Importmap Audit (JS module security):
  ```bash
  bin/importmap audit
  ```

---

## Additional Notes

- **Frontend**: Uses Importmap and Propshaft for JS and assets. No Webpack/node build needed.
- **API Endpoints**: Namespaced under `/api/v1/` — see `app/controllers/api/v1/`.
- **Docker**: Project includes a `Dockerfile` for production builds.
- **Offline Usage**: All dependencies are installed locally, and all data is stored in your local MongoDB instance. No internet connection required after setup.

---

If you run into issues, consult:
- `config/mongoid.yml` for DB connection details
- `bin/rails --help` for available commands
- The project’s GitHub issues for troubleshooting

---
