// ============================================================
//  ANTI-DEVTOOLS & SOURCE PROTECTION
//  Multiple detection layers to prevent casual inspection.
//  This runs as early as possible in the app lifecycle.
// ============================================================

const REDIRECT_URL = 'about:blank';
const CHECK_INTERVAL = 1000;

// ---- 1. Block keyboard shortcuts ----
function blockShortcuts() {
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+Shift+I (Inspector)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+Shift+C (Element picker)
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+U (View source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+Shift+K (Firefox console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k' || e.keyCode === 75)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Cmd+Option+I (Mac Inspector)
    if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Cmd+Option+J (Mac Console)
    if (e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) { e.preventDefault(); e.stopPropagation(); return false; }
    // Cmd+Option+U (Mac View Source)
    if (e.metaKey && e.altKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) { e.preventDefault(); e.stopPropagation(); return false; }
  }, true);
}

// ---- 2. Block right-click context menu ----
function blockContextMenu() {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, true);
}

// ---- 3. Detect DevTools via window size differential ----
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || ('ontouchstart' in window && window.innerWidth < 1024);
}

function detectDevToolsBySize() {
  // Skip on mobile — browser chrome causes false positives
  if (isMobileDevice()) return false;
  const threshold = 200;
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  return widthDiff > threshold || heightDiff > threshold;
}

// ---- 4. Detect DevTools via debugger timing ----
function detectDevToolsByTiming() {
  const start = performance.now();
  // debugger statement takes ~100ms+ when DevTools is open
  // eslint-disable-next-line no-debugger
  debugger;
  const end = performance.now();
  return (end - start) > 50;
}

// ---- 5. Detect DevTools via console object tricks ----
function detectDevToolsByConsole() {
  let devtoolsOpen = false;
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      devtoolsOpen = true;
      return '';
    }
  });
  // This will trigger the getter if DevTools console is open and logging objects
  console.dir(element);
  return devtoolsOpen;
}

// ---- 6. Poison console output ----
function poisonConsole() {
  const noop = () => {};
  const warn = () => {
    // Clear and warn
    console.clear();
  };

  // Override console methods
  if (typeof console !== 'undefined') {
    console.log = noop;
    console.info = noop;
    console.warn = noop;
    console.error = noop;
    console.debug = noop;
    console.table = noop;
    console.trace = noop;
    console.dir = noop;
    console.dirxml = noop;
    console.group = noop;
    console.groupCollapsed = noop;
    console.groupEnd = noop;
    console.time = noop;
    console.timeEnd = noop;
    console.timeLog = noop;
    console.profile = noop;
    console.profileEnd = noop;
    console.count = noop;
    console.countReset = noop;
    console.assert = noop;
  }
}

// ---- 7. Console warning message (styled) ----
function showConsoleWarning() {
  // Use the REAL console.warn before we poison it
  const realWarn = window.__realConsoleWarn || console.warn;
  try {
    realWarn.call(console,
      '%c⚠️ STOP!',
      'color: red; font-size: 60px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);'
    );
    realWarn.call(console,
      '%cThis is a browser feature intended for developers. If someone told you to copy and paste something here, it is a scam and will give them access to your account.',
      'color: white; font-size: 16px; background: #1e1e2e; padding: 10px; border-radius: 8px;'
    );
  } catch(e) {}
}

// ---- 8. Disable text selection on sensitive elements ----
function disableTextSelection() {
  const style = document.createElement('style');
  style.textContent = `
    .code-block, .admin-table, pre, code {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
  `;
  document.head.appendChild(style);
}

// ---- 9. Detect and respond ----
let warningShown = false;
function onDevToolsDetected() {
  if (!warningShown) {
    warningShown = true;
    const overlay = document.createElement('div');
    overlay.id = 'devtools-overlay';
    overlay.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-family:'Inter',sans-serif;">
        <div style="font-size:64px;margin-bottom:20px;">🛡️</div>
        <h1 style="font-size:2rem;margin-bottom:12px;color:#ef4444;">Access Denied</h1>
        <p style="color:#94a3b8;text-align:center;max-width:400px;">Developer tools are not permitted on this site. Please close them to continue browsing.</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }
}

function onDevToolsClosed() {
  warningShown = false;
  const overlay = document.getElementById('devtools-overlay');
  if (overlay) overlay.remove();
}

// ---- Main Loop (console-based only, no size detection) ----
function startDetectionLoop() {
  setInterval(() => {
    // Only use console-based detection (reliable, no false positives)
    const consoleDetected = detectDevToolsByConsole();
    if (consoleDetected) {
      onDevToolsDetected();
    } else {
      onDevToolsClosed();
    }
  }, CHECK_INTERVAL);
}

// ============================================================
//  INIT — Call this once at app startup
// ============================================================
export function initAntiDevTools() {
  const isProd = import.meta.env.PROD;

  // Save real console.warn for the warning message
  window.__realConsoleWarn = console.warn.bind(console);

  // Show styled console warning
  showConsoleWarning();

  // Always block shortcuts and context menu
  blockShortcuts();
  blockContextMenu();

  // Block text selection on code elements
  disableTextSelection();

  if (isProd) {
    // Full protection in production only
    poisonConsole();
    startDetectionLoop();
  }
  // In dev mode: only shortcuts + context menu blocked, no detection loop
}

// ---- Block drag of images/content ----
document.addEventListener('dragstart', (e) => { e.preventDefault(); return false; }, true);
// ---- Block select all ----
document.addEventListener('selectstart', (e) => {
  // Allow in input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return true;
  // Block on code blocks
  if (e.target.closest('.code-block, pre, code, .admin-table')) {
    e.preventDefault();
    return false;
  }
});
