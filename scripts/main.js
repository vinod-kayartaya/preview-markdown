const dropZoneContainer = document.getElementById('drop-zone-container');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const markdownContent = document.getElementById('markdown-content');
const markdownDisplay = document.getElementById('markdown-display');
const backButton = document.getElementById('back-button');
const header = document.querySelector('header');
const footer = document.querySelector('footer');
const MAX_RECENT_FILES = 15;
const STORAGE_KEYS = {
  CURRENT_CONTENT: 'markdown_current_content',
  RECENT_FILES: 'markdown_recent_files',
};

// Configure marked options and add mermaid support
marked.setOptions({
  breaks: true, // Add line breaks on single line breaks
  gfm: true, // Use GitHub Flavored Markdown
  headerIds: true, // Include ids in headers
  mangle: false, // Don't escape HTML in the source
  sanitize: false, // Allow HTML in the source
  highlight: function (code, language) {
    if (language === 'mermaid') {
      return `<div class="mermaid">${code}</div>`;
    }
    return code;
  },
});

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'monospace',
});

// Load recent files from localStorage
function loadRecentFiles() {
  const recentFiles = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.RECENT_FILES) || '[]'
  );
  const recentFilesList = document.getElementById('recentFilesList');
  recentFilesList.innerHTML = '';

  recentFiles.forEach((file) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';

    // Create container for file name and path
    const nameContainer = document.createElement('div');
    nameContainer.textContent = file.name;

    const pathContainer = document.createElement('div');
    pathContainer.className = 'file-path';
    pathContainer.textContent = file.path;

    a.appendChild(nameContainer);
    a.appendChild(pathContainer);

    a.onclick = (e) => {
      e.preventDefault();
      loadContentFromStorage(file.path);
    };
    li.appendChild(a);
    recentFilesList.appendChild(li);
  });
}

// Save file to recent files
function saveToRecentFiles(fileName, content, filePath) {
  let recentFiles = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.RECENT_FILES) || '[]'
  );

  // Remove if already exists
  recentFiles = recentFiles.filter((file) => file.path !== filePath);

  // Add to beginning with current timestamp
  recentFiles.unshift({
    name: fileName,
    path: filePath,
    timestamp: Date.now(),
  });

  // Sort by timestamp descending (most recent first)
  recentFiles.sort((a, b) => b.timestamp - a.timestamp);

  // Keep only the most recent files
  recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);

  localStorage.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(recentFiles));
  loadRecentFiles();
}

// Load content from storage
function loadContentFromStorage(filePath) {
  const recentFiles = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.RECENT_FILES) || '[]'
  );
  const file = recentFiles.find((f) => f.path === filePath);
  if (file) {
    const content = localStorage.getItem(
      `${STORAGE_KEYS.CURRENT_CONTENT}_${filePath}`
    );
    if (content) {
      displayMarkdown(content);
      document.querySelector('.drop-zone-container').classList.add('hidden');
      document.getElementById('markdown-content').classList.add('active');
      // Hide header and footer
      header.style.display = 'none';
      footer.style.display = 'none';
    }
  }
}

// Check for stored content on page load
window.addEventListener('load', () => {
  loadRecentFiles();
  const lastViewedFile = localStorage.getItem('markdown_last_viewed');
  if (lastViewedFile) {
    loadContentFromStorage(lastViewedFile);
  }
});

function displayMarkdown(content) {
  const markdownDisplay = document.getElementById('markdown-display');
  markdownDisplay.innerHTML = marked.parse(content);

  // Reinitialize mermaid diagrams
  mermaid.init(undefined, document.querySelectorAll('.mermaid'));

  // Hide header and footer
  header.style.display = 'none';
  footer.style.display = 'none';
}

function showDropZone() {
  document.querySelector('.drop-zone-container').classList.remove('hidden');
  document.getElementById('markdown-content').classList.remove('active');
  // Show header and footer again
  header.style.display = '';
  footer.style.display = '';
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    displayMarkdown(content);

    // Get the full file path
    const filePath = file.webkitRelativePath || file.name;

    // Save to localStorage
    localStorage.setItem(
      `${STORAGE_KEYS.CURRENT_CONTENT}_${filePath}`,
      content
    );
    localStorage.setItem('markdown_last_viewed', filePath);
    saveToRecentFiles(file.name, content, filePath);

    document.querySelector('.drop-zone-container').classList.add('hidden');
    document.getElementById('markdown-content').classList.add('active');
    // Hide header and footer
    header.style.display = 'none';
    footer.style.display = 'none';
  };
  reader.readAsText(file);
}

// Event listeners
uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  handleFile(file);
});

// Go back to drop zone
backButton.addEventListener('click', () => {
  // Clear the current file from localStorage
  const lastViewedFile = localStorage.getItem('markdown_last_viewed');
  if (lastViewedFile) {
    localStorage.removeItem(
      `${STORAGE_KEYS.CURRENT_CONTENT}_${lastViewedFile}`
    );
    localStorage.removeItem('markdown_last_viewed');
  }
  showDropZone();
});

// Handle drag and drop events
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');

  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// Handle drops anywhere on the document when in drop zone mode
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();

  // Only add the drag-over class if the drop zone is visible
  if (dropZoneContainer.style.display !== 'none') {
    dropZone.classList.add('drag-over');
  }
});

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();

  // Check if the element being left is the document itself
  if (
    e.currentTarget === document &&
    dropZoneContainer.style.display !== 'none'
  ) {
    dropZone.classList.remove('drag-over');
  }
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();

  // Only process the drop if the drop zone is visible
  if (dropZoneContainer.style.display !== 'none') {
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }
});

// Show back button when mouse is near top-left
let isMouseNearTopLeft = false;

document.addEventListener('mousemove', (e) => {
  // 80px from top and left (including button size)
  if (e.clientX < 80 && e.clientY < 80) {
    if (!isMouseNearTopLeft) {
      backButton.classList.add('show-back-button');
      isMouseNearTopLeft = true;
    }
  } else {
    if (isMouseNearTopLeft && !backButton.matches(':hover')) {
      backButton.classList.remove('show-back-button');
      isMouseNearTopLeft = false;
    }
  }
});

// Always show when hovered
backButton.addEventListener('mouseenter', () => {
  backButton.classList.add('show-back-button');
});
backButton.addEventListener('mouseleave', () => {
  // Only hide if mouse is not near top-left
  if (!isMouseNearTopLeft) {
    backButton.classList.remove('show-back-button');
  }
});
