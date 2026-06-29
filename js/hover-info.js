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

const hoverInfoRepositioners = [];
let hoverInfoGlobalEventsBound = false;

function sanitizeHoverInfoUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch (_error) {
    return '';
  }
  return '';
}

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

    const hasImg = img.trim().length > 0;
    const safeLink = sanitizeHoverInfoUrl(link.trim());
    const hasLink = safeLink.length > 0;

    // Build the card
    const card = document.createElement('div');
    card.className = 'hover-info__card';
    card.setAttribute('role', 'tooltip');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'hover-info__close';
    closeBtn.setAttribute('aria-label', 'Close info card');
    closeBtn.textContent = '✕';

    const body = document.createElement('div');
    body.className = 'hover-info__body';

    const textCol = document.createElement('div');
    textCol.className = 'hover-info__text-col';

    const titleEl = document.createElement('div');
    titleEl.className = 'hover-info__title';
    titleEl.textContent = title;

    const descEl = document.createElement('div');
    descEl.className = 'hover-info__desc';
    descEl.textContent = desc;

    textCol.appendChild(titleEl);
    textCol.appendChild(descEl);

    if (hasLink) {
      const linkEl = document.createElement('a');
      linkEl.className = 'hover-info__link';
      linkEl.href = safeLink;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      linkEl.textContent = linkLabel;

      const arrowMark = document.createElement('span');
      arrowMark.setAttribute('aria-hidden', 'true');
      arrowMark.textContent = '↗';
      linkEl.appendChild(document.createTextNode(' '));
      linkEl.appendChild(arrowMark);

      textCol.appendChild(linkEl);
    }

    const imgCol = document.createElement('div');
    imgCol.className = `hover-info__img-col${hasImg ? '' : ' no-img'}`;
    if (hasImg) {
      const imgEl = document.createElement('img');
      imgEl.src = img;
      imgEl.alt = '';
      imgEl.loading = 'lazy';
      imgCol.appendChild(imgEl);
    }

    body.appendChild(textCol);
    body.appendChild(imgCol);

    const arrow = document.createElement('div');
    arrow.className = 'hover-info__arrow';
    arrow.setAttribute('aria-hidden', 'true');

    card.appendChild(closeBtn);
    card.appendChild(body);
    card.appendChild(arrow);

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

    hoverInfoRepositioners.push({ el, setPosition });

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
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      el.classList.remove('locked');
    });
  });

  if (!hoverInfoGlobalEventsBound) {
    hoverInfoGlobalEventsBound = true;

    const repositionActiveCards = () => {
      hoverInfoRepositioners.forEach(({ el, setPosition }) => {
        if (el.matches(':hover') || el.classList.contains('locked')) {
          setPosition();
        }
      });
    };

    window.addEventListener('resize', repositionActiveCards);
    window.addEventListener('scroll', repositionActiveCards, { passive: true });

    // Click anywhere outside a locked card to dismiss it
    document.addEventListener('click', e => {
      if (!e.target.closest('.hover-info')) {
        document.querySelectorAll('.hover-info.locked').forEach(node => {
          node.classList.remove('locked');
        });
      }
    });
  }
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHoverInfo);
} else {
  initHoverInfo();
}
