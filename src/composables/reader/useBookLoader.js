import useBookStorage from "../useBookStorage.js";
import useCollections from "../useCollections.js";
import { validateFile, validateURL } from "../../utils/security.js";
import { fetchWithRetry } from "../../services/epubHttps/fetchWithRetry.js";
import { parseEpubArchive } from "../../services/epubProcesor/parseEpubArchive.js";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = ["application/epub+zip"];

export function useBookLoader({
  refs,
  addNotification,
  resetReaderState,
  createTrackedObjectUrl,
  restoreReadingPosition,
  onSaved,
  onOpened,
  persistReadingPosition,
}) {
  const storage = useBookStorage();
  let busy = false;
  const {
    isLoadingBook,
    loadingTitle,
    loadingMessage,
    loadingSubtitle,
    showLoadingProgress,
    currentEpubUrl,
    currentBookKey,
    chapters,
    tableOfContents,
    currentChapter,
    spineItems,
  } = refs;

  const getBookStorageKey = (metadata) => {
    const identifier = String(metadata?.identifier || "").trim();
    if (identifier) return `id:${identifier}`;

    const title = String(metadata?.title || "untitled")
      .trim()
      .toLowerCase();
    const creator = String(metadata?.creator || "unknown")
      .trim()
      .toLowerCase();

    return `meta:${title}::${creator}`;
  };

  const loadEpub = async (file, preserveUrl = false, storedId = null) => {
    if (!file || busy) return false;
    busy = true;
    const shouldOpen = !!storedId || !chapters.value.length;
    const urls = [];
    const makeUrl = (blob) => {
      const url = URL.createObjectURL(blob);
      urls.push(url);
      return url;
    };

    isLoadingBook.value = shouldOpen;
    loadingTitle.value = "Loading Book";
    loadingMessage.value = "Preparing your EPUB file...";
    loadingSubtitle.value = "This may take a moment";
    showLoadingProgress.value = false;

    try {
      if (!preserveUrl) {
        currentEpubUrl.value = null;
      }

      if (!validateFile(file, MAX_FILE_SIZE, ALLOWED_TYPES)) {
        throw new Error("Invalid EPUB file type or size");
      }

      loadingMessage.value = "Parsing book metadata...";
      const {
        metadata,
        cover,
        sidebarToc,
        chapterEntries,
        spineItems: parsedSpineItems,
      } = await parseEpubArchive(file, makeUrl);

      if (!chapterEntries.length) throw new Error("No readable chapters");
      if (!storedId) {
        const bytes = await file.arrayBuffer();

        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
          (b) => b.toString(16).padStart(2, "0"),
        ).join("");

        const id = "sha256:" + hash;
        const existing = await storage.getBook(id);

        await storage.saveBook({
          ...existing,
          id,
          file: new File([bytes], file.name || "book.epub", {
            type: "application/epub+zip",
          }),
          title: metadata.title,
          author: metadata.creator,
          metadata,
          cover: cover || existing?.cover,
        });

        if (preserveUrl && currentEpubUrl.value?.startsWith("https://")) {
          const collections = useCollections();
          let online = collections
            .getCollections()
            .find((c) => c.name === "Online Books");
          if (!online) online = collections.createCollection("Online Books");
          collections.addBookToCollection(online.id, id);
          await storage.updateBook(id, { sourceUrl: currentEpubUrl.value });
        }

        localStorage.setItem("reader-has-imported", "true");
        await onSaved?.();
      }
      if (!shouldOpen) {
        urls.forEach((url) => URL.revokeObjectURL(url));
        return true;
      }
      persistReadingPosition?.();
      resetReaderState();
      loadingMessage.value = "Rendering chapters...";
      chapters.value = chapterEntries;
      tableOfContents.value = sidebarToc;
      spineItems.value = parsedSpineItems;
      currentChapter.value = chapterEntries[0]?.href || null;
      currentBookKey.value = getBookStorageKey(metadata);
      await restoreReadingPosition();

      onOpened?.();
      addNotification({
        message: `Loaded: ${metadata.title} — ${metadata.creator}`,
        type: "success",
      });
      return true;
    } catch (error) {
      console.error("Failed to load EPUB:", error);

      addNotification({
        message: "Failed to load book. Please check the EPUB file.",
        type: "error",
      });
      return false;
    } finally {
      busy = false;
      isLoadingBook.value = false;
    }
  };

  const loadBookFromUrl = async () => {
    try {
      const fileParam = new URLSearchParams(window.location.search).get("file");
      if (!fileParam) return;

      const url = decodeURIComponent(fileParam);
      if (!validateURL(url)) throw new Error("Invalid or insecure URL");

      isLoadingBook.value = true;
      loadingTitle.value = "Loading Book";
      loadingMessage.value = "Fetching EPUB file from URL...";
      loadingSubtitle.value = "This may take a moment";

      currentEpubUrl.value = url.startsWith("https://") ? url : null;

      const response = await fetchWithRetry(url, 2);

      const blob = await response.blob();
      await loadEpub(
        new File([blob], "downloaded.epub", { type: "application/epub+zip" }),
        true,
      );
    } catch (error) {
      console.error("Error loading book from URL:", error);
      isLoadingBook.value = false;
      addNotification({
        message: "Failed to load book from URL",
        type: "error",
      });
    }
  };

  return { loadEpub, loadBookFromUrl };
}
