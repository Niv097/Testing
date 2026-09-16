/**
 * Rollbar FinTech Observability Manager - BuggyBank
 * Pre-configured with Rollbar SDK, customer person tracking, PII login handling, telemetry, and financial error simulations.
 */

const ROLLBAR_ACCESS_TOKEN = '060195a760694ccd9e4f5dda70b1079d';

class RollbarBankManager {
  constructor() {
    this.token = ROLLBAR_ACCESS_TOKEN;
    this.environment = 'production';
    this.logListeners = [];
    this.isInitialized = false;

    // Current logged in customer PII profile (defaults to Niv Sapra)
    this.currentPerson = {
      id: 'cust_wealth_9942',
      username: 'Niv Sapra',
      email: 'niv.sapra@private-wealth.corp'
    };
    this.currentCustom = {
      subscription_tier: 'Platinum Private Wealth',
      account_currency: 'USD',
      phone_number: '+1-555-0142',
      billing_zip: '10021',
      total_networth: '$157,050.00',
      checking_account: '**** 8841',
      risk_score: 'Low (0.04)',
      regulatory_jurisdiction: 'US-FINCEN'
    };
  }

  onLog(callback) {
    this.logListeners.push(callback);
  }

  logToUI(type, title, details = '') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, type, title, details };
    this.logListeners.forEach(cb => cb(entry));
  }

  init() {
    this.logToUI('info', 'Initializing Rollbar Observability SDK...', `Token: ${this.token.substring(0, 8)}... | Env: ${this.environment}`);

    if (typeof Rollbar !== 'undefined') {
      try {
        Rollbar.configure({
          payload: {
            environment: this.environment,
            person: this.currentPerson,
            custom: this.currentCustom
          }
        });

        Rollbar.info('BuggyBank FinTech portal loaded with Rollbar monitoring active', {
          sessionStarted: new Date().toISOString(),
          customerTier: this.currentCustom.subscription_tier,
          customerName: this.currentPerson.username
        });

        this.isInitialized = true;
        this.logToUI('success', 'Rollbar Connected & Monitoring Active', `User Person: ${this.currentPerson.username} (${this.currentPerson.email})`);
      } catch (err) {
        console.warn('Rollbar configuration notice:', err);
      }
    }

    // Direct verification check
    this.sendDirectToRollbar('info', 'BuggyBank FinTech portal initial check', {
      custom: { startup: 'verified', client: 'BuggyBank Web', personName: this.currentPerson.username }
    });

    this.isInitialized = true;
    return true;
  }

  // Update Person (PII) Dynamically after Login
  setPerson(personData, customData = {}) {
    this.currentPerson = {
      id: personData.id || ('usr_' + Math.floor(Math.random() * 9000 + 1000)),
      username: personData.username || 'Niv Sapra',
      email: personData.email || 'niv@buggybank.com'
    };

    this.currentCustom = {
      ...this.currentCustom,
      ...customData,
      last_login: new Date().toISOString()
    };

    if (typeof Rollbar !== 'undefined') {
      try {
        Rollbar.configure({
          payload: {
            person: this.currentPerson,
            custom: this.currentCustom
          }
        });
      } catch (e) {}
    }

    this.logToUI('success', `Rollbar Person (PII) Updated`, `Logged in as ${this.currentPerson.username} (${this.currentPerson.email})`);
  }

  async sendDirectToRollbar(level, message, traceOrExtra = {}) {
    try {
      const payload = {
        access_token: this.token,
        data: {
          environment: this.environment,
          level: level || 'error',
          platform: 'browser',
          language: 'javascript',
          framework: 'browser-js',
          body: traceOrExtra.trace ? { trace: traceOrExtra.trace } : { message: { body: message } },
          client: {
            javascript: {
              browser: navigator.userAgent || 'Chrome/120.0',
              code_version: '1.0.0'
            }
          },
          person: this.currentPerson,
          custom: {
            ...this.currentCustom,
            ...(traceOrExtra.custom || {})
          }
        }
      };

      await fetch('https://api.rollbar.com/api/1/item/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Rollbar-Access-Token': this.token
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
    } catch (e) {
      console.warn('Direct Rollbar fetch note:', e);
    }
  }

  addTelemetry(category, message, metadata = {}) {
    if (typeof Rollbar !== 'undefined' && Rollbar.captureEvent) {
      try {
        Rollbar.captureEvent({
          type: 'navigation',
          category: category,
          message: message,
          metadata: metadata
        }, 'info');
      } catch (e) {}
    }
    this.logToUI('telemetry', `[Telemetry: ${category}] ${message}`, Object.keys(metadata).length ? JSON.stringify(metadata) : '');
  }

  // --- LOGIN WITH PII & AUTH ERROR DISPATCHER ---

  reportLoginAuthError(credentials) {
    // 1. Update Rollbar's person context with the entered PII
    this.setPerson({
      id: credentials.id || ('usr_' + Math.floor(Math.random() * 9000 + 1000)),
      username: credentials.username || 'Test User',
      email: credentials.email || 'test@example.com'
    }, {
      phone_number: credentials.phone || '+1-555-0188',
      billing_zip: credentials.zip || '90210',
      customer_tier: 'Private Wealth Platinum'
    });

    this.addTelemetry('auth.login', `Customer attempted login: ${credentials.email} (Name: ${credentials.username})`);
    this.logToUI('error', `💥 AUTHENTICATION CRASH [PII Error]`, `Customer: ${credentials.username} | Email: ${credentials.email} | Phone: ${credentials.phone}`);

    const error = new Error(`AuthenticationCrashError: Security handshake failed for customer "${credentials.username}" (${credentials.email})`);
    error.name = "AuthenticationCrashError";

    // 2. Dispatch to Rollbar with PII in extra custom payload
    if (typeof Rollbar !== 'undefined' && Rollbar.error) {
      Rollbar.error(`Login Authentication Crash: ${error.message}`, error, {
        submitted_pii: {
          username: credentials.username,
          email: credentials.email,
          phone: credentials.phone || '+1-555-0188',
          password: credentials.password || 'SecretPass123!', // Rollbar will scrub password automatically
          login_ip: '198.51.100.44',
          attempt_time: new Date().toISOString()
        }
      });
    }

    // 3. Guaranteed direct HTTP dispatch
    this.sendDirectToRollbar('error', `Login Authentication Crash: ${error.message}`, {
      trace: {
        frames: [
          { filename: 'app.js', lineno: 85, colno: 14, method: 'handleUserLogin' },
          { filename: 'rollbar-bank.js', lineno: 160, colno: 18, method: 'reportLoginAuthError' }
        ],
        exception: {
          class: 'AuthenticationCrashError',
          message: error.message,
          description: `Login authentication crashed with customer PII for ${credentials.username}`
        }
      },
      custom: {
        submitted_username: credentials.username,
        submitted_email: credentials.email,
        submitted_phone: credentials.phone || '+1-555-0188',
        password: credentials.password || 'SecretPass123!'
      }
    });

    this.logToUI('rollbar-sent', 'Dispatched Login PII Error to Rollbar [Level: ERROR]', `Check Rollbar People & Items tabs!`);

    // Throw native uncaught exception
    setTimeout(() => {
      throw error;
    }, 0);
  }

  // --- REAL-WORLD ROLLBAR FINANCIAL INCIDENT DISPATCHERS ---

  // 1. Wire Transfer Failure: TypeError (Cannot read properties of undefined)
  reportTransferTypeError(recipientName, amount) {
    this.addTelemetry('banking.transfer', `Customer ${this.currentPerson.username} initiated SWIFT wire of $${amount.toLocaleString()} to "${recipientName}"`);
    this.logToUI('error', '💥 FATAL: Wire Transfer Pipeline Crash [TypeError]', 'Missing SWIFT routing profile for recipient entity.');

    const error = new TypeError("Cannot read properties of undefined (reading 'swiftBicCode')");
    error.name = "TypeError";

    if (typeof Rollbar !== 'undefined' && Rollbar.error) {
      Rollbar.error(`Wire Transfer Pipeline Crash: ${error.message}`, error, {
        sender: this.currentPerson.username,
        senderEmail: this.currentPerson.email,
        recipient: recipientName,
        amount: amount,
        currency: 'USD',
        channel: 'WEB_SWIFT_PORTAL',
        failureStage: 'ROUTING_VALIDATION'
      });
    }

    this.sendDirectToRollbar('error', `Wire Transfer Pipeline Crash: ${error.message}`, {
      trace: {
        frames: [
          { filename: 'app.js', lineno: 248, colno: 12, method: 'handleWireTransfer' },
          { filename: 'rollbar-bank.js', lineno: 205, colno: 18, method: 'reportTransferTypeError' }
        ],
        exception: {
          class: 'TypeError',
          message: error.message,
          description: `Wire Transfer Crash: Failed to process $${amount} to ${recipientName}`
        }
      },
      custom: { sender: this.currentPerson.username, recipient: recipientName, amount: `$${amount}`, channel: 'WEB_SWIFT_PORTAL' }
    });

    this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: ERROR]', `Item: Wire Transfer TypeError ($${amount}) for ${this.currentPerson.username}`);

    setTimeout(() => {
      throw error;
    }, 0);
  }

  // 2. Loan Amortization Overflow: RangeError (Maximum call stack size exceeded)
  reportAmortizationRangeError(principal, rate, years) {
    this.addTelemetry('banking.loan', `Running recursive compound interest stress test on $${principal.toLocaleString()} for ${this.currentPerson.username}`);
    this.logToUI('error', '💥 FATAL: Loan Amortization Crash [RangeError]', 'Infinite recursion in calculateCompoundSchedule()');

    const error = new RangeError("Maximum call stack size exceeded in calculateCompoundSchedule()");

    if (typeof Rollbar !== 'undefined' && Rollbar.error) {
      Rollbar.error(`Amortization Engine Crash: ${error.message}`, error, {
        applicant: this.currentPerson.username,
        principal: principal,
        interestRate: rate,
        termYears: years,
        failureReason: 'STACK_OVERFLOW_EXPANSION'
      });
    }

    this.sendDirectToRollbar('error', `Amortization Engine Crash: ${error.message}`, {
      trace: {
        frames: [
          { filename: 'app.js', lineno: 340, colno: 14, method: 'calculateCompoundSchedule' },
          { filename: 'app.js', lineno: 340, colno: 14, method: 'calculateCompoundSchedule' }
        ],
        exception: {
          class: 'RangeError',
          message: error.message,
          description: `Stack overflow on $${principal.toLocaleString()} loan amortization`
        }
      },
      custom: { applicant: this.currentPerson.username, principal, rate, years }
    });

    this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: ERROR]', `Item: RangeError Stack Overflow`);

    setTimeout(() => {
      function calculateCompoundSchedule(depth = 0) {
        return calculateCompoundSchedule(depth + 1);
      }
      try {
        calculateCompoundSchedule(1);
      } catch (err) {
        if (typeof Rollbar !== 'undefined') Rollbar.error(err);
      }
    }, 0);
  }

  // 3. Central Bank Forex Rate Sync: Network HTTP 500 Outage
  async reportForexSyncError(pair = 'USD/EUR') {
    this.addTelemetry('banking.forex', `Attempting real-time exchange rate sync for ${pair} from Federal Forex Gateway`);
    this.logToUI('trigger', `Syncing Forex Rates for ${pair}...`, 'Connecting to https://api.federal-forex-gateway.internal/v2/rates');

    try {
      const resp = await fetch('https://httpstat.us/500?sleep=350');
      if (!resp.ok) {
        throw new Error(`Central Forex Gateway responded with HTTP ${resp.status} (Internal Server Error)`);
      }
    } catch (err) {
      this.logToUI('error', 'Forex Gateway Outage Captured', err.message);

      if (typeof Rollbar !== 'undefined' && Rollbar.error) {
        Rollbar.error(`Forex Gateway Failure: Central Bank API returned HTTP 500 for ${pair}`, err, {
          user: this.currentPerson.username,
          endpoint: '/v2/rates/live',
          currencyPair: pair,
          httpStatus: 500,
          service: 'FEDERAL_FOREX_GATEWAY'
        });
      }

      this.sendDirectToRollbar('error', `Forex Gateway Failure: HTTP 500 on ${pair}`, {
        custom: { user: this.currentPerson.username, endpoint: '/v2/rates/live', currencyPair: pair, httpStatus: 500 }
      });

      this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: ERROR]', `Item: Network HTTP 500 for ${pair}`);
    }
  }

  // 4. Crypto Biometric Signature: Unhandled Promise Rejection
  reportCryptoRejection() {
    this.addTelemetry('banking.crypto', `Customer ${this.currentPerson.username} initiated FIDO2 hardware biometric key derivation for Ethereum cold vault withdrawal`);
    this.logToUI('error', 'Unhandled Promise Rejection: Hardware Biometric Token Mismatch', 'FIDO2 Hardware Attestation signature failed validation.');

    if (typeof Rollbar !== 'undefined' && Rollbar.error) {
      Rollbar.error('Unhandled Promise Rejection: FIDO2HardwareAttestationError (Cold Vault Withdrawal)', {
        customer: this.currentPerson.username,
        customerEmail: this.currentPerson.email,
        token: 'FIDO2_LEDGER_NANO',
        vault: 'ETH_COLD_STORAGE',
        errorCode: '0x8A7C99F1'
      });
    }

    this.sendDirectToRollbar('error', 'Unhandled Promise Rejection: FIDO2HardwareAttestationError (Cold Vault Withdrawal)', {
      custom: { customer: this.currentPerson.username, token: 'FIDO2_LEDGER_NANO', vault: 'ETH_COLD_STORAGE', errorCode: '0x8A7C99F1' }
    });

    this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: ERROR]', 'Item: FIDO2HardwareAttestationError');

    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('FIDO2HardwareAttestationError: Biometric token signature mismatch [0x8A7C99F1]'));
      }, 100);
    });
  }

  // 5. AML Compliance Warning Alert (Rollbar.warning)
  reportAmlAlert(amount, reason) {
    this.addTelemetry('compliance.aml', `Transaction of $${amount.toLocaleString()} for customer ${this.currentPerson.username} flagged by FinCEN automated compliance heuristics`);
    this.logToUI('warning', `⚠️ AML Compliance Alert: $${amount.toLocaleString()} Flagged!`, reason);

    const alertMsg = `AML COMPLIANCE ALERT: Transaction of $${amount.toLocaleString()} for customer ${this.currentPerson.username} exceeded suspicious pattern threshold.`;

    if (typeof Rollbar !== 'undefined' && Rollbar.warning) {
      Rollbar.warning(alertMsg, {
        customerName: this.currentPerson.username,
        customerEmail: this.currentPerson.email,
        amount: amount,
        reason: reason,
        riskScore: '0.89 (High Risk)',
        regulatoryJurisdiction: 'US-FINCEN / OFAC',
        complianceQueue: 'ESCALATED_IMMEDIATE_AUDIT'
      });
    }

    this.sendDirectToRollbar('warning', alertMsg, {
      custom: { customer: this.currentPerson.username, amount, reason, riskScore: '0.89', queue: 'ESCALATED' }
    });

    this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: WARNING]', `Item: AML Alert ($${amount.toLocaleString()}) for ${this.currentPerson.username}`);
  }

  // 6. Core Database Desync (Rollbar.critical)
  reportCoreFatalSync(details) {
    this.addTelemetry('system.core', `CRITICAL: Core double-entry ledger checksum mismatch detected in customer vault for ${this.currentPerson.username}!`);
    this.logToUI('error', '🚨 CRITICAL: Core Banking Ledger Desync (SEV-0)!', details);

    const criticalMsg = `CRITICAL LEDGER ANOMALY: Double-entry checksum mismatch on customer vault [${this.currentPerson.id}]!`;

    if (typeof Rollbar !== 'undefined' && Rollbar.critical) {
      Rollbar.critical(criticalMsg, {
        customerName: this.currentPerson.username,
        customerId: this.currentPerson.id,
        details: details,
        severity: 'SEV-0',
        automatedCircuitBreaker: 'TRIPPED',
        vaultId: this.currentPerson.id
      });
    }

    this.sendDirectToRollbar('critical', criticalMsg, {
      custom: { customer: this.currentPerson.username, details, severity: 'SEV-0', vaultId: this.currentPerson.id }
    });

    this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: CRITICAL]', 'Item: Core Ledger Desync SEV-0');
  }
}

window.rollbarBank = new RollbarBankManager();
