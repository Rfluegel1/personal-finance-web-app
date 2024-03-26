# Express Web App Template

## Description

This project is designed to be a starting point for a TypeScript web application with comprehensive testing, including unit, integration, blackbox, e2e, and performance tests. The backend features user management and todo objects, while the frontend includes login, account updates, and a todo list. Additionally, this template includes GitHub action files for continuous integration and deployment, along with dependency updates.

## Technology Stack

- PostgreSQL
- TypeScript
- Express
- Passport
- TypeORM
- Svelte Kit
- Jest
- Playwright
- GitHub Actions

## Prerequisites

- Node.js
- PostgreSQL
- Fly.io (For deployment)
- k6 (For performance testing)

## Installation and Setup

1. Clone the repository.
1. Install postgres with ```brew install postgresql@14```
1. Start postgres with ```brew services start postgresql@14```
2. Create a database with ```createdb postgres```
2. Install dependencies in both the frontend and backend directories using `npm install`.
3. To build the frontend, run `npm run build` in the frontend directory. This command creates static files necessary for the application.
4. To start the backend application, navigate to the backend directory and run `npm start`. The application will be available on `http://localhost:8090`.

note*:
brew does not create a database folder for postgresql@14
which may lead to errors starting the service with brew
or interacting in general. Consider checking error logs.
These are the steps I had to complete on macOS to make brew play nicely

1. navigate to /opt/homebrew/var (hint: run ```brew info postgresql@14``` to see where config location is)
2. ``mkdir postgresql@14``

## Usage

Visiting `http://localhost:8090/` should redirect users to the login page. Relevant links and pages should all be accessible from the main interface.

## Configuration

Several environment variables need to be set up for the application to function correctly including
1. SMTP_PASSWORD (for sending emails)
2. PASSPORT_SECRET (for encrypting user tokens)
3. ADMIN_EMAIL (for creating the first admin user)
4. ADMIN_PASSWORD (for creating the first admin user)
5. TEST_USER_PASSWORD (for creating the first test user)
6. DB_USERNAME (for connecting to the database)
7. DB_PASSWORD (for connecting to the database)

Set these up in a way that can be read by the application but not committed to the repository


## Testing

- To run backend tests (unit and blackbox), execute `npm run test` in the backend directory.
- To run frontend tests (e2e), execute `npm run test` in the frontend directory.
- To run performance tests, install k6 with homebrew and execute `k6 run tests/backend/todoPerformance.ts` in the backend directory.

#### Manually test backend responses

1. navigate to ```http://localhost:8090/api/docs```
2. log in with valid credentials
3. execute on the endpoint you want to test

## Deployment

To deploy the application, Fly.io must be installed locally via Homebrew. Once installed, flyctl must be used from root directory.

#### Deploy to staging environment (Prefer GitHub action when possible)

##### First time

1. ```brew install flyctl```
2. ```flyctl login```

##### Every time

1. ```npm run build```
2. ```flylctl deploy```

## Additional Commands

The `package.json` files in both the frontend and backend directories include various scripts for additional tasks, such as cleaning the filesystem and creating migrations.

- backend 
  1. To run the backend: ```npm run dev```
  1. To compile and run compiled backend: ```npm run build && npm start```
  1. To run tests: ```npm run test```
  1. To run tests against the staging environment: ```npm run test:staging```
  1. To create a new migration: ```npm run migrations:create --name=<name>```
  1. To roll back a migration: ```npm run migrations:revert```
  1. To remove node modules, package-lock and cache in the filesystem: ```npm run clean```
- frontend
  1. To run the frontend: ```npm run dev```
  1. To compile frontend and place in backend directory: ```npm run build```
  1. To run tests (uses compiled backend): ```npm run test```
  1. To run tests interactively: ```npm run test:debug```
  1. To run tests against the staging environment: ```npm run test:staging```
  1. To remove node modules, package-lock and cache in the filesystem: ```npm run clean```

## License

This project is open source and available for everyone to use.

## Contact Information

Please leave comments on this repository with any questions.

---

# Configure WebStorm

## To match formatter

1. Preferences | Editor | Code Style | TypeScript | Punctuation
2. From the drop-downs, select "Don't use", "always", "single", "always", and "keep"

## To format on save

Record the macro

1. Edit | Macros | Start Macro recording
2. Press Cmd+Option+L, and then Cmd+Option+S (on Windows: Ctrl+Alt+L, and then Ctrl+Alt+S)
3. Stop recording the macro clicking on the Stop button on the bottom right of the page
4. Give this macro a name like "Format and Save"

Assign Ctrl+S to "Format and Save"

1. File | Settings
2. search for "keymap" and open it
3. search "Format and Save" and double-click the action "Format and Save"
4. select "Add Keyboard Shortcut"
5. select "Ctrl+S" as first stroke.
6. it will report conflicts. Ignore it and click OK button
7. WebStorm will show a warning "The shortcut is already assigned to other actions. Do you want to remove other
   assignments?" Click "Remove" button

## To run backend in debug mode

1. Run | Edit Configurations...
2. Create a new Node.js configuration
3. Rename to 'Debug Server'
4. Change the interpreter to ts-node (~/workspaces/personal-finance-web-app/node_modules/.bin/ts-node)
5. Set working directory to ~/workspaces/personal-finance-web-app
6. Set Javascript file to src/backend/server.ts

# GitHub Actions

### Continuous deployment

Every push to main will run the continuous deployment (continuous-deployment.yml) GitHub action. This will run all unit,
blackbox, and
end-to-end tests against a fresh linux virtual machine, deploy the application to staging if there are production code
changes,
and run blackbox and e2e tests against staging

### Update dependencies

Every morning a chron job will execute the update dependencies (update-dependencies.yml) GitHub action. This will first
run the command ```npm update``` and then run all unit, blackbox, and end-to-end tests. Upon passing with changes in
package-lock.json from main, a pull request will automatically be created.

### Staging behavioral test

Every morning a chron job will execute the staging behavioral test (staging-behavioral-test.yml) GitHub action. This
will
run blackbox and e2e tests against the staging environment.

### Staging performance test

Every morning a chron job will execute the staging performance test (staging-performance-test.yml) GitHub action. This
will
run k6 tests against the staging environment.

### Deploy to staging

Only manual triggers will run this job. This will deploy main code to staging.

# Setting up new repository

1. Replace personal-finance-web-app with new repository name
1. ```fly launch```
1. Do create with postgres (name it something other than app name)
1. Setup new secrets ( ADMIN_EMAIL,ADMIN_PASSWORD,DB_PASSWORD,PASSPORT_SECRET,SMTP_PASSWORD,TEST_USER_PASSWORD) | ex. ```fly secrets set DB_PASSWORD="<password>" DB_USERNAME="<username>"```
1. Add secrets to github settings (ADMIN_EMAIL,ADMIN_PASSWORD,FLY_API_TOKEN,PASSPORT_SECRET,TEST_USER_PASSWORD)
1. Update db username and db name for staging if not postgres
1. Update db to have test user and admin user (create users via ui, update role and isverified via staging db)

# Access Staging DB
 1. SSH into staging environment 
```flyctl ssh console -a your-app-name```
 2. Install psql 
```apt-get update && apt-get install postgresql-client```
 3. Connect to db 
```psql -h your-db-host.fly.dev -p your-db-port -U your-db-user -d your-db-name```

ex. ```psql -h personal-finance-web-app-db.internal -p 5432 -U personal_finance_web_app -d personal_finance_web_app```