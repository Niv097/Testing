# ⚔️ Sentry Bug Quest: The Glitched Dungeon

An interactive retro-cyberpunk arcade RPG & error simulation lab designed to explore, understand, and master **Sentry** observability and error tracking in JavaScript.

![Sentry Testing](https://img.shields.io/badge/Sentry-Tested-362D59?logo=sentry&logoColor=white)
![JavaScript](https://img.shields.io/badge/Language-JavaScript%20ES6+-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 📖 Overview

When learning Sentry, you usually want to see real errors, breadcrumbs, tags, stack traces, and performance transactions without breaking production code.

**Sentry Bug Quest** gives you:
1. **A Playable Dungeon RPG**: Move your hero (🧙‍♂️) through the dungeon. Every step, potion drunk, and chest opened logs realistic **Sentry Breadcrumbs** and **User Context**.
2. **Intentional In-Game Anomalies**: Interact with cursed chests, altars, shields, and monsters to trigger specific, real-world JavaScript exceptions.
3. **The Sentry Chaos Control Panel**: Direct 1-click trigger buttons to fire errors, test performance lag spikes, dispatch custom severity levels (`info`, `warning`, `fatal`), and open Sentry's **User Feedback Dialog** (`showReportDialog`).
4. **Live In-Game Event Terminal**: See the exact events, error messages, and Sentry event IDs dispatched in real time.

---

## 🚀 Quick Start

### Option 1: Open Directly in Browser
Simply double-click `index.html` or right-click and open in Chrome, Firefox, Edge, or Safari.

### Option 2: Run with a Local Web Server
If you prefer running via a local server:

**Using Python:**
```bash
python -m http.server 8080
```
Then open: [http://localhost:8080](http://localhost:8080)

**Using Node (`npx serve`):**
```bash
npx serve .
```

---

## 🔑 How to Connect Your Sentry Account

1. Go to [sentry.io](https://sentry.io) and log in (or create a free developer account).
2. Create a new project:
   - Platform: **Browser JavaScript**
   - Project Name: `sentry-bug-quest` (or any name you choose)
3. Copy your project's **DSN** (looks like `https://abc123xyz@o123456.ingest.us.sentry.io/7890123`).
4. Paste your DSN into the input bar at the top of the game and click **⚡ Connect Sentry**.
5. Your DSN is automatically saved in `localStorage`, so you don't have to re-enter it on page refreshes!

---

## 🧪 What Errors Can You Test?

| Anomaly / Anomaly Object | Error Type | Sentry Concept Tested |
| :--- | :--- | :--- |
| 📦 **Cursed Chest of Null** | `TypeError` | Uncaught exception: reading properties of `null`/`undefined`. Shows full stack trace. |
| 🔮 **Forbidden Void Altar** | `ReferenceError` | Invoking an undeclared function (`invokeNonExistentDragon()`). |
| 🛡️ **Looping Mirror Shield** | `RangeError` | Infinite recursion leading to `Maximum call stack size exceeded`. |
| 💾 **Corrupt Save Crystal** | `PromiseRejection` | Unhandled asynchronous Promise rejection (`onunhandledrejection`). |
| 🧌 **Dark Web 404 Goblin** | `Network / Fetch Error` | Failed HTTP API request (`404 Not Found`). Tests network error tracking. |
| 👑 **Chrono Freeze Overlord** | `Slow Transaction` | 1.2s synchronous thread block testing Sentry Performance & slow frame spikes. |
| 🧪 **Healing Flask / Gold** | *Normal Action* | Generates breadcrumbs (`inventory.consume`, `inventory.gold`) leading up to errors. |
| 📢 **Custom Message Buttons** | `captureMessage` | Tests severity levels: `info`, `warning`, `fatal`. |
| 💬 **Crash Feedback Modal** | `showReportDialog` | Opens Sentry's native User Feedback modal to collect user comments. |

---

## 🕵️ How to Analyze Errors in the Sentry Dashboard

Once an error is triggered, go to your Sentry dashboard and explore:

### 1. **Issues Tab**
- Click into the issue (e.g. `TypeError: Cannot read properties of null`).
- Observe the **Stack Trace** showing the exact file (`sentry-manager.js`) and line number.
- Check the **Tags**: `character.class`, `dungeon.level`, `game.version`, `browser`, `os`.

### 2. **Breadcrumbs**
- Scroll down to the **Breadcrumbs** section of the issue.
- Notice how Sentry logged your hero's steps, room navigation, items used, and chests opened right before the crash occurred.

### 3. **User Context**
- View the **User** section:
  - User ID: `hero_player_xxx`
  - Username: `GlitchKnight`
  - Email: `hero@bugquest.game`

### 4. **Session Replay (If Enabled)**
- Watch a video-like reconstruction of your clicks, movements, and the exact moment the error occurred.

---

## 🎮 Game Controls

- **Movement**: Arrow Keys or **W, A, S, D** (or on-screen D-pad)
- **Interact / Attack**: **Space**, **E**, or **Enter** (or the **ACTION** button)
- **Clear Logs**: Click `Clear Terminal` in the bottom bar to reset the on-screen console.

---

## 📁 Repository Structure

```
.
├── index.html          # Main application page & Chaos Control Lab
├── style.css           # Retro cyberpunk styling, HUD, and responsive layout
├── game.js             # Canvas RPG game engine, audio synthesis, entities
├── sentry-manager.js   # Sentry SDK wrapper, DSN persistence, error triggers
├── .gitignore          # Git ignore rules
└── README.md           # Documentation & Sentry guide
```

---

## 🛠️ Built With

- **HTML5 Canvas & Web Audio API** (Zero external game asset dependencies)
- **@sentry/browser** (Official Sentry JavaScript SDK with Tracing & Replay)
- **Vanilla Modern JavaScript (ES6+)**
