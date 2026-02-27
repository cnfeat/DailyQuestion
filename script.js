document.addEventListener('DOMContentLoaded', () => {
    initCardSystem();
    renderProgress();
});

// 系统初始化中枢
// 修复后的新代码
async function initCardSystem() {
    const now = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('gregorian-date').textContent = now.toLocaleDateString('zh-CN', dateOptions);

    // 极其关键的调序：先造出按钮的物理外壳，再进行数据渲染填入文字
    setupChangeButton();
    await loadCurrentCard();
}

// 极其严密的缓存读取逻辑
async function loadCurrentCard() {
    const todayStr = new Date().toLocaleDateString();
    let cache = JSON.parse(localStorage.getItem('dailyCardCache'));

    // 如果是新的一天，或者首次使用，彻底重置缓存矩阵
    if (!cache || cache.date !== todayStr) {
        cache = {
            date: todayStr,
            cards: [],
            currentIndex: 0
        };
        localStorage.setItem('dailyCardCache', JSON.stringify(cache));
    }

    if (cache.cards.length === 0) {
        await fetchNewCard(cache);
    } else {
        renderCard(cache.cards[cache.currentIndex], cache.currentIndex, cache.cards.length);
    }
}

// 向云端发起极其克制的网络请求
async function fetchNewCard(cache) {
    const questionDisplay = document.getElementById('question-display');
    const extensionDisplay = document.getElementById('extension-display');
    
    questionDisplay.textContent = '正在连接心智基站...';
    extensionDisplay.textContent = '';
    
    // 专属云端链接已锁定
    const workerUrl = 'https://daily-card-api.cnfeat.workers.dev';
    let viewedIds = JSON.parse(localStorage.getItem('viewedCards')) || [];
    
    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Geek-Token': 'source-surge-flow-2026'
            },
            body: JSON.stringify({ viewedIds: viewedIds })
        });

        if (!response.ok) throw new Error('节点连接阻断');
        const selectedCard = await response.json();

        // 去重记录
        if (viewedIds.includes(selectedCard.id) && viewedIds.length > 0) {
            viewedIds = [];
        }
        viewedIds.push(selectedCard.id);
        localStorage.setItem('viewedCards', JSON.stringify(viewedIds));

        // 将新获取的问题压入今天的缓存矩阵
        cache.cards.push(selectedCard);
        cache.currentIndex = cache.cards.length - 1;
        localStorage.setItem('dailyCardCache', JSON.stringify(cache));

        renderCard(selectedCard, cache.currentIndex, cache.cards.length);
    } catch (error) {
        questionDisplay.textContent = '失去与心智基站的连接';
        extensionDisplay.textContent = '请检查网络，或确认边缘节点是否正常运转。';
        console.error(error);
    }
}

// 纯粹的渲染逻辑
function renderCard(card, index, total) {
    document.getElementById('card-id').textContent = 'NO.' + card.id;
    document.getElementById('question-display').textContent = card.question;
    document.getElementById('extension-display').textContent = card.extension;
    
    const btn = document.getElementById('change-btn');
    if (btn) {
        if (total < 3) {
            btn.textContent = '换一问 (' + total + '/3)';
        } else {
            btn.textContent = '循环查看 (' + (index + 1) + '/3)';
        }
    }
}

// 核心交互：切换与上限拦截
async function handleChangeClick() {
    let cache = JSON.parse(localStorage.getItem('dailyCardCache'));
    if (!cache) return;

    if (cache.cards.length < 3) {
        // 名额未满，向云端索要新问题
        await fetchNewCard(cache);
    } else {
        // 名额已满，只在本地缓存中冷酷地循环
        cache.currentIndex = (cache.currentIndex + 1) % 3;
        localStorage.setItem('dailyCardCache', JSON.stringify(cache));
        renderCard(cache.cards[cache.currentIndex], cache.currentIndex, 3);
    }
}

// 极其隐蔽的交互按钮注入
function setupChangeButton() {
    let btn = document.getElementById('change-btn');
    if (!btn) {
        btn = document.createElement('div');
        btn.id = 'change-btn';
        
        // 极简的隐形按钮样式
        btn.style.cursor = 'pointer';
        btn.style.opacity = '0.3';
        btn.style.fontSize = '12px';
        btn.style.marginTop = '30px';
        btn.style.textAlign = 'right';
        btn.style.transition = 'opacity 0.3s';
        
        // 鼠标悬停时微微亮起
        btn.addEventListener('mouseover', () => btn.style.opacity = '0.8');
        btn.addEventListener('mouseout', () => btn.style.opacity = '0.3');
        
        const extensionDisplay = document.getElementById('extension-display');
        extensionDisplay.parentNode.appendChild(btn);
    }
    
    // 防止重复绑定点击事件
    btn.removeEventListener('click', handleChangeClick);
    btn.addEventListener('click', handleChangeClick);
}

// 时间方块矩阵渲染
function renderProgress() {
    const gridContainer = document.getElementById('time-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const isLeapYear = (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || (now.getFullYear() % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;

    for (let i = 1; i <= totalDays; i++) {
        const block = document.createElement('div');
        block.className = 'time-block';
        if (i <= dayOfYear) {
            block.classList.add('passed');
        }
        gridContainer.appendChild(block);
    }
}