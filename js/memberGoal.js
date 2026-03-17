// ═══════════════════════════════════════════════════════════
// UAN — Shared Medlemsmål component
// Requires: db (from brim.js), included after that script
// Usage: initMemberGoal('register' | 'login', 'mountElementId')
// ═══════════════════════════════════════════════════════════

(function () {

  function injectStyles() {
    if (document.getElementById('uan-member-goal-styles')) return;
    const s = document.createElement('style');
    s.id = 'uan-member-goal-styles';
    s.textContent = `
      .mg-section {
        margin-top: 1.4rem;
        padding-top: 1.1rem;
        border-top: 1px solid rgba(255,255,255,0.06);
      }
      .mg-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.7rem;
      }
      .mg-label {
        font-size: 0.74rem;
        font-weight: 600;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.32);
      }
      .mg-numbers {
        font-size: 0.88rem;
        font-weight: 600;
        color: rgba(255,255,255,0.55);
      }
      .mg-numbers .mg-current { color: #a78bfa; }
      .mg-track {
        height: 5px;
        background: rgba(255,255,255,0.07);
        border-radius: 99px;
        overflow: hidden;
      }
      .mg-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #7c5cfc, #a78bfa);
        border-radius: 99px;
        transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .mg-tagline {
        margin-top: 0.65rem;
        font-size: 0.75rem;
        font-weight: 400;
        color: rgba(255,255,255,0.22);
        letter-spacing: 0.04em;
        font-style: italic;
      }
    `;
    document.head.appendChild(s);
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function initMemberGoal(page, mountId) {
    injectStyles();

    const el = document.getElementById(mountId);
    if (!el) return;

    const { data, error } = await db
      .from('member_goal_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) { el.hidden = true; return; }

    const showOnPage = page === 'register' ? data.show_on_register : data.show_on_login;

    if (!data.is_visible || !showOnPage) { el.hidden = true; return; }

    const pct       = Math.min(Math.round((data.current_count / Math.max(data.target_count, 1)) * 100), 100);
    const remaining = Math.max(data.target_count - data.current_count, 0);
    const fillId    = 'mg-fill-' + page;

    el.innerHTML = `
      <div class="mg-section">
        <div class="mg-header">
          <span class="mg-label">${esc(data.title)}</span>
          <span class="mg-numbers"><span class="mg-current">${data.current_count}</span> / ${remaining}</span>
        </div>
        <div class="mg-track"><div class="mg-fill" id="${fillId}"></div></div>
        <p class="mg-tagline">${esc(data.description)}</p>
      </div>
    `;

    // Animate bar after paint
    requestAnimationFrame(() => {
      const fill = document.getElementById(fillId);
      if (fill) fill.style.width = pct + '%';
    });
  }

  window.initMemberGoal = initMemberGoal;

})();
