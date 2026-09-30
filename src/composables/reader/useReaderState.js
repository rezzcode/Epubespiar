import { ref, computed } from 'vue';

export function useReaderState() {
    const sidebarOpen = ref(false);
    const currentPage = ref(0);
    const totalPages = ref(100);
    const zoomLevel = ref(1);
    const fontSize = ref(16);

    const bookContent = ref(null);
    const tableOfContents = ref([]);
    const chapters = ref([]);
    const spineItems = ref([]);
    const currentChapter = ref(null);
    const currentEpubUrl = ref(null);
    const currentBookKey = ref(null);

    const isDragging = ref(false);
    const isLoadingBook = ref(false);
    const loadingTitle = ref('Loading Book');
    const loadingMessage = ref('Please wait while we prepare your book...');
    const loadingSubtitle = ref('This may take a moment');
    const showLoadingProgress = ref(false);
    const loadingProgress = ref(0);

    const createdObjectUrls = new Set();
    const isBookLoaded = computed(() => chapters.value.length > 0);

    const createTrackedObjectUrl = (blob) => {
        const url = URL.createObjectURL(blob);
        createdObjectUrls.add(url);
        return url;
    };

  const cleanupObjectUrls = () => {
    createdObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    createdObjectUrls.clear();
  };

  const resetReaderState = () => {
    cleanupObjectUrls();
    chapters.value = [];
    tableOfContents.value = [];
    spineItems.value = [];
    currentChapter.value = null;
    currentPage.value = 0;
    currentBookKey.value = null;
  };

    return {
        sidebarOpen,
        currentPage,
        totalPages,
        zoomLevel,
        fontSize,
        bookContent,
        tableOfContents,
        chapters,
        spineItems,
        currentChapter,
        currentEpubUrl,
        currentBookKey,
        isDragging,
        isLoadingBook,
        loadingTitle,
        loadingMessage,
        loadingSubtitle,
        showLoadingProgress,
        loadingProgress,
        isBookLoaded,
        createTrackedObjectUrl,
        cleanupObjectUrls,
        resetReaderState
    };
}