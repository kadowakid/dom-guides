chrome.pageAction.onClicked.addListener(tab => {
    chrome.tabs.sendMessage(tab.id, '')
});

chrome.runtime.onMessage.addListener((message, sender) => {
    message.show && chrome.pageAction.show(sender.tab.id);
    message.view !== undefined && chrome.pageAction.setIcon({
        path: "icons/icon48" + (!message.view ? '_gray' : '') + ".png",
        tabId: sender.tab.id
    });
});