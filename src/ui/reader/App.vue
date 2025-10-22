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
      :fontSize="fontSize"
      @toggle-sidebar="toggleSidebar"
      @scroll-up="scrollUp"
      @scroll-down="scrollDown"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-change="changeZoom"
      @font-size-change="changeFontSize"
      @file-selected="loadEpub"
      @toggle-fullscreen="toggleFullscreen"
    />
    
    <div class="main-content">
      <!-- Backdrop overlay for mobile -->
      <div 
        v-if="sidebarOpen" 
        class="sidebar-backdrop"
        @click="toggleSidebar"
      ></div>
      
      <sidebar-component 
        :isOpen="sidebarOpen" 
        :toc="tableOfContents"
        @navigate="navigateToLocation"
      />
      
      <div 
        id="book-content" 
        ref="bookContent" 
        :style="{ transform: `scale(${zoomLevel})` }"
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
import ePub, { Rendition, Book as EpubBook } from 'epubjs';
import { validateFile, sanitizeHTML } from '../../utils/security';

export default {
  components: {
    HeaderToolbar,
    SidebarComponent
  },
  setup(props, { emit }) {
    const { addNotification } = useNotification();
    const sidebarOpen = ref(false);
    const currentPage = ref(0);
    const totalPages = ref(100);
    const zoomLevel = ref(1);
    const bookContent = ref(null);
    const book = ref(null);
    const rendition = ref(null);
    const tableOfContents = ref([]);
    const isDragging = ref(false);
    const fontSize = ref(16); // Font size in pixels (14-30 range)

    // Maximum file size (100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    const ALLOWED_TYPES = ['application/epub+zip'];
    const MIN_SWIPE_DISTANCE = 50; // Minimum pixels for swipe gesture

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const scrollUp = () => {
      if (rendition.value) {
        rendition.value.prev();
      }
    };

    const scrollDown = () => {
      if (rendition.value) {
        rendition.value.next();
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

    const zoomIn = () => {
      zoomLevel.value = Math.min(zoomLevel.value + 0.1, 2);
    };

    const zoomOut = () => {
      zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5);
    };

    const changeZoom = (value) => {
      zoomLevel.value = value === 'auto' ? 1 : parseInt(value) / 100;
    };

    const changeFontSize = (value) => {
      fontSize.value = parseInt(value);
      // Apply font size to rendition if book is loaded
      if (rendition.value && rendition.value.themes) {
        rendition.value.themes.fontSize(`${fontSize.value}px`);
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

        rendition.value.themes.fontSize(`${fontSize.value}px`);

        // Track reading progress with percentage
        rendition.value.on("relocated", (location) => {
          if (book.value && book.value.locations) {
            const percent = book.value.locations.percentageFromCfi(location.start.cfi);
            currentPage.value = Math.floor(percent * 100);
          }
        });

        // Generate locations for percentage calculation
        await book.value.locations.generate(1600);
        
        book.value.loaded.navigation.then(nav => {
          // Only sanitize table of contents labels
          tableOfContents.value = nav.toc.map(item => ({
            ...item,
            label: sanitizeHTML(item.label)
          }));
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
        // Close sidebar on mobile after navigation for better UX
        if (window.innerWidth < 768) {
          sidebarOpen.value = false;
        }
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

    // Touch gesture handling for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Swipe detection
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
        if (deltaX > 0) {
          scrollUp(); // Swipe right
        } else {
          scrollDown(); // Swipe left
        }
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

    const handleResize = () => {
      // Resize rendition when window size changes
      if (rendition.value) {
        nextTick(() => {
          rendition.value.resize();
        });
      }
    };

    onMounted(() => {
      document.addEventListener('keyup', handleKeyUp);
      window.addEventListener('resize', handleResize);
      if (bookContent.value) {
        bookContent.value.addEventListener("wheel", handleMouseScroll);
        bookContent.value.addEventListener('touchstart', handleTouchStart, { passive: true });
        bookContent.value.addEventListener('touchend', handleTouchEnd, { passive: true });
      }
      // Load book from URL if present
      loadBookFromUrl();
    });

    onUnmounted(() => {
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (bookContent.value) {
        bookContent.value.removeEventListener("wheel", handleMouseScroll);
        bookContent.value.removeEventListener('touchstart', handleTouchStart, { passive: true });
        bookContent.value.removeEventListener('touchend', handleTouchEnd, { passive: true });
      }
      // Clean up book resources
      if (book.value) {
        book.value.destroy();
      }
    });

    return {
      sidebarOpen,
      currentPage,
      totalPages,
      zoomLevel,
      fontSize,
      bookContent,
      tableOfContents,
      toggleSidebar,
      scrollUp,
      scrollDown,
      zoomIn,
      zoomOut,
      changeZoom,
      changeFontSize,
      loadEpub,
      navigateToLocation,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      toggleFullscreen,
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

.sidebar-backdrop {
  position: fixed;
  top: 36px; /* Height of header toolbar */
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

#book-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  transition: transform 0.3s ease;
  background-color: var(--background-color);
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Desktop: comfortable reading width */
@media (min-width: 1024px) {
  #book-content {
    padding: 40px 80px;
  }
}

/* Tablet: medium padding */
@media (min-width: 768px) and (max-width: 1023px) {
  #book-content {
    padding: 30px 40px;
  }
}

/* Mobile: minimal padding */
@media (max-width: 767px) {
  #book-content {
    padding: 15px;
  }
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
