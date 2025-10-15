<template>
  <div 
    class="epub-reader"
    @dragover.prevent="handleDragEnter"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @scroll-up="scrollUp"
    @scroll-down="scrollDown"
  >
    <header-toolbar 
      :currentPage="currentPage" 
      :totalPages="totalPages"
      :isBookLoaded="isBookLoaded"
      @toggle-sidebar="toggleSidebar"
      @scroll-up="scrollUp"
      @scroll-down="scrollDown"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-change="changeZoom"
      @file-selected="loadEpub"
      @toggle-search="toggleSearch"
      @toggle-fullscreen="toggleFullscreen"
      @search="performSearch"
      @go-to-search-result="goToSearchResult"
    />
    
    <div class="main-content">
      <sidebar-component 
        :isOpen="sidebarOpen" 
        :toc="tableOfContents"
        @navigate="navigateToLocation"
      />
      
      <div 
        id="book-content" 
        ref="bookContent" 
        :style="{ transform: `scale(${zoomLevel})` }"
        @scroll="handleScroll"
      ></div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import HeaderToolbar from './reader_components/HeaderToolbar.vue';
import SidebarComponent from './reader_components/SidebarComponent.vue';
import useNotification from '../../composables/useNotification';
import jszip from 'jszip';
import ePub from 'epubjs';
import { validateFile, sanitizeHTML } from '../../utils/security';

export default {
  components: {
    HeaderToolbar,
    SidebarComponent
  },
  setup() {
    const { addNotification } = useNotification();
    const sidebarOpen = ref(false);
    const currentPage = ref(1);
    const totalPages = ref(0);
    const zoomLevel = ref(1);
    const bookContent = ref(null);
    const book = ref(null);
    const rendition = ref(null);
    const tableOfContents = ref([]);
    const isDragging = ref(false);

    // Maximum file size (100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    const ALLOWED_TYPES = ['application/epub+zip'];

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
      document.documentElement.style.setProperty("--sidebar-size", sidebarOpen.value ? "390px" : "240px");
    };

    const scrollUp = () => {
      if (bookContent.value) {
        rendition.value.prev();
        bookContent.value.scrollBy({ top: -100, behavior: 'smooth' });
        updatePageNumber(-1);
      }
    };

    const scrollDown = () => {
      if (bookContent.value) {
        rendition.value.next();
        bookContent.value.scrollBy({ top: 100, behavior: 'smooth' });
        updatePageNumber(1);
      }
    };

    const handleMouseScroll = (event) => {
      if (!rendition.value) return;
      
      if (event.deltaY > 0) {
        scrollDown();
      } else if (event.deltaY < 0) {
        scrollUp();
      }
    };

    const updatePageNumber = (delta) => {
      currentPage.value = Math.min(Math.max(1, currentPage.value + delta), totalPages.value);
    };

    const zoomIn = () => {
      zoomLevel.value = Math.min(zoomLevel.value + 0.1, 2);
    };

    const zoomOut = () => {
      zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5);
    };

    const changeZoom = (value) => {
      zoomLevel.value = value === 'auto' ? 1 : parseInt(value) / 100;
    };

    const handleScroll = () => {
      if (bookContent.value && totalPages.value > 0) {
        const scrollPercentage = bookContent.value.scrollTop / (bookContent.value.scrollHeight - bookContent.value.clientHeight);
        currentPage.value = Math.max(1, Math.ceil(scrollPercentage * totalPages.value));
      }
    };

    const loadEpub = async (file) => {
      if (!file) return;
      try {
        // Validate file
        if (!validateFile(file, MAX_FILE_SIZE, ALLOWED_TYPES)) {
          throw new Error('Invalid file type or size');
        }

        const arrayBuffer = await file.arrayBuffer();
        if (book.value) {
          book.value.destroy();
          book.value = null; // Explicitly set to null
        }
        
        book.value = ePub(arrayBuffer);
        await book.value.ready;
        
        rendition.value = book.value.renderTo("book-content", {
          manager: "continuous",
          flow: "scrolled",
          width: "100%",
          height: "100%"
        });

        await rendition.value.display();

        rendition.value.themes.default({ 
          p: { "font-size": "large" }
        });
        
        book.value.loaded.navigation.then(nav => {
          // Only sanitize table of contents labels
          tableOfContents.value = nav.toc.map(item => ({
            ...item,
            label: sanitizeHTML(item.label)
          }));
        });

        book.value.loaded.spine.then(spine => {
          totalPages.value = spine.items.length;
        });

        console.log('Book loaded successfully, book.value:', !!book.value);
        addNotification({ message: 'Book loaded successfully!', type: 'success' });
      } catch (err) {
        console.error('Failed to load book:', err);
        book.value = null; // Ensure book is set to null on error
        addNotification({ message: 'Failed to load book. Please check the file format and size.', type: 'error' });
      }
    };

    const navigateToLocation = (href) => {
      if (rendition.value) {
        rendition.value.display(href);
      }
    };

    const handleDragEnter = (event) => {
      const items = event.dataTransfer.items;
      if (items.length === 1 && (items[0].type === 'application/epub+zip' || items[0].kind === 'file')) {
        isDragging.value = true;
      }
    };

    const handleDragLeave = () => {
      isDragging.value = false;
    };

    const handleDrop = async (event) => {
      isDragging.value = false;
      const files = event.dataTransfer.files;
      if (files.length > 0 && files[0].name.toLowerCase().endsWith('.epub')) {
        await loadEpub(files[0]);
      } else {
        addNotification({ message: 'Please select a valid ePub file', type: 'error' });
      }
    };

    const handleKeyUp = (e) => {
      if (document.activeElement.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') scrollUp();
      if (e.key === 'ArrowRight') scrollDown();
    };

    const toggleSearch = (isOpen) => {
      if (!isOpen) {
        // Clear search results when closing search
        if (rendition.value) {
          rendition.value.annotations.remove('search');
        }
      }
    };

    const performSearch = async (query) => {
      if (!book.value || !rendition.value) return;
      
      try {
        // Remove any existing search highlights
        rendition.value.annotations.remove('search');
        
        // Perform the search
        const results = await book.value.search(query);
        
        // Highlight all matches
        results.forEach(result => {
          rendition.value.annotations.add('search', result.cfi, {}, null, 'hl', { 'fill': 'yellow', 'fill-opacity': '0.3' });
        });

        // Emit results to HeaderToolbar
        emit('search-results', results.map(result => ({
          text: result.excerpt,
          cfi: result.cfi
        })));
      } catch (error) {
        console.error('Search error:', error);
        addNotification({ message: 'Failed to perform search', type: 'error' });
      }
    };

    const goToSearchResult = (result) => {
      if (rendition.value && result.cfi) {
        rendition.value.display(result.cfi);
      }
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };

    // Add a computed property for isBookLoaded
    const isBookLoaded = computed(() => {
      const loaded = !!book.value;
      console.log('isBookLoaded computed:', loaded);
      return loaded;
    });

    // Add function to load book from URL
    const loadBookFromUrl = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const fileParam = params.get('file');
        
        if (fileParam) {
          const url = decodeURIComponent(fileParam);
          if (url.startsWith('file://') || url.startsWith('epub://')) {
            const response = await fetch(url);
            const blob = await response.blob();
            await loadEpub(blob);
          }
        }
      } catch (error) {
        console.error('Error loading book from URL:', error);
        addNotification({ 
          message: 'Failed to load book from URL', 
          type: 'error' 
        });
      }
    };

    onMounted(() => {
      document.addEventListener('keyup', handleKeyUp);
      if (bookContent.value) {
        bookContent.value.addEventListener("wheel", handleMouseScroll);
      }
      // Load book from URL if present
      loadBookFromUrl();
    });

    onUnmounted(() => {
      document.removeEventListener('keyup', handleKeyUp);
      if (bookContent.value) {
        bookContent.value.removeEventListener("wheel", handleMouseScroll);
      }
    });

    return {
      sidebarOpen,
      currentPage,
      totalPages,
      zoomLevel,
      bookContent,
      tableOfContents,
      toggleSidebar,
      scrollUp,
      scrollDown,
      zoomIn,
      zoomOut,
      changeZoom,
      handleScroll,
      loadEpub,
      navigateToLocation,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      toggleSearch,
      toggleFullscreen,
      performSearch,
      goToSearchResult,
      isBookLoaded
    };
  }
};
</script>

<style scoped>
.epub-reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

#book-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 240px;
  transition: transform 0.3s ease;
  background-color: var(--background-color);
  height: 100vh;
  padding-left: var(--sidebar-size);
}

@media (prefers-color-scheme: dark) {
  #book-content {
    background-color: var(--background-color);
    color: var(--text-color);
  }
}

.error {
  color: #dc3545;
  padding: 1rem;
  text-align: center;
}
</style>
