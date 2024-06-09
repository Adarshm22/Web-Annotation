let currentHighlights = [];

// Load highlights and notes from storage on page load
window.addEventListener('load', () => {
  chrome.storage.sync.get([window.location.href], (result) => {
    if (result[window.location.href]) {
      currentHighlights = result[window.location.href];
      currentHighlights.forEach((highlight) => {
        applyHighlight(highlight);
      });
    }
  });
});

// Function to highlight selected text
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
    const range = selection.getRangeAt(0);

    // Send message to background script to open highlight dialog
    chrome.runtime.sendMessage(
      { action: "openHighlightDialog", text: selection.toString() },
      (response) => {
        // Handle response from background script
        if (response && response.color) {
          // Highlight the selected range with the received color and note
          highlightRange(range, response.color, response.note);

          // Remove the selection after highlighting
          selection.removeAllRanges();

          // Save the highlights
          saveHighlights();
        }
      }
    );
  }
});

// Function to highlight a range of text
function highlightRange(range, color, note) {
  const span = document.createElement("span");
  span.className = "highlight";
  span.style.backgroundColor = color;
  span.title = note; // Attach note as tooltip
  span.appendChild(range.extractContents());
  range.insertNode(span);

  const highlight = {
    text: span.innerText,
    startContainerPath: getDomPath(range.startContainer),
    startOffset: range.startOffset,
    endContainerPath: getDomPath(range.endContainer),
    endOffset: range.endOffset,
    color: color,
    note: note,
    timestamp: new Date().toISOString(),
  };

  currentHighlights.push(highlight);
}

// Save highlights and notes to storage
function saveHighlights() {
  const data = {};
  data[window.location.href] = currentHighlights;
  chrome.storage.sync.set(data);
}

// Apply a highlight from stored data
function applyHighlight(highlight) {
  const startContainer = getElementByDomPath(highlight.startContainerPath);
  const endContainer = getElementByDomPath(highlight.endContainerPath);
  const range = document.createRange();
  range.setStart(startContainer, highlight.startOffset);
  range.setEnd(endContainer, highlight.endOffset);

  highlightRange(range, highlight.color, highlight.note);
}

// Convert DOM element to a unique path
function getDomPath(element) {
  const stack = [];
  while (element.parentNode != null) {
    let sibCount = 0;
    let sibIndex = 0;
    for (let i = 0; i < element.parentNode.childNodes.length; i++) {
      const sib = element.parentNode.childNodes[i];
      if (sib.nodeName === element.nodeName) {
        if (sib === element) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    stack.unshift(
      `${element.nodeName.toLowerCase()}:nth-of-type(${sibIndex + 1})`
    );
    element = element.parentNode;
  }
  return stack.join(" > ");
}

// Convert a unique path to a DOM element
function getElementByDomPath(path) {
  const parts = path.split(" > ");
  let element = document.body;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const matches = part.match(/(.*):nth-of-type\((\d+)\)/);
    const nodeName = matches[1].toUpperCase();
    const nth = parseInt(matches[2], 10);
    let count = 0;
    for (let j = 0; j < element.childNodes.length; j++) {
      const child = element.childNodes[j];
      if (child.nodeName === nodeName) {
        if (++count === nth) {
          element = child;
          break;
        }
      }
    }
  }
  return element;
}

// Clear highlights on the page
function clearHighlights() {
  const highlights = document.querySelectorAll(".highlight");
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.innerText), highlight);
  });
  currentHighlights = [];
  saveHighlights();
}

// Add event listeners for keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === "H") {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      openHighlightDialog(range);
    }
  } else if (e.ctrlKey && e.shiftKey && e.key === "N") {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const note = prompt("Enter note for this highlight:", "");

      if (note) {
        highlightRange(range, "yellow", note);
        selection.removeAllRanges();
        saveHighlights();
      }
    }
  }
});

// Function to open the highlight dialog
function openHighlightDialog(range) {
  const highlightDialog = document.createElement("div");
  highlightDialog.className = "highlight-dialog";
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

  highlightDialog.querySelector("#saveHighlightDialog").addEventListener("click", () => {
    const color = highlightDialog.querySelector("#highlightColor").value;
    const note = highlightDialog.querySelector("#highlightNote").value;
    highlightRange(range, color, note);
    saveHighlights();
    document.body.removeChild(highlightDialog);
  });

  highlightDialog.querySelector("#cancelHighlightDialog").addEventListener("click", () => {
    document.body.removeChild(highlightDialog);
  });
}
