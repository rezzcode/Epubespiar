export function useReaderNavigation({ bookContent, chapters, currentChapter, sidebarOpen }) {
  const getScrollElement = () => bookContent.value?.getContentElement?.() || null;
  const scrollUp = () => {
    const element = getScrollElement();
    if (element) element.scrollBy({ top: -Math.max(element.clientHeight * 0.9, 280), behavior: 'smooth' });
  };

  const scrollDown = () => {
    const element = getScrollElement();
    if (element) element.scrollBy({ top: Math.max(element.clientHeight * 0.9, 280), behavior: 'smooth' });
  };

  const navigateToLocation = (href) => {
    if (!href || !bookContent.value?.scrollToChapter) return;
    const [targetFile, fragment] = href.split('#');
    if (!targetFile) {
      const currentIndex = chapters.value.findIndex((chapter) => chapter.href === currentChapter.value);
      if (currentIndex >= 0) bookContent.value.scrollToChapter(currentIndex, fragment || null);
    } else {
      const targetName = targetFile.split('/').pop() || targetFile;
      const chapterIndex = chapters.value.findIndex((chapter) => {
        const chapterName = chapter.href.split('/').pop() || chapter.href;
        return chapter.href === targetFile || chapterName === targetName || chapter.href.endsWith(targetFile);
      });
      if (chapterIndex >= 0) {
        currentChapter.value = fragment ? `${chapters.value[chapterIndex].href}#${fragment}` : chapters.value[chapterIndex].href;
        bookContent.value.scrollToChapter(chapterIndex, fragment || null);
      }
    }
    if (window.innerWidth < 768) sidebarOpen.value = false;
  };

  const handleInternalNavigation = ({ href, chapterIndex }) => {
    if (!href) return;
    if (href.startsWith('#')) bookContent.value?.scrollToChapter(chapterIndex, href.slice(1));
    else navigateToLocation(href);
  };

    return { 
        getScrollElement, scrollUp, scrollDown,
        navigateToLocation, handleInternalNavigation
    };
}
