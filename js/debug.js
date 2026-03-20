// ===== GLOBAL DEBUG INTERCEPT =====
(function () {
  function showError(title, msg) {
    const box = document.createElement('div');
    box.style.position = 'fixed';
    box.style.top = '10px';
    box.style.left = '10px';
    box.style.right = '10px';
    box.style.background = '#300';
    box.style.color = '#fff';
    box.style.padding = '10px';
    box.style.zIndex = '999999';
    box.style.fontSize = '12px';
    box.style.whiteSpace = 'pre-wrap';

    box.textContent = title + '\n\n' + msg;

    document.body.appendChild(box);
  }

  window.onerror = function (msg, src, line, col, err) {
    showError(
      'GLOBAL ERROR',
      msg + '\n' +
      src + ':' + line + ':' + col + '\n\n' +
      (err && err.stack ? err.stack : '')
    );
  };

  window.onunhandledrejection = function (e) {
    const reason = e.reason;
    showError(
      'PROMISE ERROR',
      reason && reason.stack ? reason.stack : String(reason)
    );
  };
})();