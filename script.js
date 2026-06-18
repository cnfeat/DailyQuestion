document.addEventListener('DOMContentLoaded', () => {
    initCardSystem();
    renderProgress();
    setupDownloadFeature();
});

let _h2cLoaded = false;

// ═══ 题库（明文，开源免费） ═══
function getCards() {
    return window.__QUESTIONS__ || [];
}

// ═══ 错误降级 ═══
function showErrorState() {
    const normal = document.getElementById('normal-state');
    const error = document.getElementById('error-state');
    if (normal) normal.style.display = 'none';
    if (error) error.classList.add('show');
}

function showNormalState() {
    const normal = document.getElementById('normal-state');
    const error = document.getElementById('error-state');
    if (normal) normal.style.display = '';
    if (error) error.classList.remove('show');
}

// ═══ 卡片系统 ═══
function initCardSystem() {
    const pool = getCards();
    if (!pool || pool.length === 0) {
        showErrorState();
        return;
    }
    showNormalState();

    const now = new Date();
    const dateElement = document.getElementById('gregorian-date');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('zh-CN', { 
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
        });
    }
    setupChangeButton(); 
    loadCurrentCard();
}

function loadCurrentCard() {
    const todayStr = new Date().toLocaleDateString();
    let cache;
    try {
        cache = JSON.parse(localStorage.getItem('_dq_cache'));
    } catch (e) { cache = null; }
    if (!cache || cache.date !== todayStr) {
        cache = { date: todayStr, ids: [], currentIndex: 0 };
    }
    if (cache.ids.length === 0) drawNewCard(cache);
    else {
        const card = getCards().find(c => c.id === cache.ids[cache.currentIndex]);
        renderCard(card, cache.currentIndex, cache.ids.length);
    }
}

function drawNewCard(cache) {
    const pool = getCards();
    if (pool.length === 0) return;
    let viewed;
    try { viewed = JSON.parse(localStorage.getItem('_dq_viewed')); } catch (e) { viewed = null; }
    viewed = viewed || [];
    let available = pool.filter(c => !viewed.includes(c.id));
    if (available.length === 0) { viewed = []; available = pool; }
    const card = available[Math.floor(Math.random() * available.length)];
    viewed.push(card.id);
    localStorage.setItem('_dq_viewed', JSON.stringify(viewed));
    cache.ids.push(card.id);
    cache.currentIndex = cache.ids.length - 1;
    localStorage.setItem('_dq_cache', JSON.stringify(cache));
    renderCard(card, cache.currentIndex, cache.ids.length);
}

function renderCard(card, index, total) {
    if (!card) return;
    const idEl = document.getElementById('card-id');
    const qEl = document.getElementById('question-display');
    const eEl = document.getElementById('extension-display');
    
    if (idEl) idEl.textContent = 'NO.' + card.id;
    if (qEl) qEl.textContent = card.question;
    if (eEl) eEl.textContent = card.extension;
    
    updateButtonLabel(index, total);
}

function updateButtonLabel(index, total) {
    const btn = document.getElementById('change-btn');
    if (!btn) return;
    if (total >= 3) {
        btn.textContent = `已抽满 3 题 · 循环回顾 (${index + 1}/3)`;
    } else {
        btn.textContent = `换一题 (${total}/3，今日还能抽 ${3 - total} 题)`;
    }
}

// ═══ 换题按钮 ═══
function setupChangeButton() {
    let btn = document.getElementById('change-btn');
    const displayEl = document.getElementById('extension-display');
    if (!btn && displayEl) {
        btn = document.createElement('div');
        btn.id = 'change-btn';
        displayEl.after(btn);
    }
    if (btn) {
        btn.onclick = () => {
            let cache;
            try { cache = JSON.parse(localStorage.getItem('_dq_cache')); } catch (e) { cache = null; }
            if (!cache) { cache = { date: new Date().toLocaleDateString(), ids: [], currentIndex: 0 }; }
            if (cache.ids.length < 3) drawNewCard(cache);
            else {
                cache.currentIndex = (cache.currentIndex + 1) % cache.ids.length;
                localStorage.setItem('_dq_cache', JSON.stringify(cache));
                const card = getCards().find(c => c.id === cache.ids[cache.currentIndex]);
                renderCard(card, cache.currentIndex, cache.ids.length);
            }
        };
    }
}

// ═══ 年度进度矩阵 ═══
function renderProgress() {
    const grid = document.getElementById('progress-grid');
    const txt = document.getElementById('progress-text');
    if (!grid || !txt) return;

    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const totalDays = isLeap ? 366 : 365;

    txt.textContent = `今天是 ${year} 年的第 ${dayOfYear} 天，进度 ${((dayOfYear / totalDays) * 100).toFixed(1)}%`;

    const cols = totalDays <= 365 ? 73 : 61;
    const rows = Math.ceil(totalDays / cols);
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= totalDays; i++) {
        const cell = document.createElement('div');
        cell.className = 'progress-cell' + (i <= dayOfYear ? ' filled' : '');
        fragment.appendChild(cell);
    }
    grid.appendChild(fragment);
}

// ═══ 下载功能（html2canvas 懒加载） ═══
function loadHtml2canvas() {
    return new Promise((resolve, reject) => {
        if (_h2cLoaded && typeof html2canvas !== 'undefined') { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'html2canvas.min.js';
        script.onload = () => { _h2cLoaded = true; resolve(); };
        script.onerror = () => reject(new Error('html2canvas 加载失败'));
        document.head.appendChild(script);
    });
}

function setupDownloadFeature() {
    const btn = document.getElementById('download-btn');
    if (!btn) return;
    btn.onclick = async function() {
        try { await loadHtml2canvas(); } catch (e) {
            alert('截图组件加载失败，请刷新后重试。');
            return;
        }
        const card = document.getElementById('daily-card');
        html2canvas(card, { scale: 2, backgroundColor: '#f8f6f4', useCORS: true, logging: false })
            .then(canvas => {
                const link = document.createElement('a');
                link.download = `日课一问_${new Date().getTime()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            })
            .catch(() => { alert('截图生成失败，请重试。'); });
    };
}
