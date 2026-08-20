# Book Review Web Application

An Express and SQLite library application for browsing books and authors, reading and writing reviews, and viewing book reports.

## What the app does

- Browse authors and view their books.
- Browse books, book details, and associated reviews.
- Search books by their generated summary.
- Register and log in as a user.
- Create reviews while logged in.
- View the top 10 books by average review score.
- View the top 50 selling books and yearly sales information.
- Manage users from the Users section when logged in as an administrator.

The frontend is served by the same Express server as the API. Open the root URL in a browser to use the application.

## Requirements

- Docker
- Docker Compose (the `docker compose` command)

## Run with Docker

From the project directory, build and start the application:

```bash
docker compose up --build
```


Then open <http://localhost:3000>.

The Compose configuration mounts the project directory into the container and mounts `./data` at `/app/data`. This means the SQLite database remains in the project directory when the container stops. Stop the application with:

```bash
docker compose down
```

To run it in the background:

```bash
docker compose up --build -d
```

View logs or stop the background container with:

```bash
docker compose logs -f api
docker compose down
```

## Database and resetting data

The application uses SQLite at:

```text
data/database.sqlite
```

The file is persisted through the `./data:/app/data` Docker volume. To completely reset the local database:

```bash
docker compose down
rm -f data/database.sqlite
docker compose up --build
```

Deleting the file is useful when you want a clean demo database, need to remove test data, or changed the model and want Sequelize to recreate the local schema. Do not do this if the database contains data you need: deleting the file permanently removes users, authors, books, reviews, and sales stored in it. Back it up first if necessary.

## How seeding works

The seed script creates demo data, including:

- 1 administrator and 20 regular users
- 50 authors
- 300 books
- Random reviews for every book
- Five years of random sales data for every book

Passwords are hashed by the `User` model's creation hook. The default seeded accounts are:

| Account | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `adminpassword123` |
| Regular user | `user_1` | `password123` |

Run the seed manually inside the running container with:

```bash
docker compose exec api npm run seed
```

Important: `npm run seed` does not clear existing tables before inserting records. Running it more than once can create duplicate demo data and additional reviews/sales. For a predictable fresh dataset, stop the containers, delete `data/database.sqlite`, and start the app again.

On normal startup, `index.js` synchronizes the Sequelize schema and automatically runs the seed only when the database contains zero authors. A newly created or deleted database is therefore seeded automatically on the next `docker compose up`.

## Useful commands

```bash
# Follow application logs
docker compose logs -f api

# Open a shell in the API container
docker compose exec api sh

# Rebuild after dependency or Dockerfile changes
docker compose up --build
```