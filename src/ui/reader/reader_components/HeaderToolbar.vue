<template>
    <div class="header-toolbar">
      <div class="left-toolbar">
        <button @click="$emit('toggle-sidebar')" title="Toggle Sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" class="g-svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
              <path d="M500-640v320l160-160-160-160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm120-80v-560H200v560h120Zm80 0h360v-560H400v560Zm-80 0H200h120Z"/>
            </svg>
          <strong>
            <span class="sidebar-text">Epubespiar</span>
          </strong>
        </button>
        <div class="page-indicator">
          <span>{{ currentPage }} of {{ totalPages }}%</span>
        </div>
      </div>
      
      <div class="middle-toolbar">
        <button @click="$emit('zoom-out')" title="Zoom Out">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8"/>
          </svg>
        </button>
        <button @click="$emit('zoom-in')" title="Zoom In">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
          </svg>
        </button>
        <select @change="onZoomChange($event)">
          <option value="auto">Automatic Zoom</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
          <option value="175">175%</option>
          <option value="200">200%</option>
        </select>
        
        <!-- Font Size Control -->
        <div v-if="isBookLoaded" class="font-size-control">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="font-icon">
            <path d="M2.244 13.081a1 1 0 0 1-.746-1.651l5-5.5a1 1 0 0 1 1.492 0l5 5.5a1 1 0 1 1-1.492 1.357L7 7.59l-4.498 4.94a1 1 0 0 1-.746.338zM9 4h1.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-.5H9v4h.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1H7V5H5.5v.5a.5.5 0 0 1-1 0v-1a.5.5 0 0 1 .5-.5H9z"/>
          </svg>
          <input 
            type="range" 
            :value="fontSize" 
            @input="onFontSizeChange($event)"
            min="14" 
            max="30" 
            step="2"
            class="font-slider"
            title="Font Size"
          />
          <span class="font-size-value">{{ fontSize }}</span>
        </div>
      </div>
      
      <div class="right-toolbar">
        <div class="file-input-container">
          <input 
            type="file" 
            id="epub-upload" 
            accept=".epub" 
            @change="onFileSelected"
            ref="fileInput"
            class="hidden-input"
          >
          <!-- Show open button only when no book is loaded -->
          <button v-if="!isBookLoaded" @click="triggerFileInput" title="Open EPUB File" class="open-epub-button">
            <svg fill="currentColor" width="18" height="18" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M28,8H20.8284L17.4143,4.5859A2,2,0,0,0,16,4H4A2,2,0,0,0,2,6V26a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V10A2,2,0,0,0,28,8ZM8,26V14h8v6.17l-2.59-2.58L12,19l5,5,5-5-1.41-1.41L18,20.17V14a2.0025,2.0025,0,0,0-2-2H8a2.0025,2.0025,0,0,0-2,2V26H4V6H16l4,4h8v2H22v2h6V26Z"/>
            </svg>
            Open EPUB
          </button>
          
          <!-- Show these buttons only when a book is loaded -->
          <div v-if="isBookLoaded" class="book-controls">
            <button @click="toggleFullscreen" title="Enter full Screen">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-angle-expand" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707m4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!--div class="settings-container">
          <button @click="toggleSettings" title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16">
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.292A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
          </button>
          
          <div class="settings-menu" v-if="settingsOpen">
            <button @click="emitAndClose('go-to-first')">
              <svg class="g-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor">
                <path d="m296-224-56-56 240-240 240 240-56 56-184-183-184 183Zm0-240-56-56 240-240 240 240-56 56-184-183-184 183Z"/>
              </svg>
              Go to First Page
            </button>
            <button @click="emitAndClose('go-to-last')">
              <svg class="g-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor">
                <path d="M480-200 240-440l56-56 184 183 184-183 56 56-240 240Zm0-240L240-680l56-56 184 183 184-183 56 56-240 240Z"/>
              </svg>
              Go to Last Page
            </button>
            <button @click="emitAndClose('set-vertical-scroll')">
              <svg class="g-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor">
                <path d="M120-160v-80h720v80H120Zm0-560v-80h720v80H120Zm80 400q-33 0-56.5-23.5T120-400v-160q0-33 23.5-56.5T200-640h560q33 0 56.5 23.5T840-560v160q0 33-23.5 56.5T760-320H200Zm0-80h560v-160H200v160Zm0-160v160-160Z"/>
              </svg>
              Vertical Scrolling
            </button>
            <button @click="emitAndClose('set-horizontal-scroll')">
              <svg xmlns="http://www.w3.org/2000/svg" class="g-svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                <path d="M120-260v-440q0-25 17.5-42.5T180-760q25 0 42.5 17.5T240-700v440q0 25-17.5 42.5T180-200q-25 0-42.5-17.5T120-260Zm220 60q-25 0-42.5-17.5T280-260v-440q0-25 17.5-42.5T340-760h280q25 0 42.5 17.5T680-700v440q0 25-17.5 42.5T620-200H340Zm380-60v-440q0-25 17.5-42.5T780-760q25 0 42.5 17.5T840-700v440q0 25-17.5 42.5T780-200q-25 0-42.5-17.5T720-260Zm-360-20h240v-400H360v400Zm120-200Z"/>
              </svg>
              Horizontal Scrolling
            </button>
          </div>
        </div-->
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  
  export default {
    props: {
      currentPage: { type: Number, default: 1 },
      totalPages: { type: Number, default: 0 },
      isBookLoaded: { type: Boolean, default: false },
      fontSize: { type: Number, default: 16 }
    },
    emits: [
      'toggle-sidebar', 
      'scroll-up', 'scroll-down', 
      'zoom-in', 'zoom-out', 'zoom-change',
      'font-size-change',
      'file-selected', 
      'go-to-first', 'go-to-last', 
      'set-vertical-scroll', 'set-horizontal-scroll',
      'toggle-search',
      'toggle-fullscreen'
    ],
    setup(props, { emit }) {
      const settingsOpen = ref(false);
      const fileInput = ref(null);
      const searchOpen = ref(false);
      const searchQuery = ref('');
      const searchResults = ref([]);
      const searchInput = ref(null);
  
      // Add watch effect to debug isBookLoaded
      watch(() => props.isBookLoaded, (newValue) => {
        console.log('isBookLoaded changed:', newValue);
      });
  
      const toggleSettings = () => {
        settingsOpen.value = !settingsOpen.value;
      };
  
      const onZoomChange = (event) => {
        emit('zoom-change', event.target.value);
      };

      const onFontSizeChange = (event) => {
        emit('font-size-change', event.target.value);
      };
  
      const triggerFileInput = () => {
        fileInput.value.click();
      };
  
      const onFileSelected = (event) => {
        const file = event.target.files[0];
        if (file) {
          emit('file-selected', file);
        }
      };
  
      const toggleSearch = () => {
        searchOpen.value = !searchOpen.value;
        emit('toggle-search', searchOpen.value);
      };
  
      const toggleFullscreen = () => {
        emit('toggle-fullscreen');
      };
  
      const emitAndClose = (event) => {
        emit(event);
        settingsOpen.value = false;
      };
  
      const performSearch = async () => {
        if (!searchQuery.value.trim()) return;
        emit('search', searchQuery.value);
      };
  
      const goToSearchResult = (result) => {
        emit('go-to-search-result', result);
      };
  
      const handleClickOutside = (event) => {
        if (settingsOpen.value && !event.target.closest('.settings-container')) {
          settingsOpen.value = false;
        }
        if (searchOpen.value && !event.target.closest('.search-container')) {
          searchOpen.value = false;
        }
      };
  
      // Listen for search results from parent
      onMounted(() => {
        window.addEventListener('click', handleClickOutside);
        window.addEventListener('search-results', (event) => {
          searchResults.value = event.detail;
        });
      });
  
      onBeforeUnmount(() => {
        window.removeEventListener('click', handleClickOutside);
        window.removeEventListener('search-results', (event) => {
          searchResults.value = event.detail;
        });
      });
  
      return {
        settingsOpen, fileInput, searchOpen, searchQuery, searchResults, searchInput,
        toggleSettings, onZoomChange, onFontSizeChange, triggerFileInput, onFileSelected, 
        emitAndClose, toggleSearch, toggleFullscreen, performSearch, goToSearchResult
      };
    }
  };
  </script>
  
  <style scoped>
  .header-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--toolbar-bg-color, #f5f6f7);
    padding: 2px 10px;
    height: 36px;
    border-bottom: 2px solid var(--toolbar-sp-color, #6a666687);
  }
  
  .left-toolbar, .middle-toolbar, .right-toolbar {
    display: flex;
    align-items: center;
  }
  
  button {
    background: transparent;
    border: none;
    color: var(--text-color, #333);
    font-size: 14px;
    cursor: pointer;
    margin: 0 5px;
    display: flex;
    align-items: center;
    padding: 5px;
  }
  
  button:hover {
    background-color: var(--toolbar-sp-color);
    color: var(--hover-outline-color, #646cff);
  }
  
  .page-indicator {
    margin-left: 10px;
    font-size: 14px;
  }
  
  select {
    padding: 2px;
    border-radius: 4px;
    background-color: var(--toolbar-bg-color, #f5f6f7);
    border: 1px solid #ccc;
    color: var(--text-color, #333);
  }

  .font-size-control {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--background-color, rgba(102, 102, 102, 0.1));
    border-radius: 6px;
    padding: 4px 12px;
    margin-left: 8px;
  }

  .font-icon {
    flex-shrink: 0;
  }

  .font-slider {
    width: 96px;
    height: 4px;
    cursor: pointer;
    accent-color: var(--hover-outline-color, #646cff);
  }

  .font-size-value {
    font-size: 12px;
    min-width: 24px;
    text-align: center;
    color: var(--text-color, #333);
  }
  
  .settings-container {
    position: relative;
  }
  
  .settings-menu {
    position: absolute;
    right: 0;
    top: 100%;
    background: var(--toolbar-bg-color, #f5f6f7);
    border: 1px solid var(--hover-outline-color, #ccc);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    padding: 5px;
    border-radius: 5px;
    z-index: 100;
    min-width: 180px;
  }
  
  .settings-menu button {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 10px;
  }
  
  .hidden-input {
    display: none;
  }
  
  .sidebar-text {
    margin-left: 5px;
    font-size: 16px;
  }
  
  @media (prefers-color-scheme: dark) {
    .header-toolbar {
      --toolbar-bg-color: #38383d;
      --text-color: #f5f5f5;
      --hover-outline-color: #8f8f9d;
      --toolbar-sp-color: #00000063;
    }
    
    select {
      background-color: #38383d;
      color: #f5f5f5;
      border-color: #666;
    }
    
    .settings-menu {
      background: #38383d;
      border-color: #666;
    }
  }
  
  /* Tablet and below: Hide sidebar text */
  @media (max-width: 768px) {
    .sidebar-text {
      display: none;
    }
    
    select {
      max-width: 100px;
      font-size: 12px;
    }
    
    button {
      padding: 4px;
      margin: 0 3px;
    }

    .font-size-control {
      padding: 3px 8px;
      gap: 6px;
    }

    .font-slider {
      width: 72px;
    }

    .font-size-value {
      font-size: 11px;
      min-width: 20px;
    }
  }
  
  /* Mobile: More compact layout */
  @media (max-width: 480px) {
    .header-toolbar {
      padding: 2px 5px;
      height: 32px;
    }
    
    .middle-toolbar select {
      font-size: 11px;
      padding: 1px;
    }
    
    .page-indicator {
      font-size: 12px;
      margin-left: 5px;
    }
    
    .open-epub-button {
      font-size: 12px;
      padding: 3px 6px;
    }
    
    .open-epub-button svg {
      width: 14px;
      height: 14px;
    }
    
    button svg {
      width: 14px;
      height: 14px;
    }

    .font-size-control {
      padding: 2px 6px;
      gap: 4px;
      margin-left: 4px;
    }

    .font-slider {
      width: 60px;
    }

    .font-icon {
      width: 12px;
      height: 12px;
    }

    .font-size-value {
      font-size: 10px;
      min-width: 18px;
    }
  }
  
  /* Very small screens: Hide zoom and font controls */
  @media (max-width: 360px) {
    .middle-toolbar {
      display: none;
    }
  }

  /* Small screens: Keep only font control visible in middle toolbar */
  @media (min-width: 361px) and (max-width: 480px) {
    .middle-toolbar > button,
    .middle-toolbar > select {
      display: none;
    }
  }

  .book-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .search-container {
    position: relative;
  }

  .search-input-container {
    position: absolute;
    right: 0;
    top: 100%;
    background: var(--toolbar-bg-color, #f5f6f7);
    border: 1px solid var(--hover-outline-color, #ccc);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    padding: 5px;
    border-radius: 5px;
    z-index: 100;
    min-width: 180px;
  }

  .search-results {
    max-height: 200px;
    overflow-y: auto;
  }

  .search-result-item {
    padding: 8px 10px;
    cursor: pointer;
  }
</style>