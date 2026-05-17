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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import HeaderToolbar from './reader_components/HeaderToolbar.vue';
import SidebarComponent from './reader_components/SidebarComponent.vue';
import EpubRenderer from './reader_components/EpubRenderer.vue';
import LoadingPage from './reader_components/LoadingPage.vue';
import useNotification from '../../composables/useNotification';
import { useBrowserLocalStorage } from '../../composables/useBrowserStorage';
import JSZip from 'jszip';
import { validateFile, validateURL, sanitizeFilename } from '../../utils/security';

export default {
  components: {
    HeaderToolbar,
    SidebarComponent,
    EpubRenderer,
    LoadingPage
  },
  setup() {
    const { addNotification } = useNotification();

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

    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    const ALLOWED_TYPES = ['application/epub+zip'];
    const MIN_SWIPE_DISTANCE = 50;
    const MIN_TOC_SIZE_THRESHOLD = 3;
    const MIN_SPINE_SIZE_FOR_FALLBACK = 5;
    const NCX_NAMESPACE = 'http://www.daisy.org/z3986/2005/ncx/';

    const { data: readingPositions, promise: readingPositionsReady } = useBrowserLocalStorage(
      'readerReadingPositions',
      {}
    );

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

    const getBookStorageKey = (metadata) => {
      const identifier = String(metadata?.identifier || '').trim();
      if (identifier) return `id:${identifier}`;
      const title = String(metadata?.title || 'untitled').trim().toLowerCase();
      const creator = String(metadata?.creator || 'unknown').trim().toLowerCase();
      return `meta:${title}::${creator}`;
    };

    const persistReadingPosition = () => {
      if (!currentBookKey.value) return;

      const el = getScrollElement();
      if (!el) return;

      const maxScroll = Math.max(el.scrollHeight - el.clientHeight, 1);
      const progress = Math.min(100, Math.max(0, (el.scrollTop / maxScroll) * 100));

      readingPositions.value = {
        ...readingPositions.value,
        [currentBookKey.value]: {
          scrollPercentage: progress,
          chapterHref: currentChapter.value,
          timestamp: Date.now()
        }
      };
    };

    let persistTimer = null;
    const schedulePersistReadingPosition = () => {
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        persistReadingPosition();
      }, 700);
    };

    const restoreReadingPosition = async () => {
      if (!currentBookKey.value || !chapters.value.length) return;

      await readingPositionsReady;
      const saved = readingPositions.value?.[currentBookKey.value];
      if (!saved || typeof saved.scrollPercentage !== 'number') return;

      setTimeout(() => {
        const el = getScrollElement();
        if (!el) return;

        const maxScroll = Math.max(el.scrollHeight - el.clientHeight, 0);
        el.scrollTop = (Math.min(100, Math.max(0, saved.scrollPercentage)) / 100) * maxScroll;
      }, 50);

      if (saved.chapterHref) {
        currentChapter.value = saved.chapterHref;
      }
    };

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const handleCloseBook = () => {
      resetReaderState();
      currentEpubUrl.value = null;
      currentBookKey.value = null;
      sidebarOpen.value = false;

      const homeUrl = `${window.location.pathname}${window.location.hash || ''}`;
      window.history.replaceState({}, '', homeUrl);
    };

    const getScrollElement = () => bookContent.value?.getContentElement?.() || null;

    const scrollUp = () => {
      const el = getScrollElement();
      if (!el) return;
      el.scrollBy({ top: -Math.max(el.clientHeight * 0.9, 280), behavior: 'smooth' });
    };

    const scrollDown = () => {
      const el = getScrollElement();
      if (!el) return;
      el.scrollBy({ top: Math.max(el.clientHeight * 0.9, 280), behavior: 'smooth' });
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

    const normalizePath = (path) => String(path || '').replace(/^\/+/, '');
    // Normalize space-separated attribute values (e.g. epub:type/class/role) into lowercase tokens.
    const toTokenList = (value) => String(value || '').toLowerCase().split(/\s+/).filter(Boolean);

    const resolvePath = (basePath, relativePath) => {
      if (!relativePath) return '';
      if (relativePath.startsWith('data:') || relativePath.startsWith('blob:')) return relativePath;
      if (relativePath.startsWith('/')) return relativePath.slice(1);

      const baseParts = normalizePath(basePath).split('/').filter(Boolean);
      const relParts = relativePath.split('/');

      for (const part of relParts) {
        if (part === '..') {
          baseParts.pop();
        } else if (part && part !== '.') {
          baseParts.push(part);
        }
      }

      return baseParts.join('/');
    };

    const processCssUrls = async (cssText, zip, cssPath) => {
      const cssBasePath = cssPath.includes('/') ? cssPath.substring(0, cssPath.lastIndexOf('/')) : '';
      const urlPattern = /url\(['"]?([^'")]+)['"]?\)/g;
      const matches = [...cssText.matchAll(urlPattern)];
      let updated = cssText;

      for (const match of matches) {
        const original = match[1];
        if (!original || original.startsWith('data:') || original.startsWith('blob:')) continue;

        const resolved = resolvePath(cssBasePath, original);
        const file = zip.file(resolved);
        if (!file) continue;

        try {
          const blob = await file.async('blob');
          const blobUrl = createTrackedObjectUrl(blob);
          updated = updated.replace(match[0], `url('${blobUrl}')`);
        } catch (error) {
          console.warn('Unable to process CSS asset:', resolved, error);
        }
      }

      return updated;
    };

    const parseAndProcessChapter = async (chapterContent, zip, basePath) => {
      const parser = new DOMParser();
      const xhtmlDoc = parser.parseFromString(chapterContent, 'application/xhtml+xml');
      const parseError = xhtmlDoc.querySelector('parsererror');
      const doc = parseError ? parser.parseFromString(chapterContent, 'text/html') : xhtmlDoc;

      const links = doc.querySelectorAll("link[rel='stylesheet']");
      for (const link of Array.from(links)) {
        const href = link.getAttribute('href') || '';
        const resolved = resolvePath(basePath, href);
        const file = zip.file(resolved);
        if (!file) continue;

        try {
          const cssContent = await file.async('string');
          const processedCss = await processCssUrls(cssContent, zip, resolved);
          const cssBlob = new Blob([processedCss], { type: 'text/css' });
          link.setAttribute('href', createTrackedObjectUrl(cssBlob));
        } catch (error) {
          console.warn('Unable to process stylesheet:', resolved, error);
        }
      }

      const styleTags = doc.querySelectorAll('style');
      for (const styleTag of Array.from(styleTags)) {
        if (!styleTag.textContent) continue;
        styleTag.textContent = await processCssUrls(styleTag.textContent, zip, basePath);
      }

      const images = doc.querySelectorAll('img');
      for (const image of Array.from(images)) {
        const src = image.getAttribute('src') || '';
        if (!src || src.startsWith('data:') || src.startsWith('blob:')) continue;

        const resolved = resolvePath(basePath, src);
        const file = zip.file(resolved);
        if (!file) continue;

        try {
          const blob = await file.async('blob');
          image.setAttribute('src', createTrackedObjectUrl(blob));
        } catch (error) {
          console.warn('Unable to process image:', resolved, error);
        }
      }

      const svgImages = doc.querySelectorAll('image');
      for (const image of Array.from(svgImages)) {
        const href = image.getAttribute('xlink:href') || image.getAttribute('href') || '';
        if (!href || href.startsWith('data:') || href.startsWith('blob:')) continue;

        const resolved = resolvePath(basePath, href);
        const file = zip.file(resolved);
        if (!file) continue;

        try {
          const blob = await file.async('blob');
          const blobUrl = createTrackedObjectUrl(blob);
          image.setAttribute('href', blobUrl);
          image.removeAttribute('xlink:href');
        } catch (error) {
          console.warn('Unable to process SVG image:', resolved, error);
        }
      }

      return new XMLSerializer().serializeToString(doc);
    };

    const parseOpfPath = (containerXml) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(containerXml, 'application/xml');
      return doc.querySelector('rootfile')?.getAttribute('full-path') || null;
    };

    const parseTableOfContents = async (zip, manifestEntries, basePath) => {
      const ncxManifestItem = manifestEntries.find(
        (item) => item.mediaType === 'application/x-dtbncx+xml'
      );

      if (ncxManifestItem?.href) {
        const ncxPath = resolvePath(basePath, ncxManifestItem.href);
        const ncxContent = await zip.file(ncxPath)?.async('string');

        if (ncxContent) {
          const ncxBasePath = ncxPath.includes('/') ? ncxPath.substring(0, ncxPath.lastIndexOf('/')) : '';
          const parser = new DOMParser();
          const doc = parser.parseFromString(ncxContent, 'application/xml');
          // Read NCX tags with namespace-first lookup, then fallback for non-namespaced files.
          const getNcxElementList = (node, tagName) => {
            const namespaced = Array.from(node.getElementsByTagNameNS(NCX_NAMESPACE, tagName));
            if (namespaced.length) return namespaced;
            return Array.from(node.getElementsByTagName(tagName));
          };

          // Recursively map NCX navPoint tree into sidebar TOC entries.
          const mapNcxNavPoint = (navPoint) => {
            const directChildren = Array.from(navPoint.children || [])
              .filter((child) => {
                const tag = child.tagName?.toLowerCase?.() || '';
                return tag === 'navpoint' || tag.endsWith(':navpoint');
              })
              .map(mapNcxNavPoint)
              .filter((item) => item.href);

              const labelNode = getNcxElementList(navPoint, 'text')[0];
              const contentNode = getNcxElementList(navPoint, 'content')[0];
              const label = labelNode?.textContent?.trim() || 'Section';
              const src = contentNode?.getAttribute('src') || '';
              return {
              label,
              href: resolvePath(ncxBasePath, src),
              subitems: directChildren
            };
          };

          const navMap = getNcxElementList(doc, 'navMap')[0];
          const topLevelPoints = navMap
            ? Array.from(navMap.children || []).filter((child) => {
                const tag = child.tagName?.toLowerCase?.() || '';
                return tag === 'navpoint' || tag.endsWith(':navpoint');
              })
            : [];

          const ncxToc = topLevelPoints
            .map(mapNcxNavPoint)
            .filter((item) => item.href);

          if (ncxToc.length) return ncxToc;
        }
      }

      const navManifestItem = manifestEntries.find((item) => {
        const properties = toTokenList(item.properties);
        return item.mediaType === 'application/xhtml+xml' && properties.includes('nav');
      });

      if (!navManifestItem?.href) return [];

      const navPath = resolvePath(basePath, navManifestItem.href);
      const navContent = await zip.file(navPath)?.async('string');
      if (!navContent) return [];
      const navBasePath = navPath.includes('/') ? navPath.substring(0, navPath.lastIndexOf('/')) : '';

      const parser = new DOMParser();
      const xhtmlDoc = parser.parseFromString(navContent, 'application/xhtml+xml');
      const parseError = xhtmlDoc.querySelector('parsererror');
      const doc = parseError ? parser.parseFromString(navContent, 'text/html') : xhtmlDoc;

      const navElements = Array.from(doc.querySelectorAll('nav'));
      const tocNav = navElements.find((navElement) => {
        const epubTypeTokens = toTokenList(navElement.getAttribute('epub:type'));
        const typeTokens = toTokenList(navElement.getAttribute('type'));
        const roleTokens = toTokenList(navElement.getAttribute('role'));
        const id = String(navElement.getAttribute('id') || '').toLowerCase();
        const classTokens = toTokenList(navElement.getAttribute('class'));
        return epubTypeTokens.includes('toc')
          || typeTokens.includes('toc')
          || roleTokens.includes('doc-toc')
          || id === 'toc'
          || classTokens.includes('toc')
          || classTokens.includes('table-of-contents');
      }) || navElements[0];

      if (!tocNav) return [];

      // Recursively map EPUB3 nav list items (ol/ul > li > a) into nested TOC entries.
      const mapNavListItem = (listItem) => {
        const directAnchor = Array.from(listItem.children || []).find((child) => {
          const tag = child.tagName?.toLowerCase?.() || '';
          return tag === 'a';
        });

        if (!directAnchor) return null;

        const nestedList = Array.from(listItem.children || []).find((child) => {
          const tag = child.tagName?.toLowerCase?.() || '';
          return tag === 'ol' || tag === 'ul';
        });

        const subitems = nestedList
          ? Array.from(nestedList.children || [])
              .map(mapNavListItem)
              .filter((item) => item?.href)
          : [];

        const label = directAnchor.textContent?.trim() || 'Section';
        const href = directAnchor.getAttribute('href') || '';
        return {
          label,
          href: resolvePath(navBasePath, href),
          subitems
        };
      };

      const topLevelList = tocNav.querySelector('ol, ul');
      const navToc = topLevelList
        ? Array.from(topLevelList.children || [])
            .map(mapNavListItem)
            .filter((item) => item?.href)
        : [];

      return navToc;
    };

    const parseEpubArchive = async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      const containerContent = await zip.file('META-INF/container.xml')?.async('string');
      if (!containerContent) {
        throw new Error('Invalid EPUB: Missing META-INF/container.xml');
      }

      const opfPath = parseOpfPath(containerContent);
      if (!opfPath) {
        throw new Error('Invalid EPUB: Could not determine OPF path');
      }

      const opfContent = await zip.file(opfPath)?.async('string');
      if (!opfContent) {
        throw new Error('Invalid EPUB: Missing package document');
      }

      const opfBasePath = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

      const parser = new DOMParser();
      const opfDoc = parser.parseFromString(opfContent, 'application/xml');

      const metadata = {
        title: opfDoc.querySelector('metadata > title, metadata > dc\\:title')?.textContent?.trim() || 'Untitled',
        creator: opfDoc.querySelector('metadata > creator, metadata > dc\\:creator')?.textContent?.trim() || 'Unknown Author',
        identifier: opfDoc.querySelector('metadata > identifier, metadata > dc\\:identifier')?.textContent?.trim() || ''
      };

      const manifestItems = Array.from(opfDoc.querySelectorAll('manifest > item')).map((item) => ({
        id: item.getAttribute('id') || '',
        href: item.getAttribute('href') || '',
        mediaType: item.getAttribute('media-type') || '',
        properties: item.getAttribute('properties') || ''
      }));

      const manifestById = new Map(manifestItems.map((item) => [item.id, item]));

      const parsedSpineItems = Array.from(opfDoc.querySelectorAll('spine > itemref'))
        .map((itemRef) => {
          const idref = itemRef.getAttribute('idref') || '';
          const manifestEntry = manifestById.get(idref);
          if (!manifestEntry?.href) return null;

          return {
            id: idref,
            href: resolvePath(opfBasePath, manifestEntry.href)
          };
        })
        .filter(Boolean);

      spineItems.value = parsedSpineItems;

      const parsedToc = await parseTableOfContents(zip, manifestItems, opfBasePath);
      const flattenTocEntries = (entries, bucket = []) => {
        entries.forEach((entry) => {
          bucket.push(entry);
          if (entry.subitems?.length) {
            flattenTocEntries(entry.subitems, bucket);
          }
        });
        return bucket;
      };
      const flatParsedToc = flattenTocEntries(parsedToc);

      const chapterEntries = [];
      for (let index = 0; index < parsedSpineItems.length; index += 1) {
        const spineItem = parsedSpineItems[index];
        const chapterFile = zip.file(spineItem.href);
        if (!chapterFile) continue;

        try {
          const rawContent = await chapterFile.async('string');
          const chapterBasePath = spineItem.href.includes('/')
            ? spineItem.href.substring(0, spineItem.href.lastIndexOf('/'))
            : '';
          const content = await parseAndProcessChapter(rawContent, zip, chapterBasePath);

          const chapterFileName = spineItem.href.split('/').pop() || spineItem.href;
          const matchingToc = flatParsedToc.find((item) => {
            const tocFile = item.href.split('#')[0].split('/').pop();
            return tocFile === chapterFileName;
          });

          chapterEntries.push({
            index,
            href: spineItem.href,
            title: matchingToc?.label || `Section ${index + 1}`,
            content
          });
        } catch (error) {
          console.error(`Failed to parse chapter ${index}:`, error);
        }
      }

      // Fallback to spine when TOC is missing, or clearly sparse for longer books.
      const useSpineFallbackToc = parsedToc.length === 0
        || (
          parsedToc.length < MIN_TOC_SIZE_THRESHOLD
          && parsedSpineItems.length > MIN_SPINE_SIZE_FOR_FALLBACK
        );

      const sidebarToc = useSpineFallbackToc
        ? chapterEntries.map((chapter, index) => ({
            label: chapter.title,
            href: chapter.href,
            subitems: []
          }))
        : parsedToc;

      return {
        metadata,
        sidebarToc,
        chapterEntries
      };
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
        const { metadata, sidebarToc, chapterEntries } = await parseEpubArchive(file);

        loadingMessage.value = 'Rendering chapters...';
        chapters.value = chapterEntries;
        tableOfContents.value = sidebarToc;
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

    const navigateToLocation = (href) => {
      if (!href || !bookContent.value?.scrollToChapter) return;

      const [targetFile, fragment] = href.split('#');

      if (!targetFile) {
        const currentIndex = chapters.value.findIndex((chapter) => chapter.href === currentChapter.value);
        if (currentIndex >= 0) {
          bookContent.value.scrollToChapter(currentIndex, fragment || null);
        }
        return;
      }

      const targetName = targetFile.split('/').pop() || targetFile;
      const chapterIndex = chapters.value.findIndex((chapter) => {
        const chapterName = chapter.href.split('/').pop() || chapter.href;
        return chapter.href === targetFile || chapterName === targetName || chapter.href.endsWith(targetFile);
      });

      if (chapterIndex >= 0) {
        currentChapter.value = fragment ? `${chapters.value[chapterIndex].href}#${fragment}` : chapters.value[chapterIndex].href;
        bookContent.value.scrollToChapter(chapterIndex, fragment || null);
      }

      if (window.innerWidth < 768) {
        sidebarOpen.value = false;
      }
    };

    const handleInternalNavigation = ({ href, chapterIndex }) => {
      if (!href) return;

      if (href.startsWith('#')) {
        bookContent.value?.scrollToChapter(chapterIndex, href.slice(1));
        return;
      }

      navigateToLocation(href);
    };

    const handleContentScroll = ({ progress, chapterIndex }) => {
      currentPage.value = Number.isFinite(progress) ? Math.round(progress) : 0;
      if (chapterIndex >= 0 && chapters.value[chapterIndex]) {
        currentChapter.value = chapters.value[chapterIndex].href;
      }
      schedulePersistReadingPosition();
    };

    const handleDragEnter = (event) => {
      const items = event.dataTransfer?.items || [];
      if (items.length === 1 && (items[0].type === 'application/epub+zip' || items[0].kind === 'file')) {
        isDragging.value = true;
      }
    };

    const handleDragLeave = () => {
      isDragging.value = false;
    };

    const handleDrop = async (event) => {
      isDragging.value = false;
      const files = event.dataTransfer?.files;
      if (files?.length > 0 && files[0].name.toLowerCase().endsWith('.epub')) {
        await loadEpub(files[0]);
      } else {
        addNotification({ message: 'Please select a valid EPUB file', type: 'error' });
      }
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };

    const loadBookFromUrl = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const fileParam = params.get('file');
        if (!fileParam) return;

        const url = decodeURIComponent(fileParam);
        if (!validateURL(url)) {
          throw new Error('Invalid or insecure URL');
        }

        isLoadingBook.value = true;
        loadingTitle.value = 'Loading Book';
        loadingMessage.value = 'Fetching EPUB file from URL...';
        loadingSubtitle.value = 'This may take a moment';

        currentEpubUrl.value = url.startsWith('https://') ? url : null;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const epubFile = new File([blob], 'downloaded.epub', { type: 'application/epub+zip' });
        await loadEpub(epubFile, true);
      } catch (error) {
        console.error('Error loading book from URL:', error);
        isLoadingBook.value = false;
        addNotification({ message: 'Failed to load book from URL', type: 'error' });
      }
    };

    const downloadEpub = async () => {
      if (!currentEpubUrl.value) {
        addNotification({ message: 'No EPUB URL available for download', type: 'error' });
        return;
      }

      try {
        addNotification({ message: 'Downloading EPUB...', type: 'info' });

        const response = await fetch(currentEpubUrl.value);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText || ''}`.trim());
        }

        const blob = await response.blob();
        const rawName = currentEpubUrl.value.split('/').pop()?.split('?')[0] || 'book.epub';
        const filename = sanitizeFilename(rawName);

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename.endsWith('.epub') ? filename : `${filename}.epub`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        addNotification({ message: 'EPUB downloaded successfully!', type: 'success' });
      } catch (error) {
        console.error('Error downloading EPUB:', error);
        addNotification({ message: 'Failed to download EPUB file', type: 'error' });
      }
    };

    const handleKeyUp = (event) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (event.key === 'ArrowLeft') scrollUp();
      if (event.key === 'ArrowRight') scrollDown();
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

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
        if (deltaX > 0) scrollUp();
        else scrollDown();
      }
    };

    onMounted(() => {
      document.addEventListener('keyup', handleKeyUp);
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
      loadBookFromUrl();
    });

    onUnmounted(() => {
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
      }
      persistReadingPosition();
      cleanupObjectUrls();
    });

    return {
      sidebarOpen,
      currentPage,
      totalPages,
      zoomLevel,
      fontSize,
      bookContent,
      tableOfContents,
      currentChapter,
      chapters,
      currentEpubUrl,
      isLoadingBook,
      loadingTitle,
      loadingMessage,
      loadingSubtitle,
      showLoadingProgress,
      loadingProgress,
      isBookLoaded,
      toggleSidebar,
      scrollUp,
      scrollDown,
      zoomIn,
      zoomOut,
      changeZoom,
      changeFontSize,
      loadEpub,
      handleCloseBook,
      navigateToLocation,
      handleInternalNavigation,
      handleContentScroll,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      toggleFullscreen,
      downloadEpub
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
