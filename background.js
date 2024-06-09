// Event listener for opening the highlight dialog
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openHighlightDialog') {
        chrome.windows.create({
            url: chrome.runtime.getURL('highlight_dialog.html'),
            type: 'popup',
            width: 300,
            height: 300
        }, (window) => {
            chrome.runtime.onMessage.addListener(function responseListener(responseMessage) {
                if (responseMessage.action === 'highlightResponse') {
                    sendResponse({ color: responseMessage.color, note: responseMessage.note });
                    chrome.runtime.onMessage.removeListener(responseListener);
                }
            });
        });
        return true; // Keeps the message channel open for sendResponse
    }
});
