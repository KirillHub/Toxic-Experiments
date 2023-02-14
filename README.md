## Setting up development environment 🛠

- Install [postgreSQL](https://www.postgresql.org/) if you don't have it already and create a database named `ws-18plus-game`.
- `git clone https://github.com/KirillHub/toxic-experiments.git`
- Create an empty `.env` file in `/api`, copy `/api/.env.example` contents into it, and fill in your database username and password.
- `npm run install-dependencies`
- `cd api && npm run typeorm migration:run && : npm run start:dev`
- `cd client && npm run dev` in another terminal tab
- App should now be running
