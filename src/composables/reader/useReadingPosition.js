import { useBrowserLocalStorage } from '../useBrowserStorage.js';

export function useReadingPosition({ currentBookKey, currentChapter, chapters, getScrollElement }) {
  const { data: readingPositions, promise: readingPositionsReady } = useBrowserLocalStorage('readerReadingPositions', {});
  let persistTimer = null;
  const persistReadingPosition = () => {
    if (!currentBookKey.value) return;
    const element = getScrollElement();
    if (!element) return;
    const maxScroll = Math.max(element.scrollHeight - element.clientHeight, 1);
    readingPositions.value = {
      ...readingPositions.value,
      [currentBookKey.value]: {
        scrollPercentage: Math.min(100, Math.max(0, (element.scrollTop / maxScroll) * 100)),
        chapterHref: currentChapter.value,
        timestamp: Date.now()
      }
    };
  };

  const schedulePersistReadingPosition = () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(persistReadingPosition, 700);
  };

  const restoreReadingPosition = async () => {
    if (!currentBookKey.value || !chapters.value.length) return;
    await readingPositionsReady;
    const saved = readingPositions.value?.[currentBookKey.value];
    if (!saved || typeof saved.scrollPercentage !== 'number') return;
    setTimeout(() => {
      const element = getScrollElement();
      if (!element) return;
      const maxScroll = Math.max(element.scrollHeight - element.clientHeight, 0);
      element.scrollTop = (Math.min(100, Math.max(0, saved.scrollPercentage)) / 100) * maxScroll;
    }, 50);
    if (saved.chapterHref) currentChapter.value = saved.chapterHref;
  };
  
  const dispose = () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = null;
    persistReadingPosition();
  };
    return {
        persistReadingPosition, schedulePersistReadingPosition,
        restoreReadingPosition, dispose
    };
}
