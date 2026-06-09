// 安装时打开仓库主页，引导用户了解产品
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: 'https://github.com/cnfeat/DailyQuestion#readme'
        }).catch(() => {});
    }
    if (details.reason === 'update') {
        // 更新时也可提醒
        const prev = details.previousVersion;
        if (prev && prev.startsWith('1.')) {
            chrome.tabs.create({
                url: 'https://github.com/cnfeat/DailyQuestion#readme'
            }).catch(() => {});
        }
    }
});

// 点击工具栏图标：打开新标签页
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'index.html' }).catch(() => {});
});
