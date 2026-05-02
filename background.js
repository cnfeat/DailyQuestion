// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({
            url: "https://www.yuque.com/hardwaylab/zzybgv/lgg21yyuagwbm6qt" 
        });
    }
});

// 监听工具栏图标点击
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: "index.html"
    });
});