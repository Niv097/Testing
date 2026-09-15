/**
 * Sentry Manager - Sentry Bug Quest
 * Handles Sentry SDK initialization, configuration, breadcrumbs, context, and error dispatching.
 */

class SentryManager {
  constructor() {
    this.dsn = localStorage.getItem('sentry_quest_dsn') || '';
    this.environment = localStorage.getItem('sentry_quest_env') || 'development';
    this.isInitialized = false;
    this.lastEventId = null;
    this.eventListeners = [];
  }

  // Register listener for UI terminal log updates
  onLog(callback) {
    this.eventListeners.push(callback);
  }

  logToUI(type, title, details = '') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, type, title, details };
    this.eventListeners.forEach(cb => cb(entry));
  }

  // Initialize or reinitialize Sentry with a DSN
  init(customDsn, customEnv) {
    if (customDsn) {
      this.dsn = customDsn.trim();
      localStorage.setItem('sentry_quest_dsn', this.dsn);
    }
    if (customEnv) {
      this.environment = customEnv.trim();
      localStorage.setItem('sentry_quest_env', this.environment);
    }

    if (!this.dsn) {
      this.logToUI('warning', 'Sentry DSN is empty', 'Please paste your Sentry DSN in the top bar to send events to sentry.io.');
      return false;
    }

    try {
      if (typeof Sentry === 'undefined') {
        this.logToUI('error', 'Sentry SDK not loaded', 'The Sentry Browser script tag could not be found.');
        return false;
      }

      // Close previous client if active
      if (Sentry.close) {
        Sentry.close();
      }

      Sentry.init({
        dsn: this.dsn,
        environment: this.environment,
        release: 'sentry-bug-quest@1.0.0',
        integrations: [
          Sentry.browserTracingIntegration ? Sentry.browserTracingIntegration() : null,
          Sentry.replayIntegration ? Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }) : null,
        ].filter(Boolean),
        // Tracing sample rate (100% for testing)
        tracesSampleRate: 1.0,
        // Session Replay sample rates
        replaysSessionSampleRate: 1.0,
        replaysOnErrorSampleRate: 1.0,
        beforeSend: (event, hint) => {
          this.lastEventId = event.event_id;
          this.logToUI('sentry-sent', `Event Dispatched to Sentry [${event.level || 'error'}]`, `Event ID: ${event.event_id || 'N/A'}`);
          return event;
        }
      });

      // Default user context & tags
      this.setUser({
        id: 'hero_player_' + Math.floor(Math.random() * 1000),
        username: 'GlitchKnight',
        email: 'hero@bugquest.game',
      });

      this.setTag('game.version', '1.0.0');
      this.setTag('dungeon.level', 'The Cursed Crypt');
      this.setTag('character.class', 'Arcane Tester');

      this.isInitialized = true;
      this.logToUI('success', 'Sentry Initialized Successfully', `Environment: ${this.environment} | Tracing & Replays Active`);
      return true;
    } catch (err) {
      this.logToUI('error', 'Failed to initialize Sentry', err.message);
      return false;
    }
  }

  setUser(userObj) {
    if (typeof Sentry !== 'undefined') {
      Sentry.setUser(userObj);
      this.addBreadcrumb('user', `User set to ${userObj.username} (${userObj.id})`, userObj);
    }
  }

  setTag(key, value) {
    if (typeof Sentry !== 'undefined') {
      Sentry.setTag(key, value);
    }
  }

  setContext(name, contextObj) {
    if (typeof Sentry !== 'undefined') {
      Sentry.setContext(name, contextObj);
    }
  }

  addBreadcrumb(category, message, data = {}, level = 'info') {
    if (typeof Sentry !== 'undefined') {
      Sentry.addBreadcrumb({
        category,
        message,
        data,
        level,
        timestamp: Date.now() / 1000
      });
    }
    this.logToUI('breadcrumb', `[Breadcrumb: ${category}] ${message}`, Object.keys(data).length ? JSON.stringify(data) : '');
  }

  // --- Intentional Errors for Testing ---

  // 1. Uncaught TypeError
  triggerTypeError() {
    this.addBreadcrumb('dungeon.action', 'Hero opened the Cursed Chest of Null', { chestId: 'chest_void_99' });
    this.logToUI('trigger', 'Triggering Uncaught TypeError...', 'Accessing properties of null/undefined');
    
    // Deliberate TypeError
    const cursedLoot = null;
    return cursedLoot.enchantedSword.damageMultiplier;
  }

  // 2. ReferenceError
  triggerReferenceError() {
    this.addBreadcrumb('magic.spell', 'Hero chanted the Ancient Void Forbidden Spell', { spellCost: 50 });
    this.logToUI('trigger', 'Triggering ReferenceError...', 'Calling undeclared function');

    // Deliberate ReferenceError
    // eslint-disable-next-line no-undef
    return invokeNonExistentDragonPortal(999);
  }

  // 3. RangeError / Stack Overflow
  triggerRangeError() {
    this.addBreadcrumb('inventory.equip', 'Hero equipped the Infinite Mirror Shield', { reflections: 'unlimited' });
    this.logToUI('trigger', 'Triggering RangeError (Stack Overflow)...', 'Executing infinite recursion loop');

    function infiniteReflection(depth = 0) {
      return infiniteReflection(depth + 1);
    }
    return infiniteReflection(1);
  }

  // 4. Unhandled Promise Rejection
  triggerPromiseRejection() {
    this.addBreadcrumb('save.cloud', 'Hero attempted to save game state to corrupted cloud server', { slot: 1 });
    this.logToUI('trigger', 'Triggering Unhandled Promise Rejection...', 'Uncaught Promise rejection');

    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('CloudSaveSyncFailed: Remote server sent checksum mismatch [0xDEADBEEF]'));
      }, 200);
    });
  }

  // 5. Simulated Network / Fetch 404 Error
  async triggerNetworkError() {
    this.addBreadcrumb('shop.network', 'Hero visited the Guild Black Market API', { endpoint: '/api/v1/illegal-weapons' });
    this.logToUI('trigger', 'Triggering Network 404 Fetch Error...', 'Sending HTTP GET to a non-existent API endpoint');

    try {
      const response = await fetch('https://httpstat.us/404?sleep=300');
      if (!response.ok) {
        throw new Error(`Guild API Failed with HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      if (typeof Sentry !== 'undefined') {
        Sentry.captureException(err);
      }
      this.logToUI('error', 'Captured Network Exception in Sentry', err.message);
      throw err;
    }
  }

  // 6. Slow Transaction / Main Thread Lag (Performance Monitoring)
  triggerSlowTransaction() {
    this.addBreadcrumb('performance.lag', 'Boss "Lag Demon" casted Chrono Freeze spell', { duration: '1200ms' });
    this.logToUI('trigger', 'Triggering Heavy CPU Block (Performance Tracing)...', 'Blocking JS thread for 1.2s to test transaction tracing');

    const start = performance.now();
    // Simulate synchronous heavy CPU calculation
    while (performance.now() - start < 1200) {
      Math.sqrt(Math.random() * 1000000);
    }

    if (typeof Sentry !== 'undefined') {
      Sentry.captureMessage('Performance Lag Spike: Chrono Freeze exceeded frame budget (1200ms)', 'warning');
    }
    this.logToUI('success', 'Slow Transaction Finished', '1200ms main thread lock captured!');
  }

  // 7. Custom Messages with Severity Levels
  captureCustomMessage(level, message) {
    this.addBreadcrumb('admin.audit', `Admin alert triggered: ${message}`, { level });
    if (typeof Sentry !== 'undefined') {
      const eventId = Sentry.captureMessage(message, level);
      this.lastEventId = eventId;
      this.logToUI('sentry-sent', `Captured Message [Level: ${level.toUpperCase()}]`, message);
      return eventId;
    }
    return null;
  }

  // 8. Trigger User Feedback / Crash Report Dialog
  showUserFeedbackDialog() {
    this.logToUI('trigger', 'Opening Sentry User Feedback Dialog...', 'Allowing player to submit bug report with crash details');
    if (typeof Sentry !== 'undefined' && Sentry.showReportDialog) {
      Sentry.showReportDialog({
        eventId: this.lastEventId || undefined,
        title: 'The Glitched Dungeon Crashed!',
        subtitle: 'Our arcane alchemists have been notified. Tell us what happened!',
        subtitle2: 'If you want to help, let us know what spell or chest caused this anomaly.',
        labelComments: 'What went wrong?',
        labelSubmit: 'Submit Crash Report',
        user: {
          name: 'GlitchKnight',
          email: 'hero@bugquest.game'
        }
      });
    } else {
      alert('Sentry User Feedback Dialog is available once an error has occurred or when Sentry.showReportDialog is loaded.');
    }
  }
}

window.sentryManager = new SentryManager();
