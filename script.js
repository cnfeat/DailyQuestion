(function() {
'use strict';

// ═══ 安全模块：闭包内保存题库，外部不可访问 ═══
const OFFSET = 7;
const SECRET_KEY = [0x12, 0x34, 0x56];

// localStorage 简单混淆密钥（防随手翻看，不追求高强度）
const STORAGE_SALT = 0xA5;

let _pool = null;        // 仅闭包内可访问的题库
let _decrypted = false;  // 是否已解密

function _decryptPool() {
    if (_pool) return _pool;
    try {
        const obfuscated = window.__SECRET_BASE__;
        if (!obfuscated) throw new Error('题库数据缺失');
        
        const binaryString = atob(obfuscated);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            let temp = (binaryString.charCodeAt(i) - OFFSET + 256) % 256;
            bytes[i] = temp ^ SECRET_KEY[i % SECRET_KEY.length];
        }
        const decodedText = new TextDecoder('utf-8').decode(bytes);
        _pool = JSON.parse(decodedText);
        _decrypted = true;
        return _pool;
    } catch (e) {
        return null;
    }
}

// ═══ localStorage 混淆读写（防止随手翻 DevTools → Application → Local Storage） ═══
function _lsGet(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        // 简单异或 → Base64 解码 → JSON
        const decoded = atob(raw);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ STORAGE_SALT);
        }
        return JSON.parse(result);
    } catch (e) {
        return null;
    }
}

function _lsSet(key, value) {
    try {
        const json = JSON.stringify(value);
        let encoded = '';
        for (let i = 0; i < json.length; i++) {
            encoded += String.fromCharCode(json.charCodeAt(i) ^ STORAGE_SALT);
        }
        localStorage.setItem(key, btoa(encoded));
    } catch (e) {}
}

// ═══ 对外暴露的安全 API ═══
// 这些是闭包内函数映射到 window 上的唯一入口
const CardAPI = {
    isReady: function() { return _decrypted && _pool && _pool.length > 0; },
    totalCount: function() { return _pool ? _pool.length : 0; },
    
    // 按 ID 取单张卡（不暴露整池）
    getById: function(id) {
        if (!_pool) return null;
        return _pool.find(c => c.id === id) || null;
    },
    
    // 随机取一张未看过的卡
    drawUnseen: function(viewedIds) {
        if (!_pool) return null;
        const viewed = viewedIds || [];
        let available = _pool.filter(c => !viewed.includes(c.id));
        if (available.length === 0) return null; // 全部看过
        return available[Math.floor(Math.random() * available.length)];
    },
    
    resetViewed: function() { /* no-op, 由调用方管理 */ }
};

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
    _decryptPool();
    if (!CardAPI.isReady()) {
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
    let cache = _lsGet('_dq_cache');
    if (!cache || cache.date !== todayStr) {
        cache = { date: todayStr, ids: [], currentIndex: 0 };
    }
    if (cache.ids.length === 0) drawNewCard(cache);
    else {
        const card = CardAPI.getById(cache.ids[cache.currentIndex]);
        renderCard(card, cache.currentIndex, cache.ids.length);
    }
}

function drawNewCard(cache) {
    let viewed = _lsGet('_dq_viewed') || [];
    const card = CardAPI.drawUnseen(viewed);
    if (!card) {
        // 全部看过了，重置
        viewed = [];
        const retry = CardAPI.drawUnseen([]);
        if (!retry) return;
        viewed.push(retry.id);
        _lsSet('_dq_viewed', viewed);
        cache.ids.push(retry.id);
        cache.currentIndex = cache.ids.length - 1;
        _lsSet('_dq_cache', cache);
        renderCard(retry, cache.currentIndex, cache.ids.length);
        return;
    }
    viewed.push(card.id);
    _lsSet('_dq_viewed', viewed);
    cache.ids.push(card.id);
    cache.currentIndex = cache.ids.length - 1;
    _lsSet('_dq_cache', cache);
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
            let cache = _lsGet('_dq_cache');
            if (!cache) {
                cache = { date: new Date().toLocaleDateString(), ids: [], currentIndex: 0 };
            }
            if (cache.ids.length < 3) drawNewCard(cache);
            else {
                cache.currentIndex = (cache.currentIndex + 1) % cache.ids.length;
                _lsSet('_dq_cache', cache);
                const card = CardAPI.getById(cache.ids[cache.currentIndex]);
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
let _h2cLoaded = false;

function loadHtml2canvas() {
    return new Promise((resolve, reject) => {
        if (_h2cLoaded && typeof html2canvas !== 'undefined') {
            resolve();
            return;
        }
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
        html2canvas(card, { 
            scale: 2, 
            backgroundColor: '#f8f6f4', 
            useCORS: true,
            logging: false
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `日课一问_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(() => {
            alert('截图生成失败，请重试。');
        });
    };
}

// ═══ 启动 ═══
document.addEventListener('DOMContentLoaded', () => {
    initCardSystem();
    renderProgress();
    setupDownloadFeature();
});

})();
