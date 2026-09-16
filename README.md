# 🏛️ BuggyBank - FinTech Wealth Management & Rollbar Observability Lab

A modern, high-end FinTech web banking application designed to simulate real-world financial workflows, error states, security compliance warnings, and telemetry tracking in **Rollbar**.

![Rollbar](https://img.shields.io/badge/Rollbar-Active-1F2A44?logo=rollbar&logoColor=white)
![JavaScript](https://img.shields.io/badge/Language-Vanilla%20JS%20ES6+-F7DF1E?logo=javascript&logoColor=black)
![Domain](https://img.shields.io/badge/Domain-FinTech%20%2F%20Banking-10B981)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 💼 Application Features

**BuggyBank** simulates the private wealth portal of high-net-worth client **Alexander Wright** ($157,050.00 Net Worth):
- **Portfolio Overview**: Real-time checking, high-yield savings (4.75% APY), and cold-storage crypto assets.
- **SWIFT Wire Transfers**: Domestic & international wire transfer pipeline with real-time balance deductions.
- **Forex Exchange Engine**: Central Bank real-time currency exchange pairs (USD/EUR, USD/GBP, USD/JPY, USD/BTC).
- **Loan & Mortgage Calculator**: Fixed-rate compound amortization schedule generator.
- **Rollbar Telemetry Terminal**: Real-time on-screen audit log displaying all breadcrumbs, customer context, and Rollbar dispatches.

---

## 🔑 Rollbar Configuration

The application is pre-configured with your Rollbar client access token:

```javascript
var _rollbarConfig = {
  accessToken: "060195a760694ccd9e4f5dda70b1079d",
  captureUncaught: true,
  captureUnhandledRejections: true,
  replay: {
    enabled: true
  },
  autoInstrument: {
    network: true,
    log: true,
    dom: true,
    navigation: true,
    connectivity: true
  },
  payload: {
    environment: "production",
    person: {
      id: "cust_wealth_9942",
      username: "Alexander Wright",
      email: "a.wright@private-wealth.corp"
    },
    custom: {
      subscription_tier: "Platinum Private Wealth",
      account_currency: "USD",
      portfolio_value: "$157,050.00"
    }
  }
};
```

---

## 🧪 Simulated Financial Incidents in Rollbar

| Financial Workflow | Rollbar Item Type | Rollbar API Method & Details |
| :--- | :--- | :--- |
| 💸 **Wire Transfer to Unknown Entity** | `TypeError` | `Rollbar.error("Wire Transfer Crash: Cannot read properties of undefined", error, { recipient, amount })` |
| 📊 **Loan Amortization Stress Test** | `RangeError` | `Rollbar.error("Amortization Engine Crash: Maximum call stack size exceeded", error, { principal, rate })` |
| 🌐 **Sync Forex Gateway Rates** | `Network 500 Outage` | `Rollbar.error("Forex Gateway Failure: Central Bank API returned HTTP 500", error, { endpoint })` |
| 🔐 **Crypto Cold Vault Withdrawal** | `Unhandled Promise Rejection` | FIDO2 biometric token signature mismatch caught by Rollbar's unhandled rejection handler. |
| 🚨 **$75,000 High-Value Transfer** | `AML Compliance Warning` | `Rollbar.warning("AML COMPLIANCE ALERT: Transaction exceeded threshold", { amount, riskScore })` |
| 🚨 **Core Double-Entry Checksum Mismatch** | `Critical System Desync` | `Rollbar.critical("CRITICAL LEDGER ANOMALY: Double-entry checksum mismatch", { severity: "SEV-0" })` |
| 💬 **Verification Message** | `Info Item` | `Rollbar.info("BuggyBank FinTech portal loaded with Rollbar monitoring active")` |

---

## 🕵️ Inspecting Items in the Rollbar Dashboard

Log in to [rollbar.com](https://rollbar.com) and navigate to your project:

1. **Items**: View all errors, warnings, and critical incidents. Click any item to inspect the stack trace, code context, and occurrences count.
2. **People**: Track which users were affected (e.g. `Alexander Wright` / `cust_wealth_9942`).
3. **Telemetry**: View the sequence of DOM clicks, console logs, network requests, and page navigations leading up to the error.
4. **Session Replay (if enabled)**: Watch the session recording of the user's actions before the crash.

---

## 🚀 How to Run

1. Open **[index.html](index.html)** directly in your browser (or serve with any local HTTP server: `python -m http.server 8080`).
2. The Rollbar SDK initializes automatically.
3. Test transfers or click the **⚡ Rollbar Chaos Lab** tab to trigger intentional error events.
4. Watch items populate in real-time in your Rollbar dashboard!

---

## 📁 Repository Structure

```
.
├── index.html        # FinTech wealth management portal with Rollbar snippet
├── style.css         # Modern corporate banking dark-theme styles
├── app.js            # Banking engine, wire transfer pipeline, loan calculator
├── rollbar-bank.js   # Rollbar SDK manager, customer person tracking, error dispatchers
├── .gitignore        # Git ignore rules
└── README.md         # Documentation & Rollbar guide
```
