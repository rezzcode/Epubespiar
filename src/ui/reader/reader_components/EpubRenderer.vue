<template>
  <div class="epub-renderer" ref="rendererContainer">
    <div v-if="!isBookLoaded" class="welcome-screen">
      <div class="welcome-content">
        <div class="book-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
          </svg>
          <!--img src="../../../../public/icon/64.png" alt="Epub Icon" /-->
        </div>
        <h2>Welcome to Epubespiar</h2>
        <p>Drop an EPUB file here or click "Open EPUB" to start reading</p>
        <div class="features">
          <div class="feature-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
            </svg>
            <span>Customizable font size</span>
          </div>
          <div class="feature-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            <span>Table of contents navigation</span>
          </div>
          <div class="feature-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
            </svg>
            <span>Continuous scrolling mode</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-else-if="isLoading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Loading book content...</p>
    </div>
    
    <!-- EPUB content container - epubjs renders here -->
    <div 
      v-show="isBookLoaded && !isLoading"
      id="book-content" 
      ref="bookContent"
      :style="{ transform: `scale(${zoomLevel})` }"
    ></div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    isBookLoaded: {
      type: Boolean,
      default: false
    },
    zoomLevel: {
      type: Number,
      default: 1
    }
  },
  setup(props) {
    const rendererContainer = ref(null);
    const bookContent = ref(null);

    return {
      rendererContainer,
      bookContent
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
  transition: background-color 0.3s ease, color 0.3s ease;
  overflow: hidden;
}

.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

/** this is if we used an icon for the welcome content logo */
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
  background: linear-gradient(135deg, var(--hover-outline-color, #10b981), #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-content > p {
  font-size: 16px;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 40px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 32px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--feature-bg, rgba(16, 185, 129, 0.05));
  border-radius: 12px;
  border: 1px solid var(--feature-border, rgba(16, 185, 129, 0.2));
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: var(--feature-bg-hover, rgba(16, 185, 129, 0.1));
  transform: translateX(8px);
}

.feature-item svg {
  color: var(--hover-outline-color, #10b981);
  flex-shrink: 0;
}

.feature-item span {
  font-size: 14px;
  font-weight: 500;
  text-align: left;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  gap: 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--spinner-bg, rgba(16, 185, 129, 0.2));
  border-top-color: var(--hover-outline-color, #10b981);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-screen p {
  font-size: 16px;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

#book-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 20px;
  transition: transform 0.3s ease;
  transform-origin: center;
  background-color: var(--background-color);
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Desktop: comfortable reading width */
@media (min-width: 1024px) {
  #book-content {
    padding: 10px 80px;
    padding-bottom: 2px;
  }
}

/* Tablet: medium padding */
@media (min-width: 768px) and (max-width: 1023px) {
  #book-content {
    padding: 10px 40px;
    padding-bottom: 2px;
  }
}

/* Mobile: minimal padding */
@media (max-width: 767px) {
  #book-content {
    padding: 10px;
    padding-bottom: 2px;
  }
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 40px 60px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb, rgba(16, 185, 129, 0.3)) transparent;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

.content-wrapper::-webkit-scrollbar {
  width: 8px;
}

.content-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.content-wrapper::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, rgba(16, 185, 129, 0.3));
  border-radius: 4px;
}

.content-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, rgba(16, 185, 129, 0.5));
}

.chapter-section {
  margin-bottom: 0;
  scroll-margin-top: 20px;
  transition: opacity 0.3s ease;
  min-height: 100px; /* Ensure sections have height */
}

.chapter-divider {
  text-align: center;
  padding: 40px 0;
  color: var(--text-secondary, #9ca3af);
  font-size: 20px;
  letter-spacing: 8px;
  opacity: 0.5;
  user-select: none;
}

.chapter-content {
  font-family: 'Georgia', 'Cambria', 'Times New Roman', serif;
  line-height: 1.8;
  text-align: justify;
  hyphens: auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: block;
  width: 100%;
}

.chapter-content :deep(h1),
.chapter-content :deep(h2),
.chapter-content :deep(h3),
.chapter-content :deep(h4),
.chapter-content :deep(h5),
.chapter-content :deep(h6) {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 700;
  margin-top: 2em;
  margin-bottom: 0.8em;
  color: var(--heading-color, #111827);
  line-height: 1.3;
}

.chapter-content :deep(h1) {
  font-size: 2.2em;
  border-bottom: 3px solid var(--hover-outline-color, #10b981);
  padding-bottom: 0.3em;
}

.chapter-content :deep(h2) {
  font-size: 1.8em;
}

.chapter-content :deep(h3) {
  font-size: 1.5em;
}

.chapter-content :deep(p) {
  margin-bottom: 1.2em;
  text-indent: 1.5em;
}

.chapter-content :deep(p:first-of-type) {
  text-indent: 0;
}

.chapter-content :deep(a) {
  color: var(--hover-outline-color, #10b981);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.chapter-content :deep(a:hover) {
  border-bottom-color: var(--hover-outline-color, #10b981);
}

.chapter-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 2em auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chapter-content :deep(blockquote) {
  border-left: 4px solid var(--hover-outline-color, #10b981);
  padding-left: 20px;
  margin: 1.5em 0;
  font-style: italic;
  color: var(--text-secondary, #6b7280);
}

.chapter-content :deep(code) {
  background: var(--code-bg, rgba(16, 185, 129, 0.1));
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.chapter-content :deep(pre) {
  background: var(--code-bg, rgba(16, 185, 129, 0.1));
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5em 0;
}

.chapter-content :deep(ul),
.chapter-content :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.chapter-content :deep(li) {
  margin-bottom: 0.5em;
}

.chapter-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.9em;
}

.chapter-content :deep(th),
.chapter-content :deep(td) {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  text-align: left;
}

.chapter-content :deep(th) {
  background: var(--table-header-bg, rgba(16, 185, 129, 0.1));
  font-weight: 600;
}

.chapter-content :deep(tr:nth-child(even)) {
  background: var(--table-row-bg, rgba(0, 0, 0, 0.02));
}

.chapter-content :deep(.table-wrapper) {
  overflow-x: auto;
  margin: 1.5em 0;
}

.chapter-content :deep(hr) {
  border: none;
  border-top: 2px solid var(--border-color, #d1d5db);
  margin: 2em 0;
}

.chapter-content :deep(em),
.chapter-content :deep(i) {
  font-style: italic;
}

.chapter-content :deep(strong),
.chapter-content :deep(b) {
  font-weight: 700;
  color: var(--heading-color, #111827);
}

.chapter-content :deep(sup),
.chapter-content :deep(sub) {
  font-size: 0.75em;
}

.chapter-content :deep(.search-highlight) {
  background: var(--highlight-bg, #fde047);
  color: #000;
  padding: 2px 4px;
  border-radius: 2px;
}

.navigation-controls {
  position: fixed;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  padding: 0 20px;
  z-index: 10;
}

.nav-button {
  pointer-events: all;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--nav-button-bg, rgba(16, 185, 129, 0.9));
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  opacity: 0.7;
}

.nav-button:hover:not(:disabled) {
  opacity: 1;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.nav-button:active:not(:disabled) {
  transform: scale(0.95);
}

.nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: var(--nav-button-disabled, #9ca3af);
}

/* Tablet */
@media (max-width: 1023px) {
  .content-wrapper {
    padding: 30px 40px;
  }
  
  .welcome-content h2 {
    font-size: 28px;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .content-wrapper {
    padding: 20px 16px;
  }
  
  .welcome-content {
    padding: 0 16px;
  }
  
  .welcome-content h2 {
    font-size: 24px;
  }
  
  .welcome-content > p {
    font-size: 14px;
  }
  
  .features {
    gap: 12px;
  }
  
  .feature-item {
    padding: 10px 16px;
  }
  
  .feature-item span {
    font-size: 13px;
  }
  
  .navigation-controls {
    padding: 0 10px;
  }
  
  .nav-button {
    width: 40px;
    height: 40px;
  }
  
  .chapter-divider {
    padding: 30px 0;
    font-size: 18px;
  }
}

@media (prefers-color-scheme: dark) {
  .epub-renderer {
    --heading-color: #f5f5f7;
    --feature-bg: rgba(143, 143, 157, 0.08);
    --feature-bg-hover: rgba(143, 143, 157, 0.15);
    --feature-border: rgba(143, 143, 157, 0.3);
    --scrollbar-thumb: rgba(143, 143, 157, 0.4);
    --scrollbar-thumb-hover: rgba(143, 143, 157, 0.6);
    --nav-button-bg: rgba(143, 143, 157, 0.9);
  }
  #book-content {
    background-color: var(--background-color);
    color: var(--text-color);
  }

  .welcome-content h2 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 12px;
    background: var(--text-color);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}
</style>