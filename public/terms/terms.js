(function () {
  var params = new URLSearchParams(window.location.search);
  var client = (params.get('client') || '').trim();
  var job = (params.get('job') || '').trim();
  var unit = (params.get('unit') || '').trim();

  if (client) {
    document.getElementById('client-name').textContent = client;
    document.title = 'Terms of Engagement — ' + client;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  var grid = document.getElementById('summary-grid');
  function cell(label, value) {
    if (!value) return '';
    return '<div class="summary-cell"><div class="summary-cell-label">' + label + '</div><div class="summary-cell-value">' + escapeHtml(value) + '</div></div>';
  }
  grid.innerHTML = cell('Reference', job) + cell('Unit', unit) + cell('Client', client);

  document.getElementById('year').textContent = new Date().getFullYear();

  // ===== Signature pad =====
  var canvas = document.getElementById('sig-canvas');
  var wrap = document.getElementById('sig-wrap');
  var clearBtn = document.getElementById('sig-clear');

  function resizeCanvas() {
    var ratio = Math.max(window.devicePixelRatio || 1, 1);
    var rect = wrap.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    var data = (sigPad && !sigPad.isEmpty()) ? sigPad.toData() : null;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    if (sigPad) {
      sigPad.clear();
      if (data) sigPad.fromData(data);
    }
  }

  var sigPad = new window.SignaturePad(canvas, {
    penColor: '#1e3a5f',
    minWidth: 1.4,
    maxWidth: 2.6,
    backgroundColor: 'rgba(0,0,0,0)',
  });

  sigPad.addEventListener('beginStroke', function () {
    wrap.classList.add('has-ink');
    updateButton();
  });
  sigPad.addEventListener('endStroke', function () {
    if (sigPad.isEmpty()) wrap.classList.remove('has-ink');
    updateButton();
  });

  clearBtn.addEventListener('click', function () {
    sigPad.clear();
    wrap.classList.remove('has-ink');
    updateButton();
  });

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', function () { setTimeout(resizeCanvas, 100); });
  setTimeout(resizeCanvas, 50);

  // ===== Form gating =====
  var nameInput = document.getElementById('typed-name');
  var btn = document.getElementById('btn-agree');
  var errorEl = document.getElementById('form-error');

  function updateButton() {
    var name = nameInput.value.trim();
    btn.disabled = !(name.length >= 2 && !sigPad.isEmpty());
  }
  nameInput.addEventListener('input', updateButton);

  // ===== Submit =====
  btn.addEventListener('click', function () {
    var typedName = nameInput.value.trim();
    if (typedName.length < 2 || sigPad.isEmpty()) return;
    btn.disabled = true;
    btn.textContent = 'Recording…';
    errorEl.classList.remove('on');

    var signaturePng = sigPad.toDataURL('image/png');
    fetch('/api/acknowledgements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobRef: job || ('UNKNOWN-' + Date.now()),
        clientName: client,
        unit: unit,
        typedName: typedName,
        signaturePngBase64: signaturePng,
      }),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) throw new Error(body.error || ('HTTP ' + res.status));
          return body;
        });
      })
      .then(function (body) {
        var record = { id: body.id, acknowledgedAt: body.acknowledgedAt, typedName: typedName };
        var storageKey = job ? 'sp_ack_' + job : null;
        if (storageKey) {
          try { localStorage.setItem(storageKey, JSON.stringify(record)); } catch (_) { /* ignore */ }
        }
        showSuccess(typedName, record);
      })
      .catch(function (err) {
        errorEl.textContent = 'Could not record agreement: ' + err.message + '. Please try again, or contact SnaggingPro directly.';
        errorEl.classList.add('on');
        btn.disabled = false;
        btn.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>' +
          ' I have read and agree to these terms';
      });
  });

  function showSuccess(name, record) {
    document.getElementById('terms-content').style.display = 'none';
    document.getElementById('success-container').style.display = 'block';
    document.getElementById('success-name').textContent = name;
    var when = new Date(record.acknowledgedAt);
    var rcpt = document.getElementById('receipt');
    rcpt.innerHTML =
      '<strong>Reference:</strong> <code>' + escapeHtml(record.id || '—') + '</code><br>' +
      '<strong>Recorded:</strong> ' + when.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' }) + '<br>' +
      (job ? '<strong>Job:</strong> ' + escapeHtml(job) + '<br>' : '') +
      'Keep this page or take a screenshot for your records.';
  }

  // Already acknowledged? Show the receipt instead of the form.
  (function () {
    var storageKey = job ? 'sp_ack_' + job : null;
    if (!storageKey) return;
    try {
      var prev = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (prev && prev.id && prev.acknowledgedAt) {
        showSuccess(prev.typedName || client || 'Valued Client', prev);
      }
    } catch (_) { /* ignore */ }
  })();
})();
