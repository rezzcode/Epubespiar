<template>
    <div class="sidebar" :class="{ open: isOpen }" @mouseleave="stopResizing">
      <div class="sidebar-header">
        <h3>Table of Contents</h3>
        <!-- span v-if="chaptersCount" class="chapters-count">{{ chaptersCount }}</span -->
      </div>
      <div class="sidebar-resizer" @mousedown="startResizing"></div>
      <div class="sidebar-content" ref="contentContainer">
        <ul class="toc-list">
          <li 
            v-for="(item, index) in toc" 
            :key="`chapter-${index}`" 
            class="toc-item"
            :class="{ 
              expanded: expandedItems[index]
            }"
          >
            <div class="toc-item-content">
              <button 
                class="toc-link"
                :class="{ 
                  active: isExactActiveItem(item.href),
                  'has-subitems': item.subitems && item.subitems.length > 0
                }"
                @click.stop="handleItemClick(item, index)"
                :title="item.label"
              >
                <span 
                  v-if="item.subitems && item.subitems.length > 0" 
                  class="expand-icon"
                  @click.stop="handleExpandClick(index)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </span>
                <span class="toc-label">{{ item.label }}</span>
                <span v-if="isExactActiveItem(item.href)" class="active-indicator"></span>
              </button>
            </div>

            <!-- Nested subitems -->
            <transition name="expand" @enter="onEnter" @leave="onLeave">
              <ul 
                v-if="item.subitems && item.subitems.length > 0 && expandedItems[index]" 
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
    </div>
  </template>
  
  <script>
  import { ref, computed, watch, nextTick } from 'vue';

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
    emits: ['navigate'],
    setup(props, { emit }) {
      const expandedItems = ref({});
      const contentContainer = ref(null);
      const isResizing = ref(false);
      const startX = ref(0);
      const startWidth = ref(0);
      const onMouseMove = (e) => {
        if (!isResizing.value) return;
        const dx = e.clientX - startX.value;
        let newWidth = startWidth.value + dx;
        const min = 240;
        const max = 480;
        if (newWidth < min) newWidth = min;
        if (newWidth > max) newWidth = max;
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
      };

      const startResizing = (e) => {
        isResizing.value = true;
        startX.value = e.clientX;
        const el = e.currentTarget?.parentElement;
        const rect = el?.getBoundingClientRect();
        startWidth.value = rect ? rect.width : 320;
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', stopResizing);
      };

      const stopResizing = () => {
        if (!isResizing.value) return;
        isResizing.value = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', stopResizing);
      };

      // Initialize first item as expanded
      watch(() => props.toc, (newToc) => {
        if (newToc.length > 0 && Object.keys(expandedItems.value).length === 0) {
          expandedItems.value[0] = true;
        }
      }, { immediate: true });

      // Auto-expand and scroll to active item
      watch(() => props.currentChapter, async (newChapter) => {
        if (newChapter) {
          // Find and expand parent chapter containing active item
          props.toc.forEach((item, index) => {
            if (item.subitems && item.subitems.length > 0) {
              const hasActiveSubitem = item.subitems.some(sub => isActive(sub.href, newChapter));
              if (hasActiveSubitem) {
                expandedItems.value[index] = true;
              }
            }
          });
          
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
          // Auto-expand the parent chapter of current location
          props.toc.forEach((item, index) => {
            // Check if current chapter is this item or its subitem
            const isCurrentItem = isActive(item.href, props.currentChapter);
            const hasActiveSubitem = item.subitems?.some(sub => 
              isActive(sub.href, props.currentChapter)
            );
            
            if ((isCurrentItem || hasActiveSubitem) && item.subitems && item.subitems.length > 0) {
              expandedItems.value[index] = true;
            }
          });

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
        const normalizedItem = String(itemHref).trim();
        const normalizedCurrent = String(currentChapter).trim();
        return normalizedItem === normalizedCurrent;
      };

      const isActive = (itemHref, currentChapter = props.currentChapter) => {
        if (!currentChapter || !itemHref) return false;
        // Exact match including hash for precise subtopic tracking
        const normalizedItem = String(itemHref).trim();
        const normalizedCurrent = String(currentChapter).trim();
        
        // First check for exact match (including hash)
        if (normalizedItem === normalizedCurrent) return true;
        
        // If no exact match, check base URL (without hash) only if current has no hash
        // This prevents parent chapters from being highlighted when on a subtopic
        if (!normalizedCurrent.includes('#')) {
          const itemBase = normalizedItem.split('#')[0];
          const currentBase = normalizedCurrent.split('#')[0];
          return itemBase === currentBase;
        }
        
        return false;
      };

      const toggleExpanded = (index) => {
        if (props.toc[index].subitems && props.toc[index].subitems.length > 0) {
          expandedItems.value[index] = !expandedItems.value[index];
        }
      };

      // Handle expand icon click - only expand/collapse, no navigation
      const handleExpandClick = (index) => {
        toggleExpanded(index);
      };

      // Handle main item click - expand if has subitems, navigate if subitem or childless parent
      const handleItemClick = (item, index) => {
        const hasSubitems = item.subitems && item.subitems.length > 0;
        if (hasSubitems) {
          // Only expand/collapse, don't navigate
          toggleExpanded(index);
        } else {
          // No subitems, so navigate to this item
          handleNavigate(item.href);
        }
      };

      const handleNavigate = (href) => {
        emit('navigate', href);
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
        startResizing,
        stopResizing,
        chaptersCount,
        isExactActiveItem,
        isActive,
        toggleExpanded,
        handleExpandClick,
        handleItemClick,
        handleNavigate,
        scrollToActive,
        onEnter,
        onLeave
      };
    }
  }
  </script>
  
  <style scoped>
  .sidebar {
    width: var(--sidebar-size, 320px);
    background-color: var(--sidebar-bg-color, #d4d4d7);
    height: 100%;
    position: fixed;
    left: 0;
    top: 36px; /* Height of header toolbar */
    transform: translateX(-100%);
      .sidebar-resizer {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 6px;
        cursor: col-resize;
        background: transparent;
      }
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100;
    overflow-y: auto;
    border-right: 2px solid var(--toolbar-sp-color, #6a666687);
    box-shadow: none;
    scrollbar-width: thin;
    scrollbar-color: rgba(128, 128, 128, 0.4) transparent;
  }

  /* Webkit scrollbar styling */
  .sidebar::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.4);
    border-radius: 3px;
  }

  .sidebar::-webkit-scrollbar-thumb:hover {
    background: rgba(128, 128, 128, 0.6);
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
  }
  
  .sidebar-header h3 {
    margin: 0;
    font-size: 14px;
    color: var(--text-color, black);
  }
  
  .sidebar-content {
    padding: 10px 0;
    padding-bottom: 50px;
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
    cursor: default;
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
    width: 6px;
    height: 6px;
    background: var(--hover-outline-color, #10b981);
    border-radius: 50%;
    flex-shrink: 0;
    animation: pulse 2s ease-in-out infinite;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
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
      width: 320px;
    }
  }

  @media (max-width: 480px) {
    .sidebar {
      top: 32px;
    }
  }
  
  @media (prefers-color-scheme: dark) {
    .sidebar {
      --sidebar-bg-color: #2a2a2e;
      --text-color: #f5f5f5;
      --text-color-secondary: #8f8f9d;
      --hover-outline-color: #8f8f9d;
      --toolbar-sp-color: #00000063;
      --link-hover-bg: rgba(143, 143, 157, 0.08);
      --active-bg: rgba(143, 143, 157, 0.12);
      --accent-color: #6a6a75;
    }
    
    .sidebar.open {
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
    }
  }
</style>