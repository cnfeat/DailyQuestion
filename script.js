document.addEventListener('DOMContentLoaded', () => {
    initCardSystem();
    renderProgress();
    setupDownloadFeature();
    setupImportFeature();
});

let _h2cLoaded = false;

// ═══ 题库（明文，开源免费） ═══
function getCards() {
    const custom = getCustomCards();
    if (custom && custom.length > 0) return custom;
    return window.__QUESTIONS__ || [];
}

function getCustomCards() {
    try {
        const raw = localStorage.getItem('_dq_custom_cards');
        if (!raw) return null;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr) || arr.length === 0) return null;
        return arr;
    } catch (e) { return null; }
}

function hasCustomCards() {
    return !!getCustomCards();
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
        const weekNum = getWeekNumber(now);
        dateElement.textContent = now.toLocaleDateString('zh-CN', { 
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
        }) + ' · 第' + weekNum + '周';
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

// ═══ ISO 周数 ═══
function getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
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
        // 等待所有字体（含 Google Fonts）完全加载后再截图，避免导出后字体变化
        await document.fonts.ready;
        const card = document.getElementById('daily-card');
        html2canvas(card, { scale: 3, backgroundColor: '#faf8f5', useCORS: true, logging: false })
            .then(canvas => {
                const link = document.createElement('a');
                link.download = `日课一问_${new Date().getTime()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            })
            .catch(() => { alert('截图生成失败，请重试。'); });
    };
}

// ═══ 自定义题库导入 ═══
function setupImportFeature() {
    const trigger = document.getElementById('import-trigger');
    const footerBtn = document.getElementById('import-footer');
    const input = document.getElementById('import-input');
    if (!trigger || !input) return;

    updateImportIndicator();

    const doImport = () => {
        if (hasCustomCards()) {
            resetToDefault();
        } else {
            input.click();
        }
    };

    trigger.onclick = doImport;
    if (footerBtn) footerBtn.onclick = doImport;

    // 文件选择
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = importCards(ev.target.result);
            if (result.success) {
                showToast(`已导入 ${result.count} 道题目`);
                reloadCardSystem();
            } else {
                showToast(result.error, true);
            }
        };
        reader.onerror = () => { showToast('文件读取失败，请重试。', true); };
        reader.readAsText(file);

        // 重置 input，允许重复选同一个文件
        input.value = '';
    };
}

function validateCards(arr) {
    if (!Array.isArray(arr)) return { valid: false, error: '文件格式错误：应为 JSON 数组。' };
    if (arr.length === 0) return { valid: false, error: '题库为空，请至少包含 1 道题目。' };
    if (arr.length > 2000) return { valid: false, error: '题库过大（最多 2000 道）。' };

    const issues = [];
    for (let i = 0; i < arr.length; i++) {
        const c = arr[i];
        if (!c || typeof c !== 'object') { issues.push(`第 ${i + 1} 项不是对象`); continue; }
        if (!c.question || typeof c.question !== 'string' || c.question.trim() === '') {
            issues.push(`第 ${i + 1} 项缺少 question 字段`);
        }
        if (c.id === undefined && c.id !== 0) {
            // 自动补 id
            c.id = i + 1;
        }
        if (!c.extension) c.extension = '';
    }

    if (issues.length > 0) {
        return { valid: false, error: `校验失败：${issues.slice(0, 3).join('；')}${issues.length > 3 ? '...' : ''}` };
    }
    return { valid: true, count: arr.length };
}

function importCards(jsonStr) {
    let arr;
    try {
        arr = JSON.parse(jsonStr);
    } catch (e) {
        return { success: false, error: 'JSON 解析失败：请检查文件格式。' };
    }

    const validation = validateCards(arr);
    if (!validation.valid) return { success: false, error: validation.error };

    localStorage.setItem('_dq_custom_cards', JSON.stringify(arr));
    // 清除当日缓存，让新题库生效
    localStorage.removeItem('_dq_cache');
    localStorage.removeItem('_dq_viewed');

    return { success: true, count: validation.count };
}

function resetToDefault() {
    localStorage.removeItem('_dq_custom_cards');
    localStorage.removeItem('_dq_cache');
    localStorage.removeItem('_dq_viewed');
    updateImportIndicator();
    reloadCardSystem();
    showToast('已恢复默认题库');
}

function updateImportIndicator() {
    const trigger = document.getElementById('import-trigger');
    const footerBtn = document.getElementById('import-footer');
    if (hasCustomCards()) {
        if (trigger) {
            trigger.textContent = '\u21BA';
            trigger.classList.add('custom-active');
            trigger.title = '恢复默认题库';
        }
        if (footerBtn) {
            footerBtn.textContent = '↺ 恢复默认题库';
            footerBtn.title = '恢复默认题库';
        }
    } else {
        if (trigger) {
            trigger.textContent = '+';
            trigger.classList.remove('custom-active');
            trigger.title = '导入自定义题库';
        }
        if (footerBtn) {
            footerBtn.textContent = '🎨 导入题库';
            footerBtn.title = '导入自定义题库';
        }
    }
}

function reloadCardSystem() {
    updateImportIndicator();
    initCardSystem();
}

function showToast(msg, isError) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // 清除之前的定时器
    if (toast._timer) clearTimeout(toast._timer);
    if (toast._hideTimer) clearTimeout(toast._hideTimer);

    toast.textContent = msg;
    toast.style.background = isError ? '#8b3a3a' : 'var(--ink-primary)';
    toast.classList.remove('hide');
    toast.classList.add('show');

    toast._timer = setTimeout(() => {
        toast.classList.add('hide');
        toast._hideTimer = setTimeout(() => {
            toast.classList.remove('show', 'hide');
        }, 300);
    }, 3000);
}
