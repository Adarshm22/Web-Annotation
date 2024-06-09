document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);

function handleDOMContentLoaded() {
    // Event listener for clearing highlights
    document.getElementById('clearHighlights').addEventListener('click', clearHighlights);
    // Event listener for searching annotations
    document.getElementById('search').addEventListener('input', applyFilters);
    // Event listener for exporting annotations
    document.getElementById('exportAnnotations').addEventListener('click', exportAnnotations);
    // Event listener for filtering by date
    document.getElementById('filterDate').addEventListener('change', applyFilters);

    // Event listener for filtering by category
    document.getElementById('filterCategory').addEventListener('change', applyFilters);

    // Event listener for applying filters
    document.getElementById('applyFilters').addEventListener('click', applyFilters);

    // Event listener for clearing filters
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    loadAnnotations();
}


function loadAnnotations() {
    chrome.storage.sync.get([window.location.href], (items) => {
        const annotations = items[window.location.href] || [];
        displayAnnotations(annotations);
    });
}

function displayAnnotations(annotations) {
    const container = document.getElementById('annotationsList');
    container.innerHTML = '';
    annotations.forEach(annotation => {
        const div = document.createElement('div');
        div.className = 'annotation';
        div.style.backgroundColor = annotation.color;
        div.innerText = annotation.text + (annotation.note ? `: ${annotation.note}` : '');
        container.appendChild(div);
    });
}

// Function to clear highlights
function clearHighlights() {
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.innerText), highlight);
    });
    chrome.storage.sync.remove(window.location.href);
}

function applyFilters() {
    chrome.storage.sync.get([window.location.href], (items) => {
        let filteredAnnotations = items[window.location.href] || [];

        // Filter by search keyword
        const searchKeyword = document.getElementById('search').value.toLowerCase();
        filteredAnnotations = filteredAnnotations.filter(annotation =>
            annotation.text.toLowerCase().includes(searchKeyword) || 
            (annotation.note && annotation.note.toLowerCase().includes(searchKeyword))
        );

        // Filter by date
        const filterDate = document.getElementById('filterDate').value;
        if (filterDate) {
            filteredAnnotations = filteredAnnotations.filter(annotation =>
                annotation.timestamp.startsWith(filterDate)
            );
        }

        // Filter by category (if applicable)
        const filterCategory = document.getElementById('filterCategory').value;
        if (filterCategory) {
            filteredAnnotations = filteredAnnotations.filter(annotation =>
                annotation.category === filterCategory
            );
        }

        displayAnnotations(filteredAnnotations);
    });
}

function clearFilters() {
    document.getElementById('search').value = '';
    document.getElementById('filterDate').value = '';
    document.getElementById('filterCategory').value = '';
    applyFilters();
}

function exportAnnotations() {
    chrome.storage.sync.get([window.location.href], (items) => {
        const annotations = items[window.location.href] || [];
        const blob = new Blob([JSON.stringify(annotations, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotations.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}
