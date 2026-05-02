document.addEventListener('DOMContentLoaded', () => {
    initCardSystem();
    renderProgress();
    setupDownloadFeature();
    setupJumpFeature();
    
    // 增加容错检查，防止 HTML 元素不存在时报错
    const saveBtn = document.getElementById('save-local-btn');
    if (saveBtn) saveBtn.onclick = saveCurrentEdit;

    const refreshBtn = document.getElementById('refresh-batch-btn');
    if (refreshBtn) refreshBtn.onclick = refreshBatch;

    const exportBtn = document.getElementById('export-file-btn');
    if (exportBtn) exportBtn.onclick = exportToFile;
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

// 导出功能：同步更新加密逻辑，确保导出的文件能被自身读取[cite: 6, 8]
function exportToFile() {
    const pool = getDecryptedCards();
    const jsonStr = JSON.stringify(pool);
    // 使用 TextEncoder 处理 UTF-8 字符
    const encoder = new TextEncoder();
    const bytes = encoder.encode(jsonStr);
    
    let encrypted = "";
    for (let i = 0; i < bytes.length; i++) {
        // 第一步：执行循环异或[cite: 8]
        let processed = bytes[i] ^ SECRET_KEY[i % SECRET_KEY.length];
        // 第二步：执行二进制偏移并转为字符[cite: 8]
        encrypted += String.fromCharCode((processed + OFFSET) % 256);
    }
    
    // 转为 Base64 存储
    const base64Data = btoa(encrypted);
    const fileContent = `window.__SECRET_BASE__ = "${base64Data}";`;
    
    const blob = new Blob([fileContent], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.js";
    link.click();
    URL.revokeObjectURL(url);
    alert("加固版 data.js 已生成，替换后提交审核即可");
}

function saveCurrentEdit() {
    const cardIdElement = document.getElementById('card-id');
    if (!cardIdElement) return;
    
    const currentId = cardIdElement.textContent.replace('NO.', '');
    const pool = getDecryptedCards();
    const cardIndex = pool.findIndex(c => c.id == currentId);
    
    if (cardIndex !== -1) {
        pool[cardIndex].question = document.getElementById('question-display').innerText;
        pool[cardIndex].extension = document.getElementById('extension-display').innerText;
        
        localStorage.setItem('local_test_question_pool', JSON.stringify(pool));
        
        let cache = JSON.parse(localStorage.getItem('dailyCardCache'));
        if (cache && cache.cards) {
            const dailyIdx = cache.cards.findIndex(c => c.id == currentId);
            if (dailyIdx !== -1) {
                cache.cards[dailyIdx] = {...pool[cardIndex]};
                localStorage.setItem('dailyCardCache', JSON.stringify(cache));
            }
        }
        alert("修改已存入缓存（点击 EXPORT 可生成加固文件）");
    }
}

function setupJumpFeature() {
    const input = document.getElementById('jump-input');
    if (!input) return;
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const targetId = input.value.trim().padStart(3, '0');
            const pool = getDecryptedCards();
            const card = pool.find(c => c.id === targetId);
            if (card) {
                const todayStr = new Date().toLocaleDateString();
                let cache = { date: todayStr, cards: [card], currentIndex: 0 };
                localStorage.setItem('dailyCardCache', JSON.stringify(cache));
                renderCard(card, 0, 1);
                input.value = '';
            }
        }
    });
}

function refreshBatch() {
    const pool = getDecryptedCards();
    const todayStr = new Date().toLocaleDateString();
    let newCards = [];
    let tempPool = [...pool];
    for (let i = 0; i < 3; i++) {
        if (tempPool.length === 0) break;
        const randomIndex = Math.floor(Math.random() * tempPool.length);
        newCards.push(tempPool.splice(randomIndex, 1)[0]);
    }
    let cache = { date: todayStr, cards: newCards, currentIndex: 0 };
    localStorage.setItem('dailyCardCache', JSON.stringify(cache));
    renderCard(newCards[0], 0, 3);
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
    let cache = JSON.parse(localStorage.getItem('dailyCardCache'));
    if (!cache || cache.date !== todayStr) {
        cache = { date: todayStr, cards: [], currentIndex: 0 };
    }
    if (cache.cards.length === 0) drawNewCard(cache);
    else renderCard(cache.cards[cache.currentIndex], cache.currentIndex, cache.cards.length);
}

function drawNewCard(cache) {
    const pool = getDecryptedCards();
    if (pool.length === 0) return;
    let viewed = JSON.parse(localStorage.getItem('viewedCards')) || [];
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
        btn.style = 'cursor:pointer; opacity:0.3; font-size:12px; margin-top:20px; text-align:right; transition:0.3s; height: 18px; line-height: 18px;';
        displayEl.after(btn);
    }
    if (btn) {
        btn.onclick = () => {
            let cache = JSON.parse(localStorage.getItem('dailyCardCache'));
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
    grid.innerHTML = '';
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const totalDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
    txt.textContent = `今天是 ${year} 年的第 ${dayOfYear} 天，进度 ${((dayOfYear / totalDays) * 100).toFixed(1)}%`;
    for (let i = 1; i <= totalDays; i++) {
        const cell = document.createElement('div');
        cell.className = 'progress-cell' + (i <= dayOfYear ? ' filled' : '');
        grid.appendChild(cell);
    }
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
        });
    };
}