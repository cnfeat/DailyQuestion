// script.js - 核心引擎 (防重复记忆算法版)

function renderProgress() {
    const now = new Date();
    const year = now.getFullYear();
    
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;

    const startOfYear = new Date(year, 0, 0);
    const diff = now - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const firstDayOfYear = new Date(year, 0, 1);
    const firstDayWeekday = firstDayOfYear.getDay() === 0 ? 7 : firstDayOfYear.getDay();
    const weekOfYear = Math.ceil((dayOfYear + firstDayWeekday - 1) / 7);

    const percentage = ((dayOfYear / totalDays) * 100).toFixed(1);

    const progressText = document.getElementById('progress-text');
    if (progressText) {
        progressText.textContent = `今天是 ${year} 年的第 ${dayOfYear} 天，第 ${weekOfYear} 周的第 ${dayOfWeek} 天，全年进度 ${percentage}%`;
    }

    const progressGrid = document.getElementById('progress-grid');
    if (progressGrid) {
        progressGrid.innerHTML = ''; 
        for (let i = 1; i <= totalDays; i++) {
            const cell = document.createElement('div');
            cell.className = 'progress-cell';
            if (i <= dayOfYear) {
                cell.classList.add('filled');
            }
            progressGrid.appendChild(cell);
        }
    }
}

// 极其智能的防重复抽取算法
function getRandomUnviewedCard() {
    // 1. 获取已看过的卡片 ID 列表
    let viewedIds = JSON.parse(localStorage.getItem('viewedCards')) || [];

    // 2. 筛选出还没看过的卡片
    let unviewedCards = cardData.filter(card => !viewedIds.includes(card.id));

    // 3. 如果所有卡片都看过了，极其优雅地重置记忆，开启新一轮轮回
    if (unviewedCards.length === 0) {
        viewedIds = [];
        unviewedCards = cardData;
        // 在后台静静留下一条轮回记录
        console.log('所有问题已遍历完毕，极其圆满地开启新一轮轮回。');
    }

    // 4. 从没看过的卡片中极其随机地抽取一张
    const randomIndex = Math.floor(Math.random() * unviewedCards.length);
    const selectedCard = unviewedCards[randomIndex];

    // 5. 将这张新卡片的 ID 极其稳固地存入本地浏览器记忆
    viewedIds.push(selectedCard.id);
    localStorage.setItem('viewedCards', JSON.stringify(viewedIds));

    return selectedCard;
}

function updateCard() {
    const now = new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('gregorian-date').textContent = now.toLocaleDateString('zh-CN', dateOptions);

    if (typeof cardData === 'undefined' || cardData.length === 0) {
        document.getElementById('question-display').textContent = '题库加载异常...';
        document.getElementById('extension-display').textContent = '请检查 data.js 文件。';
        return;
    }

    // 调用防重复算法获取卡片
    const selectedCard = getRandomUnviewedCard();
    
    document.getElementById('card-id').textContent = 'NO.' + selectedCard.id;
    document.getElementById('question-display').textContent = selectedCard.question;
    document.getElementById('extension-display').textContent = selectedCard.extension;

    renderProgress();
}

updateCard();