document.addEventListener('DOMContentLoaded', () => {
    // Load saved options
    chrome.storage.sync.get('defaultColor', (data) => {
        document.getElementById('defaultColor').value = data.defaultColor || '#ffff00';
    });

    // Save options
    document.getElementById('saveOptions').addEventListener('click', () => {
        const defaultColor = document.getElementById('defaultColor').value;
        chrome.storage.sync.set({ defaultColor: defaultColor }, () => {
            alert('Options saved!');
        });
    });
});
