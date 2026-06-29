const isArticlePage = window.location.pathname.includes('/articles/');
const rootPrefix = isArticlePage ? '../' : '';

const SETTINGS_KEYS = {
    theme: 'rosovo-theme'
};

const audioState = {
    audio: null,
    currentCard: null,
    volume: 0.8
};

document.addEventListener('DOMContentLoaded', async () => {
    setActiveNavLink();
    initNavEnhancements();
    initSettings();
    observeFadeInElements();
    ensureFooter();

    const entries = await loadEntries();
    if (entries.length) {
        renderHomeFeed(entries);
        renderArticlesFeed(entries);
        enhanceArticlePage(entries);
        setupMusicPlayers();
        observeFadeInElements();
    }
});

function setActiveNavLink() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = (link.getAttribute('href') || '').split('/').pop();
        if (href === path) {
            link.classList.add('active');
        }
    });
}

function initNavEnhancements() {
    document.querySelectorAll('nav').forEach(nav => {
        const navLinks = nav.querySelector('.nav-links');
        const logo = nav.querySelector('.logo');
        if (!navLinks || !logo) {
            return;
        }

        if (!nav.querySelector('.menu-toggle')) {
            const navLeft = document.createElement('div');
            navLeft.className = 'nav-left';

            const menuBtn = document.createElement('button');
            menuBtn.type = 'button';
            menuBtn.className = 'menu-toggle';
            menuBtn.setAttribute('aria-label', 'Toggle navigation');
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.textContent = '≡';

            menuBtn.addEventListener('click', () => {
                const open = nav.classList.toggle('nav-open');
                menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            });

            navLeft.appendChild(menuBtn);
            navLeft.appendChild(navLinks);
            nav.insertBefore(navLeft, logo);
        }

        let navRight = nav.querySelector('.nav-right');
        if (!navRight) {
            navRight = document.createElement('div');
            navRight.className = 'nav-right';
            nav.insertBefore(navRight, logo);
            navRight.appendChild(logo);
        }

        if (!nav.querySelector('.theme-toggle')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'theme-toggle';
            btn.setAttribute('aria-label', 'Switch to light mode');
            btn.setAttribute('aria-pressed', 'false');
            btn.setAttribute('data-theme-toggle', '');
            btn.textContent = '☾';
            navRight.appendChild(btn);
        }
    });
}

function initSettings() {
    const storedTheme = localStorage.getItem(SETTINGS_KEYS.theme);
    if (storedTheme === 'light') {
        document.body.setAttribute('data-theme', 'light');
    }

    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
        updateThemeToggle(button);
        button.addEventListener('click', () => {
            const nowLight = document.body.getAttribute('data-theme') !== 'light';
            if (nowLight) {
                document.body.setAttribute('data-theme', 'light');
                localStorage.setItem(SETTINGS_KEYS.theme, 'light');
            } else {
                document.body.removeAttribute('data-theme');
                localStorage.setItem(SETTINGS_KEYS.theme, 'dark');
            }
            document.querySelectorAll('[data-theme-toggle]').forEach(updateThemeToggle);
        });
    });
}

function updateThemeToggle(button) {
    const light = document.body.getAttribute('data-theme') === 'light';
    button.textContent = light ? '☀' : '☾';
    button.setAttribute('aria-pressed', light ? 'true' : 'false');
    button.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
}

function observeFadeInElements() {
    const elements = Array.from(document.querySelectorAll('.fade-in'));
    elements.forEach((el, index) => {
        if (!el.style.getPropertyValue('--fade-delay')) {
            el.style.setProperty('--fade-delay', `${Math.min(index * 70, 420)}ms`);
        }
    });

    if (!('IntersectionObserver' in window)) {
        elements.forEach(el => el.classList.add('in-view'));
        return;
    }

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            rootMargin: '0px 0px -8% 0px',
            threshold: 0.12
        }
    );

    elements.forEach(el => {
        if (!el.classList.contains('in-view')) {
            observer.observe(el);
        }
    });
}

function ensureFooter() {
    if (document.querySelector('.site-footer')) {
        return;
    }

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.textContent = `© ${new Date().getFullYear()} Rosovo. All rights reserved.`;
    document.body.appendChild(footer);
}

async function loadEntries() {
    try {
        const response = await fetch(`${rootPrefix}data/articles.json`, { cache: 'no-store' });
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            return [];
        }
        return data;
    } catch (_error) {
        return [];
    }
}

function renderHomeFeed(entries) {
    const container = document.querySelector('[data-home-feed]');
    if (!container) {
        return;
    }

    container.innerHTML = entries.map(entry => renderFeedEntry(entry, false)).join('');
}

function renderArticlesFeed(entries) {
    const container = document.querySelector('[data-articles-feed]');
    if (!container) {
        return;
    }

    const articleEntries = entries.filter(entry => entry.kind === 'article');
    container.innerHTML = articleEntries.map(entry => renderFeedEntry(entry, true)).join('');
}

function renderFeedEntry(entry, listOnlyArticles) {
    if (entry.kind === 'article') {
        return `
            <a href="${rootPrefix}${entry.path}" class="article-item fade-in">
                <span class="article-tag">${entry.tag}</span>
                <span class="article-title">${entry.title}</span>
                <span class="article-date">${entry.dateLabel}</span>
                <span class="article-arrow">→</span>
            </a>
        `;
    }

    if (entry.kind === 'note' && !listOnlyArticles) {
        return `
            <div class="article-item article-item--note fade-in">
                <span class="article-tag">${entry.tag}</span>
                <span class="article-title">${entry.title}</span>
                <span class="article-date">${entry.dateLabel}</span>
                <span class="article-arrow">☺</span>
            </div>
        `;
    }

    if (entry.kind === 'music' && !listOnlyArticles) {
        return `
            <div class="music-player fade-in" data-src="${rootPrefix}${entry.audioSrc}">
                <span class="article-tag">${entry.tag}</span>
                <div class="music-player__main">
                    <div class="music-player__title">${entry.title}</div>
                    <div class="music-player__sub">
                        <span class="music-player__audio-flag">Audio</span>
                        <span class="music-player__time">0:00 / 0:00</span>
                        <span class="article-date">${entry.dateLabel}</span>
                    </div>
                    <div class="music-player__progress">
                        <div class="music-player__wave"></div>
                        <div class="music-player__bar"></div>
                    </div>
                </div>
                <div class="music-player__controls">
                    <button class="music-player__play" type="button" aria-label="Play track">▶</button>
                    <input class="music-player__volume" type="range" min="0" max="1" step="0.01" value="0.8" aria-label="Volume" />
                </div>
            </div>
        `;
    }

    return '';
}

function setupMusicPlayers() {
    const cards = Array.from(document.querySelectorAll('.music-player'));
    if (!cards.length) {
        return;
    }

    if (!audioState.audio) {
        audioState.audio = document.createElement('audio');
        audioState.audio.preload = 'metadata';
        audioState.audio.volume = audioState.volume;
        document.body.appendChild(audioState.audio);
    }

    const audio = audioState.audio;

    const updateProgress = card => {
        const bar = card.querySelector('.music-player__bar');
        const time = card.querySelector('.music-player__time');
        if (!bar || !time) {
            return;
        }

        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
        const ratio = duration > 0 ? current / duration : 0;
        bar.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
        time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    };

    const setPlayingCard = card => {
        cards.forEach(item => {
            const playBtn = item.querySelector('.music-player__play');
            if (item === card) {
                item.classList.add('is-playing');
                if (playBtn) {
                    playBtn.textContent = '❚❚';
                }
            } else {
                item.classList.remove('is-playing');
                if (playBtn) {
                    playBtn.textContent = '▶';
                }
                const bar = item.querySelector('.music-player__bar');
                const time = item.querySelector('.music-player__time');
                if (bar) {
                    bar.style.width = '0%';
                }
                if (time) {
                    time.textContent = '0:00 / 0:00';
                }
            }
        });
        document.body.classList.toggle('music-active', Boolean(card));
    };

    cards.forEach(card => {
        const playBtn = card.querySelector('.music-player__play');
        const volume = card.querySelector('.music-player__volume');
        const progress = card.querySelector('.music-player__progress');
        const src = card.dataset.src;

        if (volume) {
            volume.value = String(audioState.volume);
            volume.addEventListener('input', () => {
                audioState.volume = Number(volume.value);
                audio.volume = audioState.volume;
            });
        }

        if (playBtn) {
            playBtn.addEventListener('click', async event => {
                event.stopPropagation();
                if (!src) {
                    return;
                }

                const sameTrack = audioState.currentCard === card;
                if (sameTrack && !audio.paused) {
                    audio.pause();
                    setPlayingCard(null);
                    return;
                }

                if (audio.src !== new URL(src, window.location.href).href) {
                    audio.src = src;
                    audio.currentTime = 0;
                }

                audioState.currentCard = card;
                try {
                    await audio.play();
                    setPlayingCard(card);
                    updateProgress(card);
                } catch (_error) {
                    setPlayingCard(null);
                }
            });
        }

        if (progress) {
            progress.addEventListener('click', event => {
                if (audioState.currentCard !== card || !Number.isFinite(audio.duration) || audio.duration <= 0) {
                    return;
                }
                const rect = progress.getBoundingClientRect();
                const ratio = (event.clientX - rect.left) / rect.width;
                audio.currentTime = Math.max(0, Math.min(audio.duration, ratio * audio.duration));
                updateProgress(card);
            });
        }
    });

    audio.addEventListener('timeupdate', () => {
        if (audioState.currentCard) {
            updateProgress(audioState.currentCard);
        }
    });

    audio.addEventListener('ended', () => {
        setPlayingCard(null);
        audioState.currentCard = null;
    });
}

function formatTime(seconds) {
    const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const mins = Math.floor(total / 60);
    const secs = String(total % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

function enhanceArticlePage(entries) {
    if (!isArticlePage) {
        return;
    }

    const body = document.querySelector('.article-body');
    const meta = document.querySelector('.article-meta');
    if (body && meta && !meta.querySelector('.reading-time')) {
        const words = body.textContent.trim().split(/\s+/).filter(Boolean).length;
        const minutes = Math.max(1, Math.round(words / 225));
        const node = document.createElement('span');
        node.className = 'reading-time';
        node.textContent = `· ${minutes} min read`;
        meta.appendChild(node);
    }

    const articleEntries = entries.filter(entry => entry.kind === 'article');
    const currentPath = window.location.pathname.replace(/^\//, '');
    const currentIndex = articleEntries.findIndex(entry => entry.path === currentPath);
    if (currentIndex < 0) {
        return;
    }

    const newer = articleEntries[currentIndex - 1] || null;
    const older = articleEntries[currentIndex + 1] || null;

    let nav = document.querySelector('[data-article-nav]');
    const backLink = document.querySelector('.back-link');
    if (!nav && backLink) {
        nav = document.createElement('div');
        nav.className = 'article-nav fade-in';
        nav.setAttribute('data-article-nav', '');
        backLink.parentElement.insertBefore(nav, backLink);
    }

    if (!nav) {
        return;
    }

    nav.innerHTML = `
        ${newer ? articleNavLink('Newer', newer) : ''}
        ${older ? articleNavLink('Older', older) : ''}
    `;
}

function articleNavLink(label, entry) {
    const localHref = entry.path.split('/').pop();
    const arrow = label === 'Newer' ? '←' : '→';
    return `
        <a href="${localHref}">
            <span class="article-nav-label" data-arrow="${arrow}">${label} Article</span>
            <span class="article-nav-title">${entry.title}</span>
        </a>
    `;
}