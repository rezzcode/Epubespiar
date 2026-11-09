<template>
    <div class="sidebar" :class="{ open: isOpen, resizing: isResizing }" :style="{ width: sidebarSize === null ? undefined : `${sidebarSize}px` }">
      <div class="sidebar-header">
        <h3>Table of Contents</h3>
        <!-- span v-if="chaptersCount" class="chapters-count">{{ chaptersCount }}</span -->
      </div>
      <div class="sidebar-resizer" @pointerdown="startResizing" @pointermove="onPointerMove" @pointerup="stopResizing" @pointercancel="stopResizing" @lostpointercapture="stopResizing"></div>
      <div class="sidebar-content" ref="contentContainer">
        <div class="toc-wrapper">
          <ul class="toc-list">
            <li 
              v-for="(item, index) in toc" 
              :key="`chapter-${index}`" 
              class="toc-item"
              :class="{ 
                expanded: isExpanded(item, index)
              }"
            >
              <div class="toc-item-content">
                <button 
                  class="toc-link"
                  :class="{ 
                    active: isExactActiveItem(item.href),
                    'active-parent': !isExactActiveItem(item.href) && hasActiveDescendant(item),
                    'has-subitems': item.subitems && item.subitems.length > 0
                  }"
                  @click.stop="handleItemClick(item, index)"
                  :title="item.label"
                >
                  <span 
                    v-if="item.subitems && item.subitems.length > 0" 
                    class="expand-icon"
                    @click.stop="handleExpandClick(item, index)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </span>
                  <span class="toc-label">{{ item.label }}</span>
                  <span
                    v-if="isExactActiveItem(item.href) || hasActiveDescendant(item)"
                    class="active-indicator"
                    :class="{ 'active-parent-indicator': !isExactActiveItem(item.href) && hasActiveDescendant(item) }"
                  ></span>
                </button>
              </div>

              <!-- Nested subitems -->
              <transition name="expand" @enter="onEnter" @leave="onLeave">
                <ul 
                  v-if="item.subitems && item.subitems.length > 0 && isExpanded(item, index)" 
                  class="toc-sublist"
                >
                  <li 
                    v-for="(subitem, subIndex) in item.subitems" 
                    :key="`subitem-${index}-${subIndex}`" 
                    class="toc-subitem"
                  >
                    <button 
                      class="toc-link toc-sublink"
                      :class="{ active: isExactActiveItem(subitem.href) }"
                      @click.stop="handleNavigate(subitem.href)"
                      :title="subitem.label"
                    >
                      <span class="toc-label">{{ subitem.label }}</span>
                      <span v-if="isExactActiveItem(subitem.href)" class="active-indicator"></span>
                    </button>
                  </li>
                </ul>
              </transition>
            </li>
          </ul>

          <!-- Empty state -->
          <div v-if="toc.length === 0" class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1 2.5A2.5 2.5 0 0 1 3.5 0h8A2.5 2.5 0 0 1 14 2.5v11a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 1 13.5v-11zM3.5 1A1.5 1.5 0 0 0 2 2.5v11A1.5 1.5 0 0 0 3.5 15h8a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 11.5 1h-8z"/>
            </svg>
            <p>No table of contents</p>
          </div>
        </div>

        <!-- Footer with Close Book button -->
        <div class="sidebar-footer">
          <button class="close-book-btn" @click="handleCloseBook">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.5 10c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1z"/>
              <path d="M10.828.122A.5.5 0 0 1 11 .5V1h.5A1.5 1.5 0 0 1 13 2.5V15h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V1.5a.5.5 0 0 1 .43-.495l7-1a.5.5 0 0 1 .398.117zM11.5 2H11v13h1V2.5a.5.5 0 0 0-.5-.5zM4 1.934V15h6V1.077l-6 .857z"/>
            </svg>
            <span>Close Book</span>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';

  export default {
    props: {
      isOpen: {
        type: Boolean,
        default: false
      },
      toc: {
        type: Array,
        default: () => []
      },
      currentChapter: {
        type: String,
        default: null
      }
    },
    emits: ['navigate', 'closeBook'],
    setup(props, { emit }) {
      const expandedItems = ref({});
      const contentContainer = ref(null);
      const isResizing = ref(false);
      const sidebarSize = ref(null);
      let startX = 0;
      let startWidth = 0;
      let resizeHandle = null;
      let activePointerId = null;
      let previousUserSelect = '';

      const onPointerMove = (e) => {
        if (!isResizing.value || e.pointerId !== activePointerId) return;
        const sidebar = resizeHandle.parentElement;
        const configuredMax = parseFloat(getComputedStyle(sidebar).getPropertyValue('--sidebar-width')) || 480;
        const max = Math.min(configuredMax, document.documentElement.clientWidth);
        const min = Math.min(240, max);
        sidebarSize.value = Math.min(max, Math.max(min, startWidth + e.clientX - startX));
      };

      const stopResizing = (e) => {
        if (!isResizing.value || (e?.pointerId !== undefined && e.pointerId !== activePointerId)) return;
        isResizing.value = false;
        document.body.style.userSelect = previousUserSelect;
        if (resizeHandle?.hasPointerCapture(activePointerId)) {
          resizeHandle.releasePointerCapture(activePointerId);
        }
        resizeHandle = null;
        activePointerId = null;
      };

      const startResizing = (e) => {
        if (!props.isOpen || isResizing.value || !e.isPrimary || e.button !== 0) return;
        e.preventDefault();
        resizeHandle = e.currentTarget;
        activePointerId = e.pointerId;
        startX = e.clientX;
        startWidth = resizeHandle.parentElement.getBoundingClientRect().width;
        previousUserSelect = document.body.style.userSelect;
        document.body.style.userSelect = 'none';
        isResizing.value = true;
        resizeHandle.setPointerCapture(activePointerId);
      };

      watch(() => props.isOpen, (isOpen) => {
        if (!isOpen) stopResizing();
      });
      onBeforeUnmount(() => stopResizing());

      const normalizeHref = (href) => String(href || '').trim();
      const getItemKey = (item, index) => normalizeHref(item?.href) || `toc-item-${index}`;

      const isActive = (itemHref, currentChapter = props.currentChapter) => {
        if (!currentChapter || !itemHref) return false;
        const normalizedItem = normalizeHref(itemHref);
        const normalizedCurrent = normalizeHref(currentChapter);

        if (normalizedItem === normalizedCurrent) return true;

        const itemBase = normalizedItem.split('#')[0];
        const currentBase = normalizedCurrent.split('#')[0];

        // Keep base-url matching for chapter-level highlighting while reading
        return itemBase && itemBase === currentBase;
      };

      const hasActiveDescendant = (item, currentChapter = props.currentChapter) => {
        if (!item?.subitems?.length) return false;
        return item.subitems.some((subitem) => {
          if (isActive(subitem.href, currentChapter)) return true;
          return hasActiveDescendant(subitem, currentChapter);
        });
      };

      const expandParentsForActiveChapter = (chapter = props.currentChapter) => {
        const expandAncestors = (items = [], ancestors = []) => {
          items.forEach((item, index) => {
            const key = getItemKey(item, index);
            const currentAncestors = [...ancestors, key];
            const currentIsActive = isActive(item?.href, chapter);
            const descendantIsActive = hasActiveDescendant(item, chapter);

            if (currentIsActive || descendantIsActive) {
              currentAncestors.forEach((ancestorKey) => {
                expandedItems.value[ancestorKey] = true;
              });
            }

            if (item?.subitems?.length) {
              expandAncestors(item.subitems, currentAncestors);
            }
          });
        };

        expandAncestors(props.toc, []);
      };

      const isExpanded = (item, index) => {
        const key = getItemKey(item, index);
        return Boolean(expandedItems.value[key]);
      };

      const toggleExpanded = (item, index) => {
        if (item?.subitems && item.subitems.length > 0) {
          const key = getItemKey(item, index);
          expandedItems.value[key] = !expandedItems.value[key];
        }
      };

      // Initialize first item as expanded
      watch(() => props.toc, (newToc) => {
        expandedItems.value = {};
        if (newToc.length > 0) {
          const firstKey = getItemKey(newToc[0], 0);
          expandedItems.value[firstKey] = true;
        }
        if (props.currentChapter) {
          expandParentsForActiveChapter(props.currentChapter);
        }
      }, { immediate: true });

      // Auto-expand and scroll to active item
      watch(() => props.currentChapter, async (newChapter) => {
        if (newChapter) {
          expandParentsForActiveChapter(newChapter);
          
          // Scroll to active item if sidebar is open
          if (props.isOpen) {
            await nextTick();
            setTimeout(scrollToActive, 100);
          }
        }
      });

      // Watch for sidebar open state to trigger scroll and expansion
      watch(() => props.isOpen, async (isOpen) => {
        if (isOpen && props.currentChapter) {
          expandParentsForActiveChapter(props.currentChapter);

          // Scroll to the active item after expansion
          await nextTick();
          setTimeout(scrollToActive, 150);
        }
      });

      const chaptersCount = computed(() => {
        let count = props.toc.length;
        props.toc.forEach(item => {
          if (item.subitems) count += item.subitems.length;
        });
        return count;
      });

      // Check if this is the exact active item (strict matching)
      // Only return true for exact href match, no parent matching
      const isExactActiveItem = (itemHref, currentChapter = props.currentChapter) => {
        if (!currentChapter || !itemHref) return false;
        const normalizedItem = normalizeHref(itemHref);
        const normalizedCurrent = normalizeHref(currentChapter);
        return normalizedItem === normalizedCurrent;
      };

      // Handle expand icon click - only expand/collapse, no navigation
      const handleExpandClick = (item, index) => {
        toggleExpanded(item, index);
      };

      // Handle main item click: toggle expansion for parents and navigate when href exists
      const handleItemClick = (item, index) => {
        const hasSubitems = item.subitems && item.subitems.length > 0;
        if (hasSubitems) {
          // Toggle section visibility and navigate to parent chapter location
          toggleExpanded(item, index);
        }

        if (item.href) {
          handleNavigate(item.href);
        }
      };

      const handleNavigate = (href) => {
        emit('navigate', href);
      };

      const handleCloseBook = () => {
        emit('closeBook');
      };

      const scrollToActive = () => {
        const activeElement = contentContainer.value?.querySelector('.toc-link.active');
        if (activeElement) {
          // Scroll to center the active item in the viewport
          const container = contentContainer.value;
          const elementTop = activeElement.offsetTop;
          const elementHeight = activeElement.offsetHeight;
          const containerHeight = container.clientHeight;
          
          // Center the active item in the viewport
          const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);
          container.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
        }
      };

      const onEnter = (el) => {
        el.style.height = '0';
        void el.offsetHeight; // trigger reflow
        el.style.height = el.scrollHeight + 'px';
      };

      const onLeave = (el) => {
        el.style.height = el.scrollHeight + 'px';
        void el.offsetHeight; // trigger reflow
        el.style.height = '0';
      };

      return {
        expandedItems,
        contentContainer,
        sidebarSize,
        isResizing,
        onPointerMove,
        startResizing,
        stopResizing,
        chaptersCount,
        isExactActiveItem,
        isActive,
        hasActiveDescendant,
        isExpanded,
        toggleExpanded,
        handleExpandClick,
        handleItemClick,
        handleNavigate,
        handleCloseBook,
        scrollToActive,
        onEnter,
        onLeave
      };
    }
  }
  </script>
  
  <style scoped>
  .sidebar {
    width: var(--sidebar-size, 240px);
    min-width: min(240px, 100vw);
    max-width: min(var(--sidebar-width, 480px), 100vw);
    background-color: var(--sidebar-bg-color, #d4d4d7);
    height: 100%;
    position: fixed;
    left: 0;
    top: 36px; /* Height of header toolbar */
    transform: translateX(-100%);
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100;
    border-right: 2px solid var(--toolbar-sp-color, #6a666687);
    box-shadow: none;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Change from overflow-y: auto to hidden */
  }

  .sidebar-resizer {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: col-resize;
    touch-action: none;
    background: transparent;
    z-index: 2;
  }

  .sidebar.resizing {
    user-select: none;
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
  
  .sidebar-header {
    padding: 6px;
    background-color: var(--toolbar-bg-color);
    border-bottom: 2px solid var(--toolbar-sp-color, #6a666687);
    position: sticky;
    top: 0;
    z-index: 1;
    flex-shrink: 0; /* Prevent header from shrinking */
  }
  
  .sidebar-header h3 {
    margin: 0;
    font-size: 14px;
    color: var(--text-color, black);
  }
  
  .sidebar-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-height: 0; /* Important for flex child to respect parent constraints */
    scrollbar-width: thin;
    scrollbar-color: rgba(128, 128, 128, 0.4) transparent;
  }

  /* Webkit scrollbar styling for sidebar-content */
  .sidebar-content::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-content::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.4);
    border-radius: 3px;
  }

  .sidebar-content::-webkit-scrollbar-thumb:hover {
    background: rgba(128, 128, 128, 0.6);
  }

  .toc-wrapper {
    flex: 1;
    padding: 10px 0;
  }

  .sidebar-footer {
    padding: 16px;
    padding-bottom: 50px;
    border-top: 1px solid var(--toolbar-sp-color, #6a666687);
    flex-shrink: 0; /* Prevent footer from shrinking */
    background-color: var(--sidebar-bg-color, #d4d4d7); /* Match sidebar background */
  }

  .close-book-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px 16px;
    background-color: var(--close-btn-bg, #f3f4f6);
    color: var(--close-btn-color, #4b5563);
    border: 1px solid var(--close-btn-border, #e5e7eb);
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .close-book-btn:hover {
    background-color: var(--close-btn-hover-bg, #e5e7eb);
    border-color: var(--close-btn-hover-border, #d1d5db);
  }

  .close-book-btn:active {
    transform: scale(0.98);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: var(--text-color-secondary, #666);
    opacity: 0.6;
  }

  .empty-state svg {
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    font-size: 13px;
    text-align: center;
  }
  
  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .toc-item {
    margin-bottom: 8px;
  }

  .toc-link {
    all: unset;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    color: var(--text-color, #1a1a1a);
    text-decoration: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 400;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    width: 100%;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-left: 3px solid transparent;
  }

  .toc-link:hover {
    background-color: var(--link-hover-bg, rgba(16, 185, 129, 0.08));
    color: var(--hover-outline-color, #10b981);
  }

  .toc-link.active {
    background-color: var(--active-bg, rgba(16, 185, 129, 0.12));
    color: var(--hover-outline-color, #10b981);
    font-weight: 500;
    border-left-color: var(--hover-outline-color, #10b981);
  }

  .toc-link.active-parent {
    background-color: var(--active-bg, rgba(16, 185, 129, 0.08));
    color: var(--hover-outline-color, #10b981);
    border-left-color: var(--hover-outline-color, #10b981);
    opacity: 0.92;
  }

  .toc-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--hover-outline-color, #10b981), var(--accent-color, #059669));
  }

  /* Parent items with subitems should NOT be navigable and should have different styling */
  .toc-link.has-subitems {
    font-weight: 600;
  }

  .toc-link.has-subitems:not(.active) {
    /* Parent entries are navigable now, so keep pointer cursor for discoverability. */
    cursor: pointer;
  }

  .toc-link.has-subitems:not(.active):hover {
    background-color: var(--link-hover-bg, rgba(16, 185, 129, 0.05));
    color: var(--text-color, #1a1a1a);
  }

  .expand-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    transition: transform 0.3s ease;
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    margin-left: -2px;
  }

  .expand-icon:hover {
    background-color: var(--expand-icon-hover, rgba(16, 185, 129, 0.1));
  }

  .toc-item.expanded .expand-icon {
    transform: rotate(90deg);
  }

  .toc-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .active-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: var(--hover-outline-color, #10b981);
    border-radius: 50%;
    flex-shrink: 0;
    animation: pulse 2s ease-in-out infinite;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
  }

  .active-parent-indicator {
    width: 6px;
    height: 6px;
    opacity: 0.8;
    box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
    animation: none;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(0.95);
    }
  }
  
  .toc-sublist {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow: hidden;
    transition: height 0.3s ease;
  }

  .toc-sublist .toc-link {
    padding-left: 40px;
    font-size: 12px;
    border-left: 3px solid transparent;
  }

  .toc-sublist .toc-link:hover {
    background-color: var(--link-hover-bg, rgba(16, 185, 129, 0.06));
  }

  .toc-sublist .toc-link.active {
    background-color: var(--active-bg, rgba(16, 185, 129, 0.1));
    border-left-color: var(--hover-outline-color, #10b981);
  }
  
  .toc-subitem {
    margin: 0;
    position: relative;
  }

  /* Expand/collapse animation */
  .expand-enter-active, .expand-leave-active {
    transition: height 0.3s ease;
    overflow: hidden;
  }

  .expand-enter-from, .expand-leave-to {
    height: 0 !important;
    overflow: hidden;
  }
  
  .toc-sublist {
    list-style: none;
    padding-left: 15px;
    margin-top: 5px;
  }
  
  .toc-subitem {
    margin-bottom: 5px;
  }
  
  @media (max-width: 767px) {
    .sidebar {
      width: 240px;
    }
  }

  @media (min-width: 768px) {
    .sidebar {
      width: 270px;
    }
  }

  @media (max-width: 480px) {
    .sidebar {
      top: 32px;
    }
  }


  

</style>
