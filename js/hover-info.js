/* ============================================================
   hover-info.js — rosovo.org inline popover component
   ============================================================
   Call initHoverInfo() after the DOM is ready, or add this
   script at the bottom of <body> (it runs automatically).

   Reads these data attributes off each .hover-info element:
     data-title        card heading
     data-desc         short description
     data-link         optional URL
     data-link-label   optional link text (default: "Learn more")
     data-img          optional image/gif path or URL

   
   ============================================================ */

function initHoverInfo() {
  document.querySelectorAll('.hover-info').forEach(el => {
    // Skip if already initialized
    if (el.dataset.hiInit) return;
    el.dataset.hiInit = '1';

    const title     = el.dataset.title     || '';
    const desc      = el.dataset.desc      || '';
    const link      = el.dataset.link      || '';
    const linkLabel = el.dataset.linkLabel || 'Learn more';
    const img       = el.dataset.img       || '';

    const hasImg  = img.trim().length > 0;
    const hasLink = link.trim().length > 0;

    // Build the card
    const card = document.createElement('div');
    card.className = 'hover-info__card';
    card.setAttribute('role', 'tooltip');

    card.innerHTML = `
      <button class="hover-info__close" aria-label="Close info card">&#x2715;</button>
      <div class="hover-info__body">
        <div class="hover-info__text-col">
          <div class="hover-info__title">${title}</div>
          <div class="hover-info__desc">${desc}</div>
          ${hasLink
            ? `<a class="hover-info__link" href="${link}" target="_blank" rel="noopener noreferrer">
                 ${linkLabel} <span aria-hidden="true">&#x2197;</span>
               </a>`
            : ''}
        </div>
        <div class="hover-info__img-col${hasImg ? '' : ' no-img'}">
          ${hasImg ? `<img src="${img}" alt="" loading="lazy">` : ''}
        </div>
      </div>
      <div class="hover-info__arrow" aria-hidden="true"></div>
    `;

    el.appendChild(card);

    const setPosition = () => {
      const phraseRect = el.getBoundingClientRect();
      const spaceAbove = phraseRect.top;
      card.classList.toggle('flip', spaceAbove < 160);

      // Reset offsets before measuring.
      card.style.setProperty('--hi-shift', '0px');
      card.style.setProperty('--hi-arrow-offset', '0px');

      const viewportPad = 12;
      const cardRect = card.getBoundingClientRect();
      let shift = 0;

      if (cardRect.left < viewportPad) {
        shift = viewportPad - cardRect.left;
      } else if (cardRect.right > window.innerWidth - viewportPad) {
        shift = (window.innerWidth - viewportPad) - cardRect.right;
      }

      if (shift !== 0) {
        card.style.setProperty('--hi-shift', `${shift}px`);
      }

      // Keep pointer aimed at the phrase while preventing it from leaving card bounds.
      const cardWidth = card.offsetWidth;
      const idealArrowX = cardWidth / 2 - shift;
      const minArrowX = 18;
      const maxArrowX = cardWidth - 18;
      const clampedArrowX = Math.min(Math.max(idealArrowX, minArrowX), maxArrowX);
      const arrowOffset = clampedArrowX - cardWidth / 2;
      card.style.setProperty('--hi-arrow-offset', `${arrowOffset}px`);
    };

    el.addEventListener('mouseenter', setPosition);

    // Click locks the card open
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (el.classList.contains('locked')) return;

      // Close any other locked cards first
      document.querySelectorAll('.hover-info.locked').forEach(other => {
        other.classList.remove('locked');
      });

      el.classList.add('locked');
      setPosition();
    });

    // X button dismisses the locked card
    card.querySelector('.hover-info__close').addEventListener('click', e => {
      e.stopPropagation();
      el.classList.remove('locked');
    });

    window.addEventListener('resize', () => {
      if (el.matches(':hover') || el.classList.contains('locked')) {
        setPosition();
      }
    });

    window.addEventListener('scroll', () => {
      if (el.matches(':hover') || el.classList.contains('locked')) {
        setPosition();
      }
    }, { passive: true });
  });

  // Click anywhere outside a locked card to dismiss it
  document.addEventListener('click', e => {
    if (!e.target.closest('.hover-info__card')) {
      document.querySelectorAll('.hover-info.locked').forEach(el => {
        el.classList.remove('locked');
      });
    }
  });
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHoverInfo);
} else {
  initHoverInfo();
}
