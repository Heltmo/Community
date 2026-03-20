// ═══════════════════════════════════════════════════════════
// signup.js — Registration + Login logic for index.html
// ═══════════════════════════════════════════════════════════

/* ── POPULATE DATE DROPDOWNS ───────────────────────── */
(function () {
  const dayEl  = document.getElementById('birthDay');
  const yearEl = document.getElementById('birthYear');
  for (let d = 1; d <= 31; d++) {
    const o = document.createElement('option');
    o.value = String(d).padStart(2, '0');
    o.textContent = d;
    dayEl.appendChild(o);
  }
  const maxYear = new Date().getFullYear() - 17;
  for (let y = maxYear; y >= 1920; y--) {
    const o = document.createElement('option');
    o.value = y;
    o.textContent = y;
    yearEl.appendChild(o);
  }
})();

/* ── TAB SWITCHING ─────────────────────────────────── */
document.getElementById('tabRegister').addEventListener('click', function () {
  document.getElementById('tabRegister').classList.add('active');
  document.getElementById('tabLogin').classList.remove('active');
  showPanel('panelRegister');
});

document.getElementById('tabLogin').addEventListener('click', function () {
  document.getElementById('tabLogin').classList.add('active');
  document.getElementById('tabRegister').classList.remove('active');
  showPanel('panelLogin');
});

/* ── VIDEO MONTAGE ─────────────────────────────────── */
(function () {
  const wrap    = document.getElementById('bgWrap');
  const videos  = Array.from(wrap.querySelectorAll('video'));
  const HOLD    = 5500;
  const FADE    = 1400;
  let   current = 0;

  videos.forEach(v => { v.loop = true; v.play().catch(() => {}); });

  function next() {
    const prev = current;
    current    = (current + 1) % videos.length;
    videos[current].classList.add('active');
    setTimeout(() => videos[prev].classList.remove('active'), FADE);
  }

  setInterval(next, HOLD);
})();

/* ── MEMBER GOAL ───────────────────────────────────── */
initMemberGoal('register', 'memberGoalMount');

/* ── VALIDATION HELPERS ────────────────────────────── */
function fieldError(inputId, errId, show) {
  const el  = document.getElementById(inputId);
  const msg = document.getElementById(errId);
  el.classList.toggle('error', show);
  msg.classList.toggle('visible', show);
}

function checkboxError(show) {
  document.getElementById('check-wrap').classList.toggle('error', show);
  document.getElementById('err-bekreft').classList.toggle('visible', show);
}

let _pendingReg   = null;
let _pendingPhone = '';

// Convert dd/mm/yyyy → yyyy-mm-dd; HTML date inputs already return yyyy-mm-dd
function toIsoDate(val) {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const [d, m, y] = val.split('/');
  return y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0');
}

function showPanel(id) {
  ['panelRegister','panelOtp','panelLogin'].forEach(p => {
    document.getElementById(p).classList.toggle('active', p === id);
  });
}

function authErrorMessage(action, error) {
  const msg = String(error?.message || '').toLowerCase();
  if (/failed to fetch|network request failed|network error/.test(msg))
    return 'Tilkoblingen feilet. Prøv igjen.';
  if (/rate limit|too many requests|security purposes/.test(msg))
    return 'Du har prøvd for mange ganger. Vent litt og prøv igjen.';
  if (/invalid.*phone|phone.*invalid|unable to validate/.test(msg))
    return 'Telefonnummeret er ikke gyldig. Bruk format +47 000 00 000.';
  if (/token.*expired|invalid.*token|otp.*invalid/.test(msg))
    return 'Koden er feil eller har utløpt. Prøv igjen.';
  if (/invalid email|email.*invalid/.test(msg))
    return 'E-postadressen er ikke gyldig.';
  const fallback = {
    'send-otp':       'Kunne ikke sende kode. Prøv igjen.',
    'verify-otp':     'Kunne ikke bekrefte koden. Prøv igjen.',
    'password-login': 'Feil telefonnummer eller passord.',
  };
  return fallback[action] || 'Noe gikk galt. Prøv igjen.';
}

/* ── PHONE PREFIX GUARD ─────────────────────────────── */
['phoneNumber', 'loginPhone'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    if (!el.value.startsWith('+47')) {
      el.value = '+47' + el.value.replace(/^\+47?/, '');
    }
  });
  el.addEventListener('keydown', e => {
    const PREFIX = '+47';
    if ((e.key === 'Backspace' || e.key === 'Delete') && el.value === PREFIX) {
      e.preventDefault();
    }
  });
});

/* ── CLEAR ERRORS ON INPUT ─────────────────────────── */
['fullName','phoneNumber','email','kommune'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById(id).classList.remove('error');
    document.getElementById('err-' + id).classList.remove('visible');
  });
});
['birthDay','birthMonth','birthYear'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    document.getElementById('birthDay').classList.remove('error');
    document.getElementById('birthMonth').classList.remove('error');
    document.getElementById('birthYear').classList.remove('error');
    document.getElementById('err-birthdate').classList.remove('visible');
  });
});

document.getElementById('bekreft').addEventListener('change', () => {
  checkboxError(false);
  document.getElementById('check-wrap').classList.remove('error');
});

document.getElementById('switchToRegister').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('tabRegister').click();
});

/* ── REGISTRATION SUBMIT ───────────────────────────── */
document.getElementById('regForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name         = document.getElementById('fullName').value.trim();
  const phone        = document.getElementById('phoneNumber').value.trim();
  const emailVal     = document.getElementById('email').value.trim();
  const municipality = document.getElementById('kommune').value.trim();
  const bekreft      = document.getElementById('bekreft').checked;

  const bDay   = document.getElementById('birthDay').value;
  const bMonth = document.getElementById('birthMonth').value;
  const bYear  = document.getElementById('birthYear').value;

  fieldError('fullName',    'err-fullName',    !name);
  fieldError('phoneNumber', 'err-phoneNumber', !phone);
  fieldError('kommune',     'err-kommune',     !municipality);
  checkboxError(!bekreft);

  const emailMissing = !emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
  fieldError('email', 'err-email', emailMissing);
  if (emailMissing) {
    document.getElementById('err-email').textContent = emailVal
      ? 'Oppgi en gyldig e-postadresse.'
      : 'E-postadresse er påkrevd.';
  }

  let birthdateError = '';
  let birthdate = '';
  if (!bDay || !bMonth || !bYear) {
    birthdateError = 'Fødselsdato er påkrevd.';
  } else {
    birthdate = bYear + '-' + bMonth + '-' + bDay;
    const today = new Date(); today.setHours(0,0,0,0);
    const dob   = new Date(birthdate);
    if (dob >= today) {
      birthdateError = 'Fødselsdato kan ikke være i fremtiden.';
    } else {
      const age = today.getFullYear() - dob.getFullYear()
        - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
      if (age < 17) birthdateError = 'Du må være minst 17 år for å registrere deg.';
    }
  }
  const dateInvalid = !!birthdateError;
  document.getElementById('err-birthdate').textContent = birthdateError;
  document.getElementById('err-birthdate').classList.toggle('visible', dateInvalid);
  document.getElementById('birthDay').classList.toggle('error', dateInvalid);
  document.getElementById('birthMonth').classList.toggle('error', dateInvalid);
  document.getElementById('birthYear').classList.toggle('error', dateInvalid);

  if (!name || !phone || birthdateError || !municipality || !bekreft || emailMissing) return;

  const btn = this.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Sjekker…';

  const formattedPhone = formatPhone(phone);

  // Check if phone or email already exists before sending SMS
  const { data: existingPhone } = await db.from('members').select('id').eq('phone', formattedPhone).maybeSingle();
  if (existingPhone) {
    fieldError('phoneNumber', 'err-phoneNumber', true);
    document.getElementById('err-phoneNumber').textContent = 'Dette telefonnummeret er allerede registrert. Vennligst logg inn.';
    btn.disabled    = false;
    btn.textContent = 'Bli medlem';
    return;
  }

  const { data: existingEmail } = await db.from('members').select('id').eq('email', emailVal).maybeSingle();
  if (existingEmail) {
    fieldError('email', 'err-email', true);
    document.getElementById('err-email').textContent = 'Denne e-postadressen er allerede registrert. Vennligst logg inn.';
    btn.disabled    = false;
    btn.textContent = 'Bli medlem';
    return;
  }

  btn.textContent = 'Sender kode…';
  const { error: otpError } = await db.auth.signInWithOtp({ phone: formattedPhone });

  if (otpError) {
    alert(authErrorMessage('send-otp', otpError));
    btn.disabled    = false;
    btn.textContent = 'Bli medlem';
    return;
  }

  _pendingPhone = formattedPhone;
  _pendingReg   = {
    name, phone: formattedPhone, email: emailVal,
    birth_date: toIsoDate(birthdate), municipality,
    wants_membership: true,
    join_date: new Date().toISOString().slice(0, 10),
  };

  // Persist across page navigations
  localStorage.setItem('uan_pending_reg', JSON.stringify(_pendingReg));

  btn.disabled    = false;
  btn.textContent = 'Bli medlem';

  document.getElementById('otpPhoneDisplay').textContent = formattedPhone;
  showPanel('panelOtp');
  setTimeout(() => document.getElementById('otpCode').focus(), 100);
});

/* ── OTP VERIFY ─────────────────────────────────────── */
document.getElementById('otpCode').addEventListener('input', () => {
  document.getElementById('otpCode').classList.remove('error');
  document.getElementById('err-otpCode').classList.remove('visible');
});

document.getElementById('otpVerifyBtn').addEventListener('click', async () => {
  const token = document.getElementById('otpCode').value.trim();
  if (!token || token.length < 4) {
    document.getElementById('otpCode').classList.add('error');
    document.getElementById('err-otpCode').classList.add('visible');
    return;
  }

  const btn = document.getElementById('otpVerifyBtn');
  btn.disabled    = true;
  btn.textContent = 'Bekrefter…';

  // Restore from localStorage if memory was cleared
  if (!_pendingReg) {
    const saved = localStorage.getItem('uan_pending_reg');
    if (saved) {
      _pendingReg   = JSON.parse(saved);
      _pendingPhone = _pendingReg.phone;
    }
  }

  // Verify OTP — this creates the auth session
  const { data: verifyData, error: verifyError } = await db.auth.verifyOtp({
    phone: _pendingPhone,
    token,
    type: 'sms',
  });

  if (verifyError || !verifyData?.session) {
    alert(authErrorMessage('verify-otp', verifyError));
    btn.disabled    = false;
    btn.textContent = 'Bekreft og fortsett';
    return;
  }

  // Confirm the session is live before inserting
  const { data: sessionData } = await db.auth.getSession();
  const session = sessionData?.session;

  console.log('[signup] auth.uid after verify:', session?.user?.id ?? 'NO SESSION');

  if (!session?.user?.id) {
    console.error('[signup] No authenticated session after OTP verify — aborting insert');
    window.location.href = 'create-password.html';
    return;
  }

  if (_pendingReg) {
    const payload = {
      user_id:          session.user.id,
      name:             _pendingReg.name,
      phone:            _pendingReg.phone,
      email:            _pendingReg.email,
      municipality:     _pendingReg.municipality,
      wants_membership: _pendingReg.wants_membership,
      birth_date:       _pendingReg.birth_date,
      join_date:        _pendingReg.join_date,
      verified:         true,
      role:             'member',
    };

    console.log('[signup] insert payload:', JSON.stringify(payload));

    const existing = await getMember(session.user.id);
    console.log('[signup] existing member row:', existing);

    if (existing) {
      // Account already exists — block re-registration
      localStorage.removeItem('uan_pending_reg');
      await db.auth.signOut();
      btn.disabled    = false;
      btn.textContent = 'Bekreft og fortsett';
      document.getElementById('otpCode').value = '';
      showPanel('panelLogin');
      document.getElementById('tabLogin').classList.add('active');
      document.getElementById('tabRegister').classList.remove('active');
      alert('Du har allerede en konto med dette telefonnummeret. Vennligst logg inn.');
      return;
    }

    if (!existing) {
      const insertResponse = await db.from('members').insert(payload);
      console.log('[signup] insert response:', JSON.stringify(insertResponse));

      if (insertResponse.error) {
        console.error('[signup] insert error:', insertResponse.error);
        // Leave localStorage intact so create-password.html can retry
      } else {
        localStorage.removeItem('uan_pending_reg');
        await postSystemMessage(
          '🎉 Et nytt medlem har ankommet fellesskapet — velkommen, ' + _pendingReg.name + '!'
        );
      }
    } else {
      console.log('[signup] member already exists, skipping insert');
      localStorage.removeItem('uan_pending_reg');
    }
  } else {
    console.warn('[signup] _pendingReg is null — no registration data to insert');
  }

  window.location.href = 'create-password.html';
});

document.getElementById('resendOtpBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  if (!_pendingPhone) return;
  await db.auth.signInWithOtp({ phone: _pendingPhone });
  alert('Ny kode er sendt til ' + _pendingPhone);
});

/* ── LOGIN SUBMIT ──────────────────────────────────── */
document.getElementById('loginPhone').addEventListener('input', () => {
  document.getElementById('loginPhone').classList.remove('error');
  document.getElementById('err-loginPhone').classList.remove('visible');
});
document.getElementById('loginPassword').addEventListener('input', () => {
  document.getElementById('loginPassword').classList.remove('error');
  document.getElementById('err-loginPassword').classList.remove('visible');
});

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const phone    = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value;

  fieldError('loginPhone',    'err-loginPhone',    !phone);
  fieldError('loginPassword', 'err-loginPassword', !password);
  if (!phone || !password) return;

  const btn = this.querySelector('button[type="submit"]');
  btn.disabled    = true;
  btn.textContent = 'Logger inn…';

  const { error } = await db.auth.signInWithPassword({
    phone: formatPhone(phone),
    password,
  });

  if (error) {
    alert(authErrorMessage('password-login', error));
    btn.disabled    = false;
    btn.textContent = 'Logg inn';
    return;
  }

  window.location.href = 'dashboard.html';
});
