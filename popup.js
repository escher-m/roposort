document.getElementById('sortPrice').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'sortProducts' });
    });
});

document.getElementById('status').textContent = 'Click the button to sort products.';

