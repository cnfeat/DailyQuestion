// 监听插件安装或更新事件
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        // 用户第一次安装成功后，自动打开指定的网址
        chrome.tabs.create({
            url: "https://www.yuque.com/hardwaylab/zzybgv/lgg21yyuagwbm6qt" 
        });
    }
});