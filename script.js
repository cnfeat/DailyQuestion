document.addEventListener('DOMContentLoaded', () => {
    initCardSystem();
    renderProgress();
    setupDownloadFeature();
});

let memoryCardPool = null;

// 二进制解密引擎
function getDecryptedCards() {
    if (memoryCardPool) return memoryCardPool;
    try {
        const obfuscated = window.__SECRET_BASE__;
        if (!obfuscated) return [];
        const binaryString = atob(obfuscated);
        const bytes = new Uint8Array(binaryString.length);
        const offset = 7;
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = (binaryString.charCodeAt(i) - offset + 256) % 256;
        }
        memoryCardPool = JSON.parse(new TextDecoder().decode(bytes));
        return memoryCardPool;
    } catch (e) { return []; }
}

function initCardSystem() {
    const now = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateEl = document.getElementById('gregorian-date');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('zh-CN', dateOptions);
    
    setupChangeButton(); 
    loadCurrentCard();
}

function loadCurrentCard() {
    const todayStr = new Date().toLocaleDateString();
    let cache = JSON.parse(localStorage.getItem('dailyCardCache'));

    if (!cache || cache.date !== todayStr) {
        cache = { date: todayStr, cards: [], currentIndex: 0 };
        localStorage.setItem('dailyCardCache', JSON.stringify(cache));
    }

    if (cache.cards.length === 0) {
        drawNewCard(cache);
    } else {
        renderCard(cache.cards[cache.currentIndex], cache.currentIndex, cache.cards.length);
    }
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
    document.getElementById('card-id').textContent = 'NO.' + card.id;
    document.getElementById('question-display').textContent = card.question;
    document.getElementById('extension-display').textContent = card.extension;
    
    const btn = document.getElementById('change-btn');
    if (btn) {
        if (total < 3) {
            btn.textContent = `换一问 (${total}/3)`;
        } else {
            btn.textContent = `循环查看 (${index + 1}/3)`;
        }
    }
}

function setupChangeButton() {
    let btn = document.getElementById('change-btn');
    if (!btn) {
        btn = document.createElement('div');
        btn.id = 'change-btn';
        btn.style = 'cursor:pointer; opacity:0.3; font-size:12px; margin-top:20px; text-align:right; transition:0.3s; height: 18px; line-height: 18px;';
        btn.onmouseover = () => btn.style.opacity = '0.8';
        btn.onmouseout = () => btn.style.opacity = '0.3';
        document.getElementById('extension-display').after(btn);
    }
    
    btn.onclick = () => {
        let cache = JSON.parse(localStorage.getItem('dailyCardCache'));
        if (cache.cards.length < 3) {
            drawNewCard(cache);
        } else {
            cache.currentIndex = (cache.currentIndex + 1) % 3;
            localStorage.setItem('dailyCardCache', JSON.stringify(cache));
            renderCard(cache.cards[cache.currentIndex], cache.currentIndex, 3);
        }
    };
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
    const percentage = ((dayOfYear / totalDays) * 100).toFixed(1);

    // 计算周数逻辑
    const firstDayOfYear = new Date(year, 0, 1);
    const dayOfWeekOffset = firstDayOfYear.getDay() || 7; 
    const weekOfYear = Math.ceil((dayOfYear + dayOfWeekOffset - 1) / 7);
    const dayOfWeek = now.getDay() || 7;

    // 恢复复杂的文字描述
    txt.textContent = `今天是 ${year} 年的第 ${dayOfYear} 天，第 ${weekOfYear} 周的第 ${dayOfWeek} 天，全年进度 ${percentage}%`;
    
    for (let i = 1; i <= totalDays; i++) {
        const cell = document.createElement('div');
        cell.className = 'progress-cell' + (i <= dayOfYear ? ' filled' : '');
        grid.appendChild(cell);
    }
}

function setupDownloadFeature() {
    const btn = document.getElementById('download-btn');
    if (btn) {
        btn.onclick = () => {
            html2canvas(document.getElementById('daily-card'), { scale: 2 }).then(canvas => {
                const link = document.createElement('a');
                link.download = `日课一问_${new Date().getTime()}.png`;
                link.href = canvas.toDataURL();
                link.click();
            });
        };
    }
}