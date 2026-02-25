// script.js - 核心引擎 (防重复算法 + 极其精准的卡片海报生成)

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
    let viewedIds = JSON.parse(localStorage.getItem('viewedCards')) || [];
    let unviewedCards = cardData.filter(card => !viewedIds.includes(card.id));

    if (unviewedCards.length === 0) {
        viewedIds = [];
        unviewedCards = cardData;
        console.log('所有问题已遍历完毕，极其圆满地开启新一轮轮回。');
    }

    const randomIndex = Math.floor(Math.random() * unviewedCards.length);
    const selectedCard = unviewedCards[randomIndex];

    viewedIds.push(selectedCard.id);
    localStorage.setItem('viewedCards', JSON.stringify(viewedIds));

    return selectedCard;
}

// 极其精准的卡片截屏逻辑
function downloadPoster() {
    const downloadBtn = document.getElementById('download-btn');
    
    // 渲染前瞬间隐身，保证输出的海报上没有这个突兀的按钮
    downloadBtn.style.display = 'none';

    // 极其关键：将镜头死死锁定在「卡片本体」上
    const cardElement = document.querySelector('.card');

    // 开始极其高清的捕获
    html2canvas(cardElement, {
        scale: 2, 
        backgroundColor: '#ffffff', // 强行锁定卡片本体的纯白底色
        useCORS: true
    }).then(canvas => {
        // 渲染完毕后极其迅速地恢复按钮显示
        downloadBtn.style.display = 'flex';
        
        // 转化为高清 PNG 并触发下载
        const link = document.createElement('a');
        const cardId = document.getElementById('card-id').textContent.replace('.', '_');
        const timestamp = new Date().getTime();
        
        link.download = `日课一问_${cardId}_${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
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

    const selectedCard = getRandomUnviewedCard();
    
    document.getElementById('card-id').textContent = 'NO.' + selectedCard.id;
    document.getElementById('question-display').textContent = selectedCard.question;
    document.getElementById('extension-display').textContent = selectedCard.extension;

    renderProgress();
}

// 页面加载执行
updateCard();

// 极其牢固地绑定点击下载事件
const downloadBtn = document.getElementById('download-btn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadPoster);
}