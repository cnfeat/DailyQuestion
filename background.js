// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({
            url: "https://www.cnfeat.com/"
        }).catch(err => {
            console.error("打开安装引导页失败:", err);
        });
    }
});

// 监听工具栏图标点击
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: "index.html"
    }).catch(err => {
        console.error("打开新标签页失败:", err);
    });
});