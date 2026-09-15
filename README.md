# 🏎️ Sentry Crash Racer: Highway Telemetry & Crash Lab

An action-packed highway car racing game where **every collision triggers real-time Sentry errors**, complete with telemetry breadcrumbs (speed, lane, nitro), user context, and crash dumps!

![Sentry Tested](https://img.shields.io/badge/Sentry-Tested-362D59?logo=sentry&logoColor=white)
![JavaScript](https://img.shields.io/badge/Language-Vanilla%20JS%20ES6+-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 🚗 Gameplay Overview

Drive your high-speed sports car down a 4-lane highway. Dodging traffic earns points and logs continuous driving telemetry into Sentry. Slamming into obstacles triggers real JavaScript crashes and dispatches them straight to your **Sentry.io** dashboard.

- **Cruise Speed**: 110 - 150 km/h
- **Gas**: Up to 210 km/h
- **Nitro Boost**: 270 km/h with cyan exhaust flames!
- **Audio**: Built-in engine hum, tire screech, and explosive crash sound effects powered by Web Audio API.

---

## 💥 Crash Anomalies & Sentry Errors

| Obstacle | Sentry Error Triggered | Telemetry & Details Sent |
| :--- | :--- | :--- |
| 🚛 **Freight Truck** | `TypeError` | `Cannot read properties of undefined (reading 'chassisPhysics')`. |
| 🚧 **Concrete Guardrail** | `ReferenceError` | `guardrailCollisionMesh is not defined`. |
| 🌀 **Oil Slick Vortex** | `RangeError` | `Maximum call stack size exceeded in calculateSpinDynamics()`. |
| 🔥 **Nitro Crash (>200 km/h)** | `Fatal Crash Alert` | Extreme G-force disintegration event (`level: fatal`). |

### 🍞 Telemetry Breadcrumbs
Before every crash, Sentry records your vehicle's telemetry trail:
1. `[driving.steer] Player steered to Lane 3 at 145 km/h`
2. `[engine.nitro] Nitro Engaged! Speed boosting towards 260 km/h`
3. `[telemetry] Speedometer: 245 km/h | Dist: 820m | Lane: 3`
4. `[collision] CRASH: Slammed into Freight Truck at 245 km/h!`

---

## 🚀 How to Run

1. Open **[index.html](index.html)** in any web browser.
2. The game is already linked to your Sentry project (`sentry-bug-quest`).
3. Steer with **A / D** or **Arrow Keys**, accelerate with **W**, and hit **Space** for Nitro.
4. Crash your car into any truck or barrier, and open your [sentry.io](https://sentry.io) dashboard to see the crash event live!

---

## 🎮 Controls

- **Steer Left**: `A` or `Left Arrow` (or on-screen button)
- **Steer Right**: `D` or `Right Arrow` (or on-screen button)
- **Gas / Accelerate**: `W` or `Up Arrow`
- **Brake**: `S` or `Down Arrow`
- **Nitro Boost**: `Space` or `Shift`
- **Respawn After Crash**: `Space` or `Enter` (or click Respawn)
