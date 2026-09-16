/**
 * BuggyBank - Modern FinTech Application Engine with Rollbar Observability
 */

class BankAudio {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.2);
      });
    } catch (e) {}
  }
  playError() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.setValueAtTime(110, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }
}

class BuggyBankApp {
  constructor() {
    this.audio = new BankAudio();

    // Customer balances
    this.balances = {
      checking: 24850.00,
      savings: 118000.00,
      crypto: 14200.00
    };

    // Preset recipients
    this.recipients = {
      sarah: { name: 'Sarah Jenkins', type: 'Verified Personal', swiftBicCode: 'BOFAUS3NXXX', routing: '121000358', account: '**** 4482' },
      google: { name: 'Google Cloud EMEA', type: 'Verified Enterprise', swiftBicCode: 'CITIUS33XXX', routing: '021000089', account: '**** 9012' },
      offshore_bug: { name: 'Unknown Offshore Entity (Triggers TypeError)', type: 'Unverified Entity', swiftBicCode: undefined, routing: undefined, account: undefined },
      aml_shell: { name: 'High-Risk Shell Corp (Triggers AML Alert)', type: 'Flagged Entity', swiftBicCode: 'CHASUS33XXX', routing: '021000021', account: '**** 6621' }
    };

    // Transactions log
    this.transactions = [
      { id: 'TX-9021', date: 'Today, 02:45 PM', recipient: 'Amazon Web Services', category: 'Cloud Infrastructure', amount: -342.50, status: 'Completed', type: 'debit' },
      { id: 'TX-8982', date: 'Today, 11:10 AM', recipient: 'Payroll Direct Deposit', category: 'Executive Compensation', amount: 9500.00, status: 'Completed', type: 'credit' },
      { id: 'TX-8841', date: 'Yesterday', recipient: 'Stripe Merchant Payout', category: 'Business Revenue', amount: 4810.25, status: 'Completed', type: 'credit' },
      { id: 'TX-8712', date: 'Sep 12', recipient: 'Four Seasons Hotel', category: 'Travel & Dining', amount: -1280.00, status: 'Completed', type: 'debit' }
    ];

    this.initUI();
    this.updateBalanceDisplays();
    this.renderTransactions();
  }

  initUI() {
    // Navigation Tabs
    const navItems = document.querySelectorAll('.nav-btn');
    navItems.forEach(btn => {
      btn.addEventListener('click', (e) => {
        navItems.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view');
        this.switchView(view);
      });
    });

    // Wire Transfer Submission
    const transferForm = document.getElementById('wire-transfer-form');
    if (transferForm) {
      transferForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleWireTransfer();
      });
    }

    // Forex Currency Sync
    const btnSyncForex = document.getElementById('btn-sync-forex');
    if (btnSyncForex) {
      btnSyncForex.addEventListener('click', () => {
        this.handleForexSync();
      });
    }

    // Loan Calculator
    const btnCalcLoan = document.getElementById('btn-calc-loan');
    if (btnCalcLoan) {
      btnCalcLoan.addEventListener('click', () => {
        this.handleLoanCalculation(false);
      });
    }

    const btnLoanGlitch = document.getElementById('btn-loan-glitch');
    if (btnLoanGlitch) {
      btnLoanGlitch.addEventListener('click', () => {
        this.handleLoanCalculation(true);
      });
    }

    // Modal Trigger
    const openTransferBtn = document.getElementById('btn-open-transfer');
    const modal = document.getElementById('transfer-modal');
    const closeModalBtn = document.getElementById('btn-close-modal');

    if (openTransferBtn && modal) {
      openTransferBtn.addEventListener('click', () => {
        modal.classList.add('open');
        if (window.rollbarBank) {
          window.rollbarBank.addTelemetry('navigation', 'Customer opened Wire Transfer modal dialog');
        }
      });
    }

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }

    // Rollbar Test Trigger
    const testRollbarBtn = document.getElementById('btn-test-rollbar');
    if (testRollbarBtn) {
      testRollbarBtn.addEventListener('click', () => {
        if (typeof Rollbar !== 'undefined') {
          Rollbar.info('Rollbar test message from BuggyBank button');
          if (window.rollbarBank) {
            window.rollbarBank.logToUI('rollbar-sent', 'Test Message Dispatched to Rollbar', 'Level: INFO');
          }
        }
      });
    }
  }

  switchView(viewName) {
    if (window.rollbarBank) {
      window.rollbarBank.addTelemetry('navigation', `Customer switched tab to "${viewName}"`);
    }

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.style.display = 'none';
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.style.display = 'block';
    }
  }

  updateBalanceDisplays() {
    const total = this.balances.checking + this.balances.savings + this.balances.crypto;
    const totalEl = document.getElementById('stat-total-networth');
    const checkingEl = document.getElementById('stat-checking');
    const savingsEl = document.getElementById('stat-savings');
    const cryptoEl = document.getElementById('stat-crypto');

    if (totalEl) totalEl.textContent = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (checkingEl) checkingEl.textContent = `$${this.balances.checking.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (savingsEl) savingsEl.textContent = `$${this.balances.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (cryptoEl) cryptoEl.textContent = `$${this.balances.crypto.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  renderTransactions() {
    const listEl = document.getElementById('transaction-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    this.transactions.forEach(tx => {
      const row = document.createElement('div');
      row.className = 'tx-row';
      const isCredit = tx.amount > 0;
      row.innerHTML = `
        <div class="tx-left">
          <div class="tx-icon ${isCredit ? 'credit' : 'debit'}">${isCredit ? '↓' : '↑'}</div>
          <div>
            <div class="tx-recipient">${tx.recipient}</div>
            <div class="tx-meta">${tx.date} • ${tx.category}</div>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${isCredit ? 'credit' : 'debit'}">
            ${isCredit ? '+' : ''}$${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div class="tx-status ${tx.status.toLowerCase()}">${tx.status}</div>
        </div>
      `;
      listEl.appendChild(row);
    });
  }

  // --- FEATURE ACTIONS & ROLLBAR INTEGRATION ---

  // 1. Wire Transfer
  handleWireTransfer() {
    const recipientKey = document.getElementById('transfer-recipient').value;
    const amount = parseFloat(document.getElementById('transfer-amount').value) || 0;
    const memo = document.getElementById('transfer-memo').value || 'Standard Business Wire';
    const recipient = this.recipients[recipientKey];

    if (amount <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }

    if (window.rollbarBank) {
      window.rollbarBank.addTelemetry('banking.transfer_input', `Filled transfer form: Amount $${amount}, Recipient: ${recipient ? recipient.name : 'Unknown'}`);
    }

    // CHECK: Anomaly 1 - TypeError (Unknown Offshore Entity)
    if (recipientKey === 'offshore_bug' || !recipient.swiftBicCode) {
      this.audio.playError();
      const statusBox = document.getElementById('transfer-status-box');
      if (statusBox) {
        statusBox.className = 'status-box error';
        statusBox.innerHTML = `
          <b>💥 TRANSACTION FAILED [TypeError]</b>
          <p>Cannot read properties of undefined (reading 'swiftBicCode'). Dispatched to Rollbar!</p>
        `;
      }
      if (window.rollbarBank) {
        window.rollbarBank.reportTransferTypeError(recipient.name, amount);
      }
      return;
    }

    // CHECK: Anomaly 2 - AML Compliance Warning (Shell Corp or Large Amount)
    if (recipientKey === 'aml_shell' || amount >= 50000) {
      this.audio.playError();
      const reason = amount >= 50000
        ? `Exceeded $50,000 threshold without prior FinCEN clearance.`
        : `Recipient "${recipient.name}" appears on OFAC Specially Designated Nationals watchlist.`;

      const statusBox = document.getElementById('transfer-status-box');
      if (statusBox) {
        statusBox.className = 'status-box warning';
        statusBox.innerHTML = `
          <b>⚠️ AML COMPLIANCE WARNING DISPATCHED TO ROLLBAR</b>
          <p>${reason}</p>
        `;
      }
      if (window.rollbarBank) {
        window.rollbarBank.reportAmlAlert(amount, reason);
      }
      return;
    }

    // SUCCESSFUL TRANSFER
    if (amount > this.balances.checking) {
      alert('Insufficient funds in Checking Account.');
      return;
    }

    this.balances.checking -= amount;
    this.transactions.unshift({
      id: `TX-${Math.floor(Math.random() * 9000 + 1000)}`,
      date: 'Just now',
      recipient: recipient.name,
      category: 'Wire Transfer',
      amount: -amount,
      status: 'Completed',
      type: 'debit'
    });

    this.audio.playSuccess();
    this.updateBalanceDisplays();
    this.renderTransactions();

    const statusBox = document.getElementById('transfer-status-box');
    if (statusBox) {
      statusBox.className = 'status-box success';
      statusBox.innerHTML = `
        <b>✅ Transfer Dispatched Successfully!</b>
        <p>$${amount.toLocaleString()} sent to ${recipient.name}. Transaction ID: ${this.transactions[0].id}</p>
      `;
    }

    if (window.rollbarBank) {
      window.rollbarBank.addTelemetry('banking.transfer_success', `Wire transfer of $${amount} settled`, {
        txId: this.transactions[0].id,
        newCheckingBalance: this.balances.checking
      });
      window.rollbarBank.logToUI('success', `Transfer of $${amount.toLocaleString()} Cleared`, `Wire sent to ${recipient.name}`);
    }
  }

  // 2. Forex Sync
  async handleForexSync() {
    this.audio.playError();
    const resultBox = document.getElementById('forex-result-box');
    if (resultBox) {
      resultBox.innerHTML = `
        <span style="color: #ff4757;">⚠️ Central Bank API Gateway Timeout (HTTP 500)</span>
        <br><small>Exception and HTTP trace captured in Rollbar.</small>
      `;
    }

    if (window.rollbarBank) {
      await window.rollbarBank.reportForexSyncError('USD/EUR');
    }
  }

  // 3. Loan Calculation & Stack Overflow Anomaly
  handleLoanCalculation(triggerGlitch = false) {
    const principal = parseFloat(document.getElementById('loan-amount').value) || 250000;
    const rate = parseFloat(document.getElementById('loan-rate').value) || 6.5;
    const years = parseInt(document.getElementById('loan-term').value) || 30;

    if (triggerGlitch) {
      // Trigger intentional RangeError: Maximum call stack size exceeded
      this.audio.playError();
      const resEl = document.getElementById('loan-result-box');
      if (resEl) {
        resEl.innerHTML = `
          <b style="color: #ff4757;">💥 CALCULATION CRASH [RangeError]</b>
          <p>Maximum call stack size exceeded in calculateCompoundSchedule(). Dispatched to Rollbar!</p>
        `;
      }
      if (window.rollbarBank) {
        window.rollbarBank.reportAmortizationRangeError(principal, rate, years);
      }
      return;
    }

    // Normal valid calculation
    const monthlyRate = (rate / 100) / 12;
    const totalPayments = years * 12;
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const totalInterest = (monthlyPayment * totalPayments) - principal;

    this.audio.playSuccess();
    const resEl = document.getElementById('loan-result-box');
    if (resEl) {
      resEl.innerHTML = `
        <div style="font-size: 1.4rem; font-weight: 800; color: #2ecc71;">$${monthlyPayment.toFixed(2)} <span style="font-size: 0.8rem; color: #8395a7;">/ month</span></div>
        <div style="font-size: 0.8rem; color: #8395a7; margin-top: 4px;">Total Interest: $${totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })} | Total Cost: $${(principal + totalInterest).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
      `;
    }

    if (window.rollbarBank) {
      window.rollbarBank.addTelemetry('banking.calculator', `Calculated loan: Principal $${principal}, Monthly $${monthlyPayment.toFixed(2)}`);
      window.rollbarBank.logToUI('success', 'Amortization Schedule Computed', `$${monthlyPayment.toFixed(2)}/mo for ${years} years`);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.rollbarBank) {
    window.rollbarBank.init();
  }
  window.buggyBank = new BuggyBankApp();
});
