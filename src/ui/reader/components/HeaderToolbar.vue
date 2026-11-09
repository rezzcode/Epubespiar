<template>
  <div class="header-toolbar" :class="{ 'show-chapter-title': isBookLoaded && !showInlineControls }">
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
    
    <div v-if="isBookLoaded && showInlineControls" class="middle-toolbar">
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
      <select @change="onZoomChange($event)" :value="zoomSelectValue">
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
    
    <div v-if="isBookLoaded && !showInlineControls" class="chapter-title" :title="currentChapterTitle">
      {{ currentChapterTitle }}
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
        <div class="book-controls">
          <!-- Bookshelf/Library button - always visible -->
          <button @click="$emit('toggle-bookshelf')" title="Open Bookshelf" aria-label="Open Bookshelf">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
            </svg>
          </button>

          <!-- Show open button only when no book is loaded -->
          <button v-if="!isBookLoaded" @click="triggerFileInput" title="Open EPUB File" class="open-epub-button">
            <svg fill="currentColor" width="18" height="18" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M28,8H20.8284L17.4143,4.5859A2,2,0,0,0,16,4H4A2,2,0,0,0,2,6V26a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V10A2,2,0,0,0,28,8ZM8,26V14h8v6.17l-2.59-2.58L12,19l5,5,5-5-1.41-1.41L18,20.17V14a2.0025,2.0025,0,0,0-2-2H8a2.0025,2.0025,0,0,0-2,2V26H4V6H16l4,4h8v2H22v2h6V26Z"/>
            </svg>
            Open EPUB
          </button>
          
          <!-- Show these buttons only when a book is loaded -->
          <button v-if="showDownloadButton" @click="handleDownload" title="Download EPUB" aria-label="Download EPUB file">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
            </svg>
          </button>
          <button v-if="isBookLoaded" @click="toggleFullscreen" title="Enter full Screen">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-angle-expand" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707m4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707"/>
            </svg>
          </button>
        
          <button v-if="isBookLoaded" @click="$emit('toggle-settings')" title="Reader settings" aria-label="Reader settings" aria-haspopup="dialog">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.292A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';

export default {
  props: {
    currentPage: { type: Number, default: 1 },
    totalPages: { type: Number, default: 0 },
    isBookLoaded: { type: Boolean, default: false },
    fontSize: { type: Number, default: 16 },
    zoomLevel: { type: Number, default: 1 },
    currentChapterTitle: { type: String, default: '' },
    showInlineControls: { type: Boolean, default: true },
    epubUrl: { type: String, default: null }
  },
  emits: [
    'toggle-bookshelf',
    'toggle-sidebar', 
    'scroll-up', 'scroll-down', 
    'zoom-in', 'zoom-out', 'zoom-change',
    'font-size-change',
    'file-selected', 
    'go-to-first', 'go-to-last', 
    'set-vertical-scroll', 'set-horizontal-scroll',
    'toggle-search',
    'toggle-fullscreen',
    'toggle-settings',
    'download-epub'
  ],
  setup(props, { emit, expose }) {
    const fileInput = ref(null);
    const searchOpen = ref(false);
    const searchQuery = ref('');
    const searchResults = ref([]);
    const searchInput = ref(null);
    

    // Check if download button should be shown (book loaded from HTTPS)
    const showDownloadButton = computed(() => {
      return props.isBookLoaded && props.epubUrl && props.epubUrl.startsWith('https://');
    });

    // Reflect current zoom in dropdown using nearest preset value
    const zoomSelectValue = computed(() => {
      const v = Math.round((props.zoomLevel || 1) * 100);
      const options = [75, 100, 125, 150, 175, 200];
      let nearest = options[0];
      for (const opt of options) {
        if (Math.abs(opt - v) < Math.abs(nearest - v)) nearest = opt;
      }
      return String(nearest);
    });

    // Add watch effect to debug isBookLoaded
    watch(() => props.isBookLoaded, (newValue) => {
      console.log('isBookLoaded changed:', newValue);
    });

    const onZoomChange = (event) => {
      emit('zoom-change', event.target.value);
    };

    const onFontSizeChange = (event) => {
      emit('font-size-change', event.target.value);
    };

    const triggerFileInput = () => {
      fileInput.value?.click();
    };
    expose({ openFilePicker: triggerFileInput });

    const onFileSelected = (event) => {
      const file = event.target.files[0];
      if (file) {
        emit('file-selected', file);
      }
      // Allow selecting the same EPUB again after closing it.
      event.target.value = '';
    };

    const toggleSearch = () => {
      searchOpen.value = !searchOpen.value;
      emit('toggle-search', searchOpen.value);
    };

    const toggleFullscreen = () => {
      emit('toggle-fullscreen');
    };
    
    const handleDownload = () => {
      emit('download-epub');
    };
    
    const performSearch = async () => {
      if (!searchQuery.value.trim()) return;
      emit('search', searchQuery.value);
    };

    const goToSearchResult = (result) => {
      emit('go-to-search-result', result);
    };

    const handleClickOutside = (event) => {
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
      fileInput, searchOpen, searchQuery, searchResults, searchInput,
      zoomSelectValue, showDownloadButton,
      onZoomChange, onFontSizeChange, triggerFileInput, onFileSelected,
      toggleSearch, toggleFullscreen, handleDownload, performSearch, goToSearchResult
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
    gap: 4px;
  }

  .header-toolbar.show-chapter-title {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .show-chapter-title .left-toolbar { min-width: 0; }
  .show-chapter-title .page-indicator { overflow: hidden; white-space: nowrap; }
  .show-chapter-title .right-toolbar { justify-self: end; }
  .chapter-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-color, #333);
  }

  button {
    background: transparent;
    border: none;
    color: var(--text-color, #333);
    font-size: 14px;
    cursor: pointer;
    margin: 0;
    display: flex;
    align-items: center;
    padding: 5px 7px;
    border-radius: 6px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }
  
  button:hover {
    background-color: var(--button-hover-bg, rgba(16, 185, 129, 0.1));
    color: var(--hover-outline-color, #10b981);
    transform: translateY(-1px);
  }

  button:active {
    transform: translateY(0);
  }
  
  .page-indicator {
    margin-left: 10px;
    font-size: 14px;
  }
  
  select {
    padding: 2px 8px;
    border-radius: 6px;
    background-color: var(--toolbar-bg-color, #f5f6f7);
    border: 1px solid var(--border-color, #d1d5db);
    color: var(--text-color, #333);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
  }

  select:hover {
    border-color: var(--hover-outline-color, #10b981);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  select:focus {
    outline: none;
    border-color: var(--hover-outline-color, #10b981);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }

  .font-size-control {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--control-bg, #10b98114);
    border-radius: 8px;
    padding: 4px 12px;
    margin-left: 8px;
    border: 1px solid var(--control-border, rgba(16, 185, 129, 0.2));
    transition: all 0.2s ease;
  }

  .font-size-control:hover {
    background-color: var(--control-bg-hover, rgba(16, 185, 129, 0.12));
    border-color: var(--hover-outline-color, #10b981);
  }

  .font-icon {
    flex-shrink: 0;
    color: var(--hover-outline-color, #10b981);
  }

  .font-slider {
    width: 96px;
    height: 4px;
    cursor: pointer;
    accent-color: var(--hover-outline-color, #10b981);
  }

  .font-size-value {
    font-size: 12px;
    min-width: 24px;
    text-align: center;
    color: var(--text-color, #10b981);
    font-weight: 600;
  }
  
  .hidden-input {
    display: none;
  }
  
  .sidebar-text {
    margin-left: 5px;
    font-size: 16px;
  }
  

  
  /* Tablet and below: Hide sidebar text */
  @media (max-width: 842px) {
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
  @media (max-width: 515px) {
    .header-toolbar {
      padding: 2px 5px;
      height: 32px; /* here the header was reduced so it affects the sidebar */
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
    gap: 6px;
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
