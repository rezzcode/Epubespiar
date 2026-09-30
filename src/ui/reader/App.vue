<template>
  <loading-page
    v-if="isLoadingBook"
    :title="loadingTitle"
    :message="loadingMessage"
    :subtitle="loadingSubtitle"
    :showProgress="showLoadingProgress"
    :progress="loadingProgress"
  />

  <div
    v-else
    class="epub-reader"
    @dragover.prevent="handleDragEnter"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <header-toolbar
      :currentPage="currentPage"
      :totalPages="totalPages"
      :isBookLoaded="isBookLoaded"
      :fontSize="fontSize"
      :zoomLevel="zoomLevel"
      :epubUrl="currentEpubUrl"
      @toggle-sidebar="toggleSidebar"
      @scroll-up="scrollUp"
      @scroll-down="scrollDown"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @zoom-change="changeZoom"
      @font-size-change="changeFontSize"
      @file-selected="loadEpub"
      @toggle-fullscreen="toggleFullscreen"
      @download-epub="downloadEpub"
    />

    <div class="main-content">
      <div
        v-if="sidebarOpen"
        class="sidebar-backdrop"
        @click="toggleSidebar"
      ></div>

      <sidebar-component
        :isOpen="sidebarOpen"
        :toc="tableOfContents"
        :currentChapter="currentChapter"
        @navigate="navigateToLocation"
        @close-book="handleCloseBook"
      />

      <epub-renderer
        ref="bookContent"
        :isLoading="false"
        :isBookLoaded="isBookLoaded"
        :zoomLevel="zoomLevel"
        :fontSize="fontSize"
        :chapters="chapters"
        @content-scroll="handleContentScroll"
        @navigate-internal="handleInternalNavigation"
      />
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue';
import HeaderToolbar from './components/HeaderToolbar.vue';
import SidebarComponent from './components/SidebarComponent.vue';
import EpubRenderer from './components/EpubRenderer.vue';
import LoadingPage from './components/LoadingPage.vue';
import useNotification from '../../composables/useNotification.js';
import { useBookLoader } from '../../composables/reader/useBookLoader.js';
import { useReaderInteractions } from '../../composables/reader/useReaderInteractions.js';
import { useReaderNavigation } from '../../composables/reader/useReaderNavigation.js';
import { useReadingPosition } from '../../composables/reader/useReadingPosition.js';
import { useReaderState } from '../../composables/reader/useReaderState.js';
import { downloadEpub as downloadEpubFile } from '../../services/epubProcesor/downloadEpub.js';

export default {
  components: {
    HeaderToolbar,
    SidebarComponent,
    EpubRenderer,
    LoadingPage
  },
  setup() {
    const { addNotification } = useNotification();
    const readerState = useReaderState();
    const {
      sidebarOpen, currentPage, totalPages, zoomLevel,
      fontSize, bookContent, tableOfContents,
      chapters, spineItems, currentChapter, currentEpubUrl,
      currentBookKey, isDragging, isLoadingBook,
      loadingTitle, loadingMessage, loadingSubtitle,
      showLoadingProgress, loadingProgress, isBookLoaded,
      createTrackedObjectUrl, cleanupObjectUrls, resetReaderState
    } = readerState;

    const navigation = useReaderNavigation({
      bookContent,
      chapters,
      currentChapter,
      sidebarOpen
    });

    const readingPosition = useReadingPosition({
      currentBookKey,
      currentChapter,
      chapters,
      getScrollElement: navigation.getScrollElement
    });

    const loader = useBookLoader({
      refs: {
        isLoadingBook, loadingTitle, loadingMessage,
        loadingSubtitle, showLoadingProgress, currentEpubUrl,
        currentBookKey, chapters, tableOfContents,
        currentChapter, spineItems
      },
      addNotification,
      resetReaderState,
      createTrackedObjectUrl,
      restoreReadingPosition: readingPosition.restoreReadingPosition
    });

    const interactions = useReaderInteractions({
      loadEpub: loader.loadEpub,
      addNotification,
      schedulePersistReadingPosition: readingPosition.schedulePersistReadingPosition,
      chapters,
      currentChapter,
      currentPage,
      isDragging
    });

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const handleCloseBook = () => {
      resetReaderState();
      currentEpubUrl.value = null;
      sidebarOpen.value = false;
      
      const homeUrl = `${window.location.pathname}${window.location.hash || ''}`;
      window.history.replaceState({}, '', homeUrl);
    };

    const zoomIn = () => {
      zoomLevel.value = Math.min(zoomLevel.value + 0.1, 2);
    };

    const zoomOut = () => {
      zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5);
    };

    const changeZoom = (value) => {
      zoomLevel.value = value === 'auto' ? 1 : parseInt(value, 10) / 100;
    };

    const changeFontSize = (value) => {
      fontSize.value = parseInt(value, 10);
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };

    const downloadEpub = async () => {
      if (!currentEpubUrl.value) {
        addNotification({ message: 'No EPUB URL available for download', type: 'error' });
        return;
      }
      try {
        addNotification({ message: 'Downloading EPUB...', type: 'info' });
        await downloadEpubFile(currentEpubUrl.value);
        addNotification({ message: 'EPUB downloaded successfully!', type: 'success' });
      } catch (error) {
        console.error('Error downloading EPUB:', error);
        addNotification({ message: 'Failed to download EPUB file', type: 'error' });
      }
    };

    const handleKeyUp = (event) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (event.key === 'ArrowLeft') navigation.scrollUp();
      if (event.key === 'ArrowRight') navigation.scrollDown();
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event) => {
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) navigation.scrollUp();
        else navigation.scrollDown();
      }
    };

    onMounted(() => {
      document.addEventListener('keyup', handleKeyUp);
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
      loader.loadBookFromUrl();
    });
    onUnmounted(() => {
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      readingPosition.dispose();
      cleanupObjectUrls();
    });

    return {
      sidebarOpen, currentPage, totalPages,
      zoomLevel, fontSize, bookContent, tableOfContents,
      currentChapter, chapters, currentEpubUrl,
      isLoadingBook, loadingTitle, loadingMessage,
      loadingSubtitle, showLoadingProgress,
      loadingProgress, isBookLoaded, toggleSidebar,
      scrollUp: navigation.scrollUp,
      scrollDown: navigation.scrollDown,
      zoomIn, zoomOut,
      changeZoom, changeFontSize,
      loadEpub: loader.loadEpub, handleCloseBook,
      navigateToLocation: navigation.navigateToLocation,
      handleInternalNavigation: navigation.handleInternalNavigation,
      handleContentScroll: interactions.handleContentScroll,
      handleDragEnter: interactions.handleDragEnter,
      handleDragLeave: interactions.handleDragLeave,
      handleDrop: interactions.handleDrop,
      toggleFullscreen, downloadEpub, isDragging, spineItems
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
  top: 36px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
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
</style>
