<template>
  <div class="epub-renderer" ref="rendererContainer">
    <div v-if="!isBookLoaded" class="welcome-screen">
      <div class="welcome-content">
        <div class="book-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
          </svg>
        </div>
        <h2>Welcome to Epubespiar</h2>
        <p>Drop an EPUB file here or click "Open EPUB" to start reading</p>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Loading book content...</p>
    </div>

    <div
      v-else
      id="book-content"
      ref="bookContent"
      :style="{ transform: `scale(${zoomLevel})` }"
      @scroll.passive="handleScroll"
      @click="handleContentClick"
    >
      <div class="content-wrapper">
        <article
          v-for="(chapter, index) in chapters"
          :key="chapter.href || index"
          :data-chapter-index="index"
          :id="`chapter-${index}`"
          class="chapter-section"
          :ref="(el) => setChapterRef(index, el)"
        >
          <header class="chapter-header">
            <h2>{{ chapter.title }}</h2>
          </header>

          <div
            class="chapter-content"
            :style="{ fontSize: `${fontSize}px`, lineHeight: 1.7 }"
            v-html="extractBodyContent(chapter.content)"
          ></div>

          <div v-if="index !== chapters.length - 1" class="chapter-divider">•••</div>
        </article>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, watch } from 'vue';

export default {
  props: {
    isLoading: { type: Boolean, default: false },
    isBookLoaded: { type: Boolean, default: false },
    zoomLevel: { type: Number, default: 1 },
    fontSize: { type: Number, default: 16 },
    chapters: { type: Array, default: () => [] }
  },
  emits: ['content-scroll', 'navigate-internal'],
  setup(props, { emit, expose }) {
    const rendererContainer = ref(null);
    const bookContent = ref(null);
    const chapterRefs = ref(new Map());

    const setChapterRef = (index, el) => {
      if (el) {
        chapterRefs.value.set(index, el);
      } else {
        chapterRefs.value.delete(index);
      }
    };

    const getActiveChapterIndex = () => {
      const container = bookContent.value;
      if (!container || !props.chapters.length) return 0;

      const threshold = container.scrollTop + 80;
      let activeIndex = 0;

      for (let index = 0; index < props.chapters.length; index += 1) {
        const chapterEl = chapterRefs.value.get(index);
        if (!chapterEl) continue;
        if (chapterEl.offsetTop <= threshold) {
          activeIndex = index;
        } else {
          break;
        }
      }

      return activeIndex;
    };

    const handleScroll = () => {
      const container = bookContent.value;
      if (!container) return;

      const maxScroll = Math.max(container.scrollHeight - container.clientHeight, 1);
      const progress = Math.min(100, Math.max(0, (container.scrollTop / maxScroll) * 100));
      const chapterIndex = getActiveChapterIndex();

      emit('content-scroll', { progress, chapterIndex });
    };

    const extractBodyContent = (html) => {
      if (!html) return '';
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      return bodyMatch ? bodyMatch[1] : html;
    };

    const scrollToChapter = (index, fragment = null) => {
      const container = bookContent.value;
      const chapterEl = chapterRefs.value.get(index);
      if (!container || !chapterEl) return;

      container.scrollTo({ top: chapterEl.offsetTop - 10, behavior: 'smooth' });

      if (fragment) {
        setTimeout(() => {
          const fragmentEl = chapterEl.querySelector(`#${CSS.escape(fragment)}`)
            || chapterEl.querySelector(`[name="${fragment}"]`);
          if (fragmentEl) {
            fragmentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 250);
      }
    };

    const handleContentClick = (event) => {
      const anchor = event.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:');
      if (isExternal) return;

      event.preventDefault();

      const chapterRoot = event.target.closest('[data-chapter-index]');
      const chapterIndex = chapterRoot ? Number(chapterRoot.getAttribute('data-chapter-index')) : 0;
      emit('navigate-internal', { href, chapterIndex });
    };

    const getContentElement = () => bookContent.value;

    watch(
      () => props.chapters,
      async () => {
        chapterRefs.value.clear();
        await nextTick();
        if (bookContent.value) {
          bookContent.value.scrollTop = 0;
          handleScroll();
        }
      },
      { deep: true }
    );

    expose({
      scrollToChapter,
      getContentElement
    });

    return {
      rendererContainer,
      bookContent,
      setChapterRef,
      extractBodyContent,
      handleScroll,
      handleContentClick
    };
  }
};
</script>

<style scoped>
.epub-renderer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--background-color, #ffffff);
  color: var(--text-color, #1a1a1a);
  overflow: hidden;
}

.welcome-screen,
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

.book-icon {
  color: var(--hover-outline-color, #10b981);
  margin-bottom: 24px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.welcome-content h2 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
}

.welcome-content > p {
  font-size: 16px;
  color: var(--text-secondary, #6b7280);
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 4px solid var(--spinner-bg, rgba(16, 185, 129, 0.2));
  border-top-color: var(--hover-outline-color, #10b981);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

#book-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  transition: transform 0.2s ease;
  transform-origin: top center;
  height: 100vh;
}

.content-wrapper {
  max-width: 980px;
  margin: 0 auto;
  width: 100%;
  padding: 24px 56px 48px;
  background: var(--epub-container-bg, white);
}

.chapter-section {
  margin-bottom: 16px;
}

.chapter-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--border-color, #d1d5db);
  padding-bottom: 10px;
}

.chapter-content {
  line-height: 1.7;
}

.chapter-content :deep(h1),
.chapter-content :deep(h2),
.chapter-content :deep(h3),
.chapter-content :deep(h4),
.chapter-content :deep(h5),
.chapter-content :deep(h6) {
  margin-top: 1.6em;
  margin-bottom: 0.7em;
}

.chapter-content :deep(p) {
  margin-bottom: 1em;
}

.chapter-content :deep(img),
.chapter-content :deep(svg),
.chapter-content :deep(video),
.chapter-content :deep(canvas) {
  max-width: 100%;
  height: auto;
}

.chapter-content :deep(table) {
  width: 100%;
  overflow-x: auto;
  display: block;
}

.chapter-content :deep(a) {
  color: var(--epub-text-color, #10b981);
  text-decoration: none;
}

.chapter-divider {
  text-align: center;
  padding: 24px 0 14px;
  opacity: 0.5;
  letter-spacing: 5px;
}

@media (max-width: 767px) {
  .content-wrapper {
    padding: 16px 14px 40px;
  }

  .chapter-header h2 {
    font-size: 20px;
  }
}
</style>
