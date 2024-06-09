let dialogOpen = false;

document.addEventListener('DOMContentLoaded', () => {
    // Load default color from options
    chrome.storage.sync.get('defaultColor', (data) => {
        const defaultColor = data.defaultColor || '#ffff00';
        document.getElementById('highlightColor').value = defaultColor;
    });

    // Load existing highlights
    loadHighlights();
});

document.addEventListener('mouseup', () => {
    if (!dialogOpen) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            openHighlightDialog(range);
            dialogOpen = true;
        }
    }
});

function openHighlightDialog(range) {
    const highlightDialog = document.createElement('div');
    highlightDialog.className = 'highlight-dialog';
    highlightDialog.innerHTML = `
        <label for="highlightColor">Highlight Color:</label>
        <input type="color" id="highlightColor" name="highlightColor" value="#ffff00">
        
        <label for="highlightNote">Note:</label>
        <textarea id="highlightNote" rows="4"></textarea>
        
        <button id="saveHighlightDialog">Save Highlight</button>
        <button id="cancelHighlightDialog">Cancel</button>
    `;
    document.body.appendChild(highlightDialog);
    const rect = range.getBoundingClientRect();
    highlightDialog.style.top = `${rect.bottom + window.scrollY}px`;
    highlightDialog.style.left = `${rect.left + window.scrollX}px`;

    highlightDialog.querySelector('#saveHighlightDialog').addEventListener('click', () => {
        dialogOpen = false;
        const color = highlightDialog.querySelector('#highlightColor').value;
        const note = highlightDialog.querySelector('#highlightNote').value;
        highlightRange(range, color, note);
        saveHighlights();
        document.body.removeChild(highlightDialog);
    });

    highlightDialog.querySelector('#cancelHighlightDialog').addEventListener('click', () => {
        dialogOpen = false;
        document.body.removeChild(highlightDialog);
    });
}

function highlightRange(range, color, note) {
    const span = document.createElement('span');
    span.className = 'highlight';
    span.style.backgroundColor = color;
    span.title = note;
    span.appendChild(range.extractContents());
    range.insertNode(span);
}

function saveHighlights() {
    const highlights = document.querySelectorAll('.highlight');
    const annotations = [];
    highlights.forEach((highlight) => {
        const annotation = {
            text: highlight.innerText,
            color: highlight.style.backgroundColor,
            note: highlight.title,
            timestamp: new Date().toISOString(),
            offset: getOffset(highlight)
        };
        annotations.push(annotation);
    });
    chrome.storage.sync.set({ [window.location.href]: annotations });
}

function loadHighlights() {
    chrome.storage.sync.get(window.location.href, (data) => {
        const annotations = data[window.location.href] || [];
        annotations.forEach((annotation) => {
            const range = getRangeByOffset(annotation.offset);
            highlightRange(range, annotation.color, annotation.note);
        });
    });
}

function getOffset(element) {
    const parent = element.parentNode;
    const children = Array.prototype.slice.call(parent.childNodes);
    const index = children.indexOf(element);
    return { parentIndex: index, text: element.innerText };
}

function getRangeByOffset(offset) {
    const parent = document.body.childNodes[offset.parentIndex];
    const range = document.createRange();
    range.selectNodeContents(parent);
    range.setStart(parent.firstChild, 0);
    range.setEnd(parent.firstChild, offset.text.length);
    return range;
}
