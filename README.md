# IMovies - Movie Ticket Booking (MERN)

A full stack movie ticket booking app built with MongoDB, Express, React and Node.js.

## Features
- Register / login with JWT authentication (passwords hashed with bcrypt)
- Home page with a rotating featured banner, scrolling movie rows, genre tiles, and language/genre filters with search
- 18 demo movies, each with an original generated poster
- See showtimes grouped by day and theatre
- Interactive seat selection (booked seats are blocked, max 8 per booking)
- Booking is atomic, so two users can't get the same seat
- Seat holds: a seat you click is held for 3 minutes, and other users see it as "being chosen"
- The seat map auto-refreshes every 4 seconds, so other users' bookings and holds appear without reloading
- My Bookings page with cancel (frees the seats again)
- Watchlist (favorites) and movie reviews/ratings
- Simulated payment step (card / UPI / net banking / wallet) with a transaction id; cancelling marks it refunded
- Admin panel: add movies, add shows, delete movies, revenue stats, user list, all bookings
- Security: JWT, bcrypt, role-based access, request sanitizing (NoSQL injection) and rate limiting

## Project structure
```
imovies/
├── server/                 Express + MongoDB API
│   ├── models/             User, Movie, Show, Booking (Mongoose schemas)
│   ├── routes/             auth, movies, shows, bookings
│   ├── middleware/auth.js  JWT check + admin check
│   ├── seed.js             adds demo data
│   └── server.js           app entry point
└── client/                 React (Vite) frontend
    └── src/
        ├── pages/          Home, MovieDetails, SeatSelection, Login, Register, MyBookings, Admin
        ├── components/     Navbar, MovieCard, ProtectedRoute
        ├── context/        AuthContext (login state)
        └── api.js          axios instance that adds the JWT
```

## How to run

You need Node.js (LTS) and a MongoDB database. The easiest is a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster: create it, add a database user,
allow your IP under Network Access, and copy the connection string.

### 1. Backend
```bash
cd server
npm install
cp .env.example .env        # on Windows: copy .env.example .env
```
Open `.env` and set `MONGO_URI` (your Atlas string, or `mongodb://127.0.0.1:27017/imovies`
if MongoDB is installed locally) and a long random `JWT_SECRET`.

```bash
npm run seed                # adds demo movies, shows and two users
npm run dev                 # starts the API on http://localhost:5000
```

### 2. Frontend (in a second terminal)
```bash
cd client
npm install
npm run dev                 # opens on http://localhost:5173
```

### Demo logins (created by the seed script)
| Role  | Email             | Password |
|-------|-------------------|----------|
| Admin | admin@imovies.com | admin123 |
| User  | user@imovies.com  | user123  |

## Adding more movies with posters
1. Add an entry in `server/data/movies.js` (pick a `motif` and colours in `art`).
2. In `server`, run `node scripts/generate-posters.js` to create its poster.
3. Run `npm run seed` (this resets the database, including bookings).

Or use the Admin page and paste any poster image URL.

## API reference
| Method | Endpoint                  | Access | Purpose                          |
|--------|---------------------------|--------|----------------------------------|
| POST   | /api/auth/register        | public | create account                   |
| POST   | /api/auth/login           | public | login, returns token             |
| GET    | /api/auth/me              | user   | current user                     |
| GET    | /api/movies?search=       | public | list / search movies             |
| GET    | /api/movies/:id           | public | movie + upcoming shows           |
| POST   | /api/movies               | admin  | add movie                        |
| PUT    | /api/movies/:id           | admin  | edit movie                       |
| DELETE | /api/movies/:id           | admin  | delete movie and its shows       |
| GET    | /api/shows/:id            | public | show with booked and held seats  |
| POST   | /api/shows/:id/hold       | user   | hold seats `{seats[]}` (3 min)   |
| POST   | /api/shows                | admin  | add show                         |
| DELETE | /api/shows/:id            | admin  | delete show                      |
| POST   | /api/bookings             | user   | book seats `{showId, seats[]}`   |
| GET    | /api/bookings/my          | user   | my bookings                      |
| PUT    | /api/bookings/:id/cancel  | user   | cancel booking                   |

## Common problems
- **"MongoDB connection failed"**: check `MONGO_URI`, your Atlas password (special characters must be URL-encoded) and that your IP is allowed in Atlas Network Access.
- **Movies don't load in the browser**: make sure the backend is running on port 5000 before opening the frontend.
- **No shows listed**: the seed creates shows for the next 5 days, so run `npm run seed` again if the data is old.

## Ideas to extend it (for extra marks)
- Payment simulation page before confirming
- Edit movie / edit show in the admin panel
- Booking history with a printable ticket
- Deploy: API on Render, frontend on Vercel (set `VITE_API_URL` to your API URL + `/api`)
