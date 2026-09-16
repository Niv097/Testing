# 🏛️ BuggyBank - FinTech Wealth Management & Rollbar Observability Lab

A modern, high-end FinTech web banking application designed to simulate real-world financial workflows, error states, security compliance warnings, **PII (Personally Identifiable Information) tracking**, and telemetry in **Rollbar**.

![Rollbar](https://img.shields.io/badge/Rollbar-Active-1F2A44?logo=rollbar&logoColor=white)
![JavaScript](https://img.shields.io/badge/Language-Vanilla%20JS%20ES6+-F7DF1E?logo=javascript&logoColor=black)
![Domain](https://img.shields.io/badge/Domain-FinTech%20%2F%20Banking-10B981)
![Security](https://img.shields.io/badge/PII-Scrubbed%20%26%20Tracked-blue)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 💼 Application Features

**BuggyBank** simulates a private wealth management portal:
- **Customer Login & PII Switcher**: Log in as any user (e.g. `Niv Sapra`) with custom email, phone, and password to test how Rollbar manages PII.
- **Portfolio Overview**: Real-time checking, high-yield savings (4.75% APY), and cold-storage crypto assets.
- **SWIFT Wire Transfers**: Domestic & international wire transfer pipeline with real-time balance deductions.
- **Forex Exchange Engine**: Central Bank real-time currency exchange pairs (USD/EUR, USD/GBP, USD/JPY, USD/BTC).
- **Loan & Mortgage Calculator**: Fixed-rate compound amortization schedule generator.
- **Rollbar Telemetry Terminal**: Real-time on-screen audit log displaying all breadcrumbs, customer context, and Rollbar dispatches.

---

## 👤 PII (Personally Identifiable Information) & Scrubbing

Rollbar separates customer identity into **Person Tracking** (who was affected) and **Sensitive Scrubbing** (passwords/secrets you never want stored):

### 1. Tracked PII
Configured dynamically when you log in or switch users:
```javascript
person: {
  id: 'cust_9942',
  username: 'Niv Sapra',                          // Captured PII
  email: 'niv.sapra@private-wealth.corp'          // Captured PII
},
custom: {
  phone_number: '+1-555-0142',                    // Custom PII
  billing_zip: '90210',                           // Custom PII
  subscription_tier: 'Platinum Private Wealth'
}
```

### 2. Auto-Scrubbed Sensitive Fields
Sensitive fields like passwords, secrets, or tokens are scrubbed automatically before leaving the browser:
```javascript
scrubFields: ['password', 'secret', 'token', 'credit_card']
```
When an authentication crash occurs, Rollbar replaces `password: "SecretPass123!"` with `***` or removes it entirely, while preserving the user's name, email, and phone!

---

## 🧪 Simulated Financial Incidents in Rollbar

| Financial Workflow | Rollbar Item Type | PII & Rollbar API Details |
| :--- | :--- | :--- |
| 🔑 **Login & Authentication Crash** | `AuthenticationCrashError` | Fails session handshake sending customer PII (`Name`, `Email`, `Phone`, `IP`). `password` is scrubbed! |
| 💸 **Wire Transfer to Unknown Entity** | `TypeError` | Accessing undefined `swiftBicCode`. Attaches sender's name and email to the occurrence. |
| 📊 **Loan Amortization Stress Test** | `RangeError` | Infinite recursion causing `Maximum call stack size exceeded` in compound schedule. |
| 🌐 **Sync Forex Gateway Rates** | `Network 500 Outage` | Central Bank Gateway returns `HTTP 500 Internal Server Error`. |
| 🔐 **Crypto Cold Vault Withdrawal** | `Unhandled Promise Rejection` | FIDO2 biometric token signature mismatch caught by Rollbar's unhandled rejection handler. |
| 🚨 **$75,000 High-Value Transfer** | `AML Compliance Warning` | `Rollbar.warning("AML COMPLIANCE ALERT: Transaction exceeded threshold", { amount, customerName })` |
| 🚨 **Core Double-Entry Checksum Mismatch** | `Critical System Desync` | `Rollbar.critical("CRITICAL LEDGER ANOMALY: Double-entry checksum mismatch", { severity: "SEV-0" })` |

---

## 🕵️ Inspecting PII in the Rollbar Dashboard

1. **Items Tab**:
   - Click into the **`AuthenticationCrashError`** or **`TypeError`** item.
   - Look at the right sidebar: you will see the customer's **Name**, **Email**, and **ID** directly linked to the crash!
   - In the **Custom Data** section, inspect the `phone_number` and notice that `password` is scrubbed!
2. **People Tab**:
   - Click **"People"** in the left sidebar:
   - You will see **Niv Sapra** (or whichever name you logged in with) listed as an active customer profile with their full error history!

---

## 🚀 How to Run

1. Open **[index.html](index.html)** directly in your browser (or serve with `python -m http.server 8080`).
2. Click the top-right button **`🔑 Login / PII Test`**:
   - Type any Name, Email, Phone, and Password.
   - Leave the checkbox *"💥 Crash on Login"* checked and click **Sign In**.
3. Watch the error appear immediately in your [rollbar.com](https://rollbar.com) dashboard under **Items** and **People**!
