/**
 * Rollbar FinTech Observability Manager - BuggyBank
 * Pre-configured with Rollbar SDK, customer person tracking, telemetry, and financial error simulations.
 */

const ROLLBAR_ACCESS_TOKEN = '060195a760694ccd9e4f5dda70b1079d';

class RollbarBankManager {
  constructor() {
    this.token = ROLLBAR_ACCESS_TOKEN;
    this.environment = 'production';
    this.logListeners = [];
    this.isInitialized = false;
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
        // Configure Customer Person & Portfolio Context
        Rollbar.configure({
          payload: {
            environment: this.environment,
            person: {
              id: 'cust_wealth_9942',
              username: 'Alexander Wright',
              email: 'a.wright@private-wealth.corp'
            },
            custom: {
              subscription_tier: 'Platinum Private Wealth',
              account_currency: 'USD',
              total_networth: '$157,050.00',
              checking_account: '**** 8841',
              risk_score: 'Low (0.04)',
              regulatory_jurisdiction: 'US-FINCEN'
            }
          }
        });

        // Send initial connection verification item to Rollbar
        Rollbar.info('BuggyBank FinTech portal loaded with Rollbar monitoring active', {
          sessionStarted: new Date().toISOString(),
          customerTier: 'Platinum'
        });

        this.isInitialized = true;
        this.logToUI('success', 'Rollbar Connected & Monitoring Active', 'All uncaught errors, unhandled rejections, and financial telemetry will stream to Rollbar.');
        return true;
      } catch (err) {
        console.warn('Rollbar configuration notice:', err);
      }
    }

    this.isInitialized = true;
    this.logToUI('success', 'Rollbar Loaded', 'Rollbar snippet active.');
    return true;
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

  // --- REAL-WORLD ROLLBAR FINANCIAL INCIDENT DISPATCHERS ---

  // 1. Wire Transfer Failure: TypeError (Cannot read properties of undefined)
  reportTransferTypeError(recipientName, amount) {
    this.addTelemetry('banking.transfer', `Customer initiated SWIFT wire of $${amount.toLocaleString()} to "${recipientName}"`);
    this.logToUI('error', '💥 FATAL: Wire Transfer Pipeline Crash [TypeError]', 'Missing SWIFT routing profile for recipient entity.');

    const error = new TypeError("Cannot read properties of undefined (reading 'swiftBicCode')");
    error.name = "TypeError";

    if (typeof Rollbar !== 'undefined' && Rollbar.error) {
      Rollbar.error(`Wire Transfer Pipeline Crash: ${error.message}`, error, {
        recipient: recipientName,
        amount: amount,
        currency: 'USD',
        channel: 'WEB_SWIFT_PORTAL',
        failureStage: 'ROUTING_VALIDATION'
      });
      this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: ERROR]', `Item: Wire Transfer TypeError ($${amount})`);
    }

    // Trigger uncaught so Rollbar's window.onerror catches it natively
    setTimeout(() => {
      throw error;
    }, 0);
  }

  // 2. Loan Amortization Overflow: RangeError (Maximum call stack size exceeded)
  reportAmortizationRangeError(principal, rate, years) {
    this.addTelemetry('banking.loan', `Running recursive compound interest stress test on $${principal.toLocaleString()}`);
    this.logToUI('error', '💥 FATAL: Loan Amortization Crash [RangeError]', 'Infinite recursion in calculateCompoundSchedule()');

    const error = new RangeError("Maximum call stack size exceeded in calculateCompoundSchedule()");

    if (typeof Rollbar !== 'undefined' && Rollbar.error) {
      Rollbar.error(`Amortization Engine Crash: ${error.message}`, error, {
        principal: principal,
        interestRate: rate,
        termYears: years,
        failureReason: 'STACK_OVERFLOW_EXPANSION'
      });
      this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: ERROR]', `Item: RangeError Stack Overflow`);
    }

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
          endpoint: '/v2/rates/live',
          currencyPair: pair,
          httpStatus: 500,
          service: 'FEDERAL_FOREX_GATEWAY'
        });
        this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: ERROR]', `Item: Network HTTP 500 for ${pair}`);
      }
    }
  }

  // 4. Crypto Biometric Signature: Unhandled Promise Rejection
  reportCryptoRejection() {
    this.addTelemetry('banking.crypto', 'Customer initiated FIDO2 hardware biometric key derivation for Ethereum cold vault withdrawal');
    this.logToUI('error', 'Unhandled Promise Rejection: Hardware Biometric Token Mismatch', 'FIDO2 Hardware Attestation signature failed validation.');

    if (typeof Rollbar !== 'undefined' && Rollbar.error) {
      Rollbar.error('Unhandled Promise Rejection: FIDO2HardwareAttestationError (Cold Vault Withdrawal)', {
        token: 'FIDO2_LEDGER_NANO',
        vault: 'ETH_COLD_STORAGE',
        errorCode: '0x8A7C99F1'
      });
      this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: ERROR]', 'Item: FIDO2HardwareAttestationError');
    }

    // Trigger real unhandled rejection for Rollbar's captureUnhandledRejections handler
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('FIDO2HardwareAttestationError: Biometric token signature mismatch [0x8A7C99F1]'));
      }, 100);
    });
  }

  // 5. AML Compliance Warning Alert (Rollbar.warning)
  reportAmlAlert(amount, reason) {
    this.addTelemetry('compliance.aml', `Transaction of $${amount.toLocaleString()} flagged by FinCEN automated compliance heuristics`);
    this.logToUI('warning', `⚠️ AML Compliance Alert: $${amount.toLocaleString()} Flagged!`, reason);

    const alertMsg = `AML COMPLIANCE ALERT: Transaction of $${amount.toLocaleString()} exceeded suspicious pattern threshold.`;

    if (typeof Rollbar !== 'undefined' && Rollbar.warning) {
      Rollbar.warning(alertMsg, {
        amount: amount,
        reason: reason,
        riskScore: '0.89 (High Risk)',
        regulatoryJurisdiction: 'US-FINCEN / OFAC',
        complianceQueue: 'ESCALATED_IMMEDIATE_AUDIT'
      });
      this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: WARNING]', `Item: AML Alert ($${amount.toLocaleString()})`);
    }
  }

  // 6. Core Database Desync (Rollbar.critical)
  reportCoreFatalSync(details) {
    this.addTelemetry('system.core', 'CRITICAL: Core double-entry ledger checksum mismatch detected in customer vault!');
    this.logToUI('error', '🚨 CRITICAL: Core Banking Ledger Desync (SEV-0)!', details);

    const criticalMsg = `CRITICAL LEDGER ANOMALY: Double-entry checksum mismatch on customer vault [CUST-9942]!`;

    if (typeof Rollbar !== 'undefined' && Rollbar.critical) {
      Rollbar.critical(criticalMsg, {
        details: details,
        severity: 'SEV-0',
        automatedCircuitBreaker: 'TRIPPED',
        vaultId: 'CUST-9942'
      });
      this.logToUI('rollbar-sent', 'Dispatched to Rollbar [Level: CRITICAL]', 'Item: Core Ledger Desync SEV-0');
    }
  }
}

window.rollbarBank = new RollbarBankManager();
