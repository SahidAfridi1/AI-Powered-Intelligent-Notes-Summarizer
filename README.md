# NoteSnap – AI-Powered Intelligent Notes Summarizer for Students

A lightweight MERN (MongoDB, Express, React, Node.js) app. Students paste notes or upload a
`.txt` / `.md` / `.pdf` file and get:

- **Summary** – a short paragraph
- **Key points** – the most important sentences as bullets
- **Quiz** – revision questions with show/hide answers

It works **without any API key** by using a built-in summarizer. Adding an Anthropic API key
switches it to Claude for better summaries.

---

## 1. Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Node.js | 18.11 or newer (20 LTS recommended) | `node -v` |
| npm | comes with Node.js | `npm -v` |
| Internet access | needed for the first `npm install` | – |

You do **not** need to install MongoDB. By default the server starts an in-memory MongoDB.
The first `npm install` in `server/` downloads a MongoDB binary of about 100 MB, so it can take
a few minutes.

---

## 2. Setup on a new system

### Step 1 – Get the code

Copy the `notes-summarizer` folder to the new machine (USB, zip, or `git clone` if you push it
to a repository). Do **not** copy the `node_modules` folders; they are reinstalled below.

```
notes-summarizer/
├── server/   Express API
├── client/   React app
└── README.md
```

### Step 2 – Install the server

```bash
cd notes-summarizer/server
npm install
```

### Step 3 – Create the server `.env` file

Copy the example file:

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env

# Windows Command Prompt
copy .env.example .env
```

Then open `server/.env` and set `JWT_SECRET` to any long random string (see
[Environment variables](#4-environment-variables-and-api-keys)).

### Step 4 – Install the client

```bash
cd ../client
npm install
```

The client needs no `.env` file.

---

## 3. Starting the app

Open **two terminals**.

**Terminal 1 – API server** (http://localhost:5000)

```bash
cd notes-summarizer/server
npm run dev
```

Wait for:

```
Using in-memory MongoDB (data resets on restart)
API running on http://localhost:5000
```

**Terminal 2 – React app** (http://localhost:5173)

```bash
cd notes-summarizer/client
npm run dev
```

Open **http://localhost:5173** in a browser, sign up, and click **+ New note**.

To stop either server, press `Ctrl + C` in its terminal.

### All commands

| Folder | Command | What it does |
|---|---|---|
| `server` | `npm run dev` | Starts the API and restarts it when files change |
| `server` | `npm start` | Starts the API without auto-restart |
| `client` | `npm run dev` | Starts the React dev server with hot reload |
| `client` | `npm run build` | Builds the production files into `client/dist` |
| `client` | `npm run preview` | Serves the production build locally |

### Quick health check

Open http://localhost:5000/api/health. You should see:

```json
{ "ok": true, "ai": "built-in" }
```

`ai` shows `"claude"` when an Anthropic API key is set.

---

## 4. Environment variables and API keys

All variables go in **`server/.env`**. The client has none: it reaches the API through the Vite
proxy (`/api` → `http://localhost:5000`, set in `client/vite.config.js`).

| Variable | Required? | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | **Yes** | – | Secret used to sign login tokens. Use a long random string. |
| `PORT` | No | `5000` | Port for the API. If you change it, update the proxy target in `client/vite.config.js` too. |
| `MONGO_URI` | No | empty | Leave empty to use the in-memory database. Set it to a MongoDB connection string to keep data permanently. |
| `ANTHROPIC_API_KEY` | No | empty | Leave empty to use the built-in summarizer. Set it to use Claude (`claude-haiku-5-5`). |

### Example `server/.env`

```env
PORT=5000
JWT_SECRET=4f9c2b7e1a8d6f3c0e5b9a2d7c4f1e8b
MONGO_URI=
ANTHROPIC_API_KEY=
```

### Generate a JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output as the value of `JWT_SECRET`.

### Optional: keep data permanently (MongoDB)

With `MONGO_URI` empty, **all users and notes are lost when the server restarts.** To keep them,
use one of these:

- **MongoDB Atlas (free, cloud):** create a free cluster at https://www.mongodb.com/atlas,
  add a database user, allow your IP under *Network Access*, and copy the connection string:
  ```env
  MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/notesnap
  ```
- **Local MongoDB:** install MongoDB Community Server, then:
  ```env
  MONGO_URI=mongodb://127.0.0.1:27017/notesnap
  ```

### Optional: use Claude for summaries (Anthropic API key)

1. Create an account at https://console.anthropic.com and add billing credit.
2. Go to **API Keys** and create a key (starts with `sk-ant-`).
3. Add it to `server/.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
   ```
4. Restart the server. http://localhost:5000/api/health now shows `"ai": "claude"`.

If a Claude request fails (wrong key, no credit, network error), the server logs a warning and
uses the built-in summarizer instead, so the app keeps working.

> Never commit `server/.env` or share your API key. `.env` is already in `.gitignore`.

---

## 5. Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` in `server` is slow or fails on the MongoDB download | Check your internet connection or proxy and run `npm install` again. Or set `MONGO_URI` to Atlas/local MongoDB, which skips the in-memory database at runtime. |
| `Error: listen EADDRINUSE :::5000` | Something else is using port 5000. Stop it, or set `PORT=5001` in `.env` and update `client/vite.config.js`. |
| Browser shows "Something went wrong" on login | The API is not running. Start Terminal 1 first. |
| Logged out after restarting the server | Expected with the in-memory database: your account was deleted. Sign up again or set `MONGO_URI`. |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` is missing from `server/.env`. |
| `node --watch` not recognised | Node.js is older than 18.11. Upgrade Node, or use `npm start`. |
| PDF upload gives little or no text | Scanned/image PDFs contain no text layer; only text-based PDFs are supported. |

---

## 6. Project structure

```
notes-summarizer/
├── server/
│   ├── server.js                 App entry: Express setup, MongoDB connection
│   ├── .env.example              Template for environment variables
│   ├── models/
│   │   ├── User.js               name, email, hashed password
│   │   └── Note.js               title, content, summaries { short, bullets, quiz }
│   ├── routes/
│   │   ├── auth.js               register / login
│   │   └── notes.js              CRUD, search, file upload, summarize
│   ├── middleware/auth.js        JWT verification
│   └── services/summarizer.js    Claude + built-in summarizer
└── client/
    ├── vite.config.js            Dev server + /api proxy
    └── src/
        ├── App.jsx               Routes and login state
        ├── api.js                Axios instance (adds token, handles 401)
        ├── styles.css
        ├── components/           Navbar, AuthForm
        └── pages/                Login, Register, Dashboard, NewNote, NoteView
```

## 7. API reference

All `/api/notes` routes need the header `Authorization: Bearer <token>`.

| Method | Route | Body | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | Create account, returns `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | Log in, returns `{ token, user }` |
| GET | `/api/notes?q=text` | – | List notes (optional search) |
| POST | `/api/notes` | multipart: `title`, `content` **or** `file`, `mode` | Create a note and generate the first summary |
| GET | `/api/notes/:id` | – | Get one note |
| POST | `/api/notes/:id/summarize` | `{ mode: "short" \| "bullets" \| "quiz" }` | Generate or regenerate a summary |
| DELETE | `/api/notes/:id` | – | Delete a note |
| GET | `/api/health` | – | Server status and active AI mode |

Limits: uploads up to 5 MB; notes need at least 50 characters.

## 8. Tech stack

- **Frontend:** React 18, React Router 6, Axios, Vite 5, plain CSS
- **Backend:** Node.js, Express 4, Mongoose 8, JWT, bcryptjs, Multer, pdf-parse
- **Database:** MongoDB (in-memory via `mongodb-memory-server`, or Atlas/local)
- **AI:** Anthropic Claude API (optional) with a built-in summarizer as the fallback
