document.addEventListener('DOMContentLoaded', () => {
    initCardSystem();
    renderProgress();
    setupDownloadFeature();
});

let memoryCardPool = null;

// 核心配置：必须与 build.js 中的参数完全一致[cite: 6, 8]
const OFFSET = 7;
const SECRET_KEY = [0x12, 0x34, 0x56]; // 多位循环密钥

// 核心：执行解密引擎，支持多重加固逻辑与本地缓存覆盖
function getDecryptedCards() {
    if (memoryCardPool) return memoryCardPool;

    // 1. 优先从浏览器修改后的缓存读取[cite: 6]
    const localSaved = localStorage.getItem('local_test_question_pool');
    if (localSaved) {
        try {
            memoryCardPool = JSON.parse(localSaved);
            return memoryCardPool;
        } catch (e) { console.error("缓存解析失败"); }
    }

    // 2. 执行加固版二进制解密逻辑[cite: 6, 8]
    try {
        const obfuscated = window.__SECRET_BASE__;
        if (!obfuscated) return [];
        
        // 将 Base64 还原为二进制字符串
        const binaryString = atob(obfuscated);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            // 第一步：逆转二进制偏移（+256 确保模运算结果为正）
            let temp = (binaryString.charCodeAt(i) - OFFSET + 256) % 256;
            // 第二步：逆转循环异或[cite: 8]
            bytes[i] = temp ^ SECRET_KEY[i % SECRET_KEY.length];
        }
        
        // 关键修复：使用 TextDecoder 以 utf-8 编码解码，解决中文乱码问题[cite: 6]
        const decodedText = new TextDecoder('utf-8').decode(bytes);
        memoryCardPool = JSON.parse(decodedText);
        return memoryCardPool;
    } catch (e) { 
        console.error("解密引擎执行失败，请检查 data.js 是否由最新版 build.js 生成", e);
        return []; 
    }
}

function initCardSystem() {
    const now = new Date();
    const dateElement = document.getElementById('gregorian-date');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    }
    setupChangeButton(); 
    loadCurrentCard();
}

function loadCurrentCard() {
    const todayStr = new Date().toLocaleDateString();
    let cache;
    try {
        cache = JSON.parse(localStorage.getItem('dailyCardCache'));
    } catch (e) {
        cache = null;
    }
    if (!cache || cache.date !== todayStr) {
        cache = { date: todayStr, cards: [], currentIndex: 0 };
    }
    if (cache.cards.length === 0) drawNewCard(cache);
    else renderCard(cache.cards[cache.currentIndex], cache.currentIndex, cache.cards.length);
}

function drawNewCard(cache) {
    const pool = getDecryptedCards();
    if (pool.length === 0) return;
    let viewed;
    try {
        viewed = JSON.parse(localStorage.getItem('viewedCards'));
    } catch (e) {
        viewed = null;
    }
    viewed = viewed || [];
    let available = pool.filter(c => !viewed.includes(c.id));
    if (available.length === 0) { viewed = []; available = pool; }
    const card = available[Math.floor(Math.random() * available.length)];
    viewed.push(card.id);
    localStorage.setItem('viewedCards', JSON.stringify(viewed));
    cache.cards.push(card);
    cache.currentIndex = cache.cards.length - 1;
    localStorage.setItem('dailyCardCache', JSON.stringify(cache));
    renderCard(card, cache.currentIndex, cache.cards.length);
}

function renderCard(card, index, total) {
    if (!card) return;
    const idEl = document.getElementById('card-id');
    const qEl = document.getElementById('question-display');
    const eEl = document.getElementById('extension-display');
    
    if (idEl) idEl.textContent = 'NO.' + card.id;
    if (qEl) qEl.textContent = card.question;
    if (eEl) eEl.textContent = card.extension;
    
    const btn = document.getElementById('change-btn');
    if (btn) btn.textContent = total >= 3 ? `循环查看 (${index + 1}/3)` : `换一问 (${total}/3)`;
}

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
            try {
                cache = JSON.parse(localStorage.getItem('dailyCardCache'));
            } catch (e) {
                cache = { date: new Date().toLocaleDateString(), cards: [], currentIndex: 0 };
            }
            if (cache.cards.length < 3) drawNewCard(cache);
            else {
                cache.currentIndex = (cache.currentIndex + 1) % cache.cards.length;
                localStorage.setItem('dailyCardCache', JSON.stringify(cache));
                renderCard(cache.cards[cache.currentIndex], cache.currentIndex, cache.cards.length);
            }
        };
    }
}

function renderProgress() {
    const grid = document.getElementById('progress-grid');
    const txt = document.getElementById('progress-text');
    if (!grid || !txt) return;

    const now = new Date();
    const year = now.getFullYear();

    // 从当年 1 月 1 日开始计算，更直观
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;

    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const totalDays = isLeap ? 366 : 365;

    txt.textContent = `今天是 ${year} 年的第 ${dayOfYear} 天，进度 ${((dayOfYear / totalDays) * 100).toFixed(1)}%`;

    // 动态计算网格列数，闰年 366 天用 61×6，平年 365 天用 73×5
    const cols = totalDays <= 365 ? 73 : 61;
    const rows = Math.ceil(totalDays / cols);
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // 使用 DocumentFragment 批量创建 DOM，减少回流
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= totalDays; i++) {
        const cell = document.createElement('div');
        cell.className = 'progress-cell' + (i <= dayOfYear ? ' filled' : '');
        fragment.appendChild(cell);
    }
    grid.appendChild(fragment);
}

function setupDownloadFeature() {
    const btn = document.getElementById('download-btn');
    if (!btn) return;
    btn.onclick = function() {
        if (typeof html2canvas === 'undefined') {
            console.error("html2canvas 未加载");
            return;
        }
        const card = document.getElementById('daily-card');
        html2canvas(card, { 
            scale: 2, 
            backgroundColor: "#f8f6f4", 
            useCORS: true,
            logging: false
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `日课一问_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            console.error("截图失败:", err);
            alert("截图生成失败，请重试。");
        });
    };
}