export function useReaderInteractions({
  loadEpub,
  addNotification,
  schedulePersistReadingPosition,
  chapters,
  currentChapter,
  currentPage,
  isDragging,
}) {
  const handleContentScroll = ({ progress, chapterIndex }) => {
    currentPage.value = Number.isFinite(progress) ? Math.round(progress) : 0;
    if (chapterIndex >= 0 && chapters.value[chapterIndex])
      currentChapter.value = chapters.value[chapterIndex].href;
    schedulePersistReadingPosition();
  };

  const handleDragEnter = (event) => {
    const items = event.dataTransfer?.items || [];
    if (
      items.length === 1 &&
      (items[0].type === "application/epub+zip" || items[0].kind === "file")
    ) {
      isDragging.value = true;
      event.currentTarget.dataset.dragging = "true";
    }
  };

  const handleDragLeave = (event) => {
    isDragging.value = false;
    if (event.currentTarget) delete event.currentTarget.dataset.dragging;
  };

  const handleDrop = async (event) => {
    isDragging.value = false;
    if (event.currentTarget) delete event.currentTarget.dataset.dragging;
    const files = event.dataTransfer?.files;
    if (files?.length > 0 && files[0].name.toLowerCase().endsWith(".epub")) {
      await loadEpub(files[0]);
    } else {
      addNotification({
        message: "Please select a valid EPUB file",
        type: "error",
      });
    }
  };

  return {
    handleContentScroll,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
