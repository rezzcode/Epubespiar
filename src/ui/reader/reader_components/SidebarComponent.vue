<template>
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-header">
        <h3>Table of Contents</h3>
      </div>
      <div class="sidebar-content">
        <ul class="toc-list">
          <li v-for="(item, index) in toc" :key="index" class="toc-item">
            <a href="#" @click.prevent="$emit('navigate', item.href)">
              {{ item.label }}
            </a>
            <ul v-if="item.subitems && item.subitems.length > 0" class="toc-sublist">
              <li v-for="(subitem, subIndex) in item.subitems" :key="subIndex" class="toc-subitem">
                <a href="#" @click.prevent="$emit('navigate', subitem.href)">
                  {{ subitem.label }}
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      isOpen: {
        type: Boolean,
        default: false
      },
      toc: {
        type: Array,
        default: () => []
      }
    },
    emits: ['navigate']
  }
  </script>
  
  <style scoped>
  .sidebar {
    width: 280px;
    background-color: var(--sidebar-bg-color, #d4d4d7);
    height: 100%;
    position: fixed;
    left: 0;
    top: 36px; /* Height of header toolbar */
    transform: translateX(-100%);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    z-index: 100;
    overflow-y: auto;
    border-right: 2px solid var(--toolbar-sp-color, #6a666687);
    box-shadow: none;
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
    padding: 10px;
    padding-bottom: 50px;
  }
  
  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .toc-item {
    margin-bottom: 8px;
  }
  
  .toc-item a {
    color: var(--text-color, black);
    text-decoration: none;
    display: block;
    padding: 5px 0;
    transition: color 0.2s ease;
  }
  
  .toc-item a:hover {
    color: var(--hover-outline-color, #646cff);
  }
  
  .toc-sublist {
    list-style: none;
    padding-left: 15px;
    margin-top: 5px;
  }
  
  .toc-subitem {
    margin-bottom: 5px;
  }
  
  /* Mobile: Narrower sidebar */
  @media (max-width: 767px) {
    .sidebar {
      width: 240px;
    }
  }
  
  /* Tablet and up: Wider sidebar */
  @media (min-width: 768px) {
    .sidebar {
      width: 320px;
    }
  }

  /* Small screens: Match reduced toolbar header height (36px - 4px = 32px) */
  @media (max-width: 480px) {
    .sidebar {
      top: 32px;
    }
  }
  
  @media (prefers-color-scheme: dark) {
    .sidebar {
      --sidebar-bg-color: #2a2a2e;
      --text-color: #f5f5f5;
      --hover-outline-color: #8f8f9d;
      --toolbar-sp-color: #00000063;
    }
    
    .sidebar.open {
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
    }
  }
</style>