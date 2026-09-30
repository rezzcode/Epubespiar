import { validateFile, validateURL } from '../../utils/security.js';
import { fetchWithRetry } from '../../services/epubHttps/fetchWithRetry.js';
import { parseEpubArchive } from '../../services/epubProcesor/parseEpubArchive.js';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = ['application/epub+zip'];

export function useBookLoader({ refs, addNotification, resetReaderState, createTrackedObjectUrl, restoreReadingPosition }) {
  const { isLoadingBook, loadingTitle, loadingMessage,
    loadingSubtitle, showLoadingProgress, currentEpubUrl,
    currentBookKey, chapters, tableOfContents,
    currentChapter, spineItems } = refs;

    const getBookStorageKey = (metadata) => {
      const identifier = String(metadata?.identifier || '').trim();
      if (identifier) return `id:${identifier}`;
      const title = String(metadata?.title || 'untitled').trim().toLowerCase();
      const creator = String(metadata?.creator || 'unknown').trim().toLowerCase();
      return `meta:${title}::${creator}`;
    };

    const loadEpub = async (file, preserveUrl = false) => {
      if (!file) return;

      isLoadingBook.value = true;
      loadingTitle.value = 'Loading Book';
      loadingMessage.value = 'Preparing your EPUB file...';
      loadingSubtitle.value = 'This may take a moment';
      showLoadingProgress.value = false;

      try {
        if (!preserveUrl) {
          currentEpubUrl.value = null;
        }

        if (!validateFile(file, MAX_FILE_SIZE, ALLOWED_TYPES)) {
          throw new Error('Invalid EPUB file type or size');
        }

        resetReaderState();

        loadingMessage.value = 'Parsing book metadata...';
        const { metadata, sidebarToc, chapterEntries, spineItems: parsedSpineItems } = await parseEpubArchive(
          file,
          createTrackedObjectUrl
        );

        loadingMessage.value = 'Rendering chapters...';
        chapters.value = chapterEntries;
        tableOfContents.value = sidebarToc;
        spineItems.value = parsedSpineItems;
        currentChapter.value = chapterEntries[0]?.href || null;
        currentBookKey.value = getBookStorageKey(metadata);
        await restoreReadingPosition();

        addNotification({
          message: `Loaded: ${metadata.title} — ${metadata.creator}`,
          type: 'success'
        });
      } catch (error) {
        console.error('Failed to load EPUB:', error);
        resetReaderState();
        addNotification({ message: 'Failed to load book. Please check the EPUB file.', type: 'error' });
      } finally {
        isLoadingBook.value = false;
      }
    };

    const loadBookFromUrl = async () => {
        try {
            const fileParam = new URLSearchParams(window.location.search).get('file');
            if (!fileParam) return;

            const url = decodeURIComponent(fileParam);
            if (!validateURL(url)) throw new Error('Invalid or insecure URL');

            isLoadingBook.value = true;
            loadingTitle.value = 'Loading Book';
            loadingMessage.value = 'Fetching EPUB file from URL...';
            loadingSubtitle.value = 'This may take a moment';

            currentEpubUrl.value = url.startsWith('https://') ? url : null;

            const response = await fetchWithRetry(url, 2);

            const blob = await response.blob();
            await loadEpub(new File([blob], 'downloaded.epub', { type: 'application/epub+zip' }), true);
        } catch (error) {
            console.error('Error loading book from URL:', error);
            isLoadingBook.value = false;
            addNotification({ message: 'Failed to load book from URL', type: 'error' });
        }
    };

    return { loadEpub, loadBookFromUrl };
}
