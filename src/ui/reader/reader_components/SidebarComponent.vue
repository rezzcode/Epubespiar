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
    width: 250px;
    background-color: var(--sidebar-bg-color, #d4d4d7);
    height: 100%;
    position: absolute;
    left: -250px;
    transition: transform 0.3s ease;
    z-index: 10;
    overflow-y: auto;
    border-right: 2px solid var(--toolbar-sp-color, #6a666687);
  }
  
  .sidebar.open {
    transform: translateX(250px);
  }
  
  .sidebar-header {
    padding: 6px;
    background-color: var(--toolbar-bg-color);
    border-bottom: 2px solid var(--toolbar-sp-color, #6a666687);
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
  
  @media (prefers-color-scheme: dark) {
    .sidebar {
      --sidebar-bg-color: #2a2a2e;
      --text-color: #f5f5f5;
      --hover-outline-color: #8f8f9d;
      --toolbar-sp-color: #00000063;
    }
  }
</style>