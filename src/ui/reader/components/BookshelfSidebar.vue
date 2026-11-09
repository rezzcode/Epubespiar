<template>
  <transition name="sidebar-slide">
    <div v-if="isOpen" class="bookshelf-container">
      <!-- Backdrop -->
      <div class="bookshelf-backdrop" @click="handleClose"></div>
      
      <!-- Main Sidebar -->
      <aside class="bookshelf-sidebar">
        <!-- Header -->
        <div class="bookshelf-header">
          <div class="header-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
            </svg>
            <h2>Library</h2>
          </div>
          <div class="header-actions">
            <!-- Collections toggle for mobile -->
            <button @click="toggleCollections" class="icon-button collections-toggle-mobile" title="Collections">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5z"/>
              </svg>
            </button>
            <button @click="handleClose" class="icon-button" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="bookshelf-main">
          <!-- Collections Sidebar (Desktop) / Nested Sidebar (Mobile) -->
          <transition name="collections-slide">
            <aside 
              v-if="showCollections" 
              class="collections-sidebar"
              :class="{ 'mobile-nested': isMobile }"
            >
              <div class="collections-header">
                <h3>Collections</h3>
                <button @click="toggleCollections" class="icon-button close-collections-mobile" title="Close Collections">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                  </svg>
                </button>
              </div>
              <div class="collections-list">
                <button
                  v-for="collection in collections"
                  :key="collection.id"
                  @click="selectCollection(collection)"
                  :class="['collection-item', { active: selectedCollection?.id === collection.id }]"
                >
                  <span class="collection-name">{{ collection.name }}</span>
                  <span class="collection-count">{{ getCollectionBookCount(collection) }}</span>
                </button>
              </div>
              <button @click="showNewCollectionDialog = true" class="new-collection-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                </svg>
                New Collection
              </button>
            </aside>
          </transition>

          <!-- Books Grid -->
          <div class="books-container">
            <!-- Upload Section -->
            <div class="upload-section">
              <input 
                type="file" 
                ref="fileInput"
                accept=".epub" 
                @change="handleFileSelected"
                class="file-input-hidden"
              >
              <button @click="triggerFileInput" class="upload-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
                </svg>
                Upload EPUB
              </button>
            </div>

            <!-- Books Grid -->
            <div v-if="filteredBooks.length === 0" class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
              </svg>
              <p>No books yet</p>
              <span>Upload an EPUB file to get started</span>
            </div>

            <div v-else class="books-grid">
              <div 
                v-for="book in filteredBooks" 
                :key="book.id"
                class="book-card"
              >
                <div class="book-cover-wrapper" @click="handleBookSelect(book)">
                  <img 
                    v-if="book.cover" 
                    :src="book.cover" 
                    :alt="book.title"
                    class="book-cover"
                  />
                  <div v-else class="book-cover-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
                    </svg>
                  </div>
                  <div v-if="book.progress > 0" class="progress-bar-wrapper">
                    <div class="progress-bar" :style="{ width: book.progress + '%' }"></div>
                  </div>
                  <!-- Action buttons overlay -->
                  <div class="book-actions">
                    <button 
                      @click.stop="openCollectionMenu(book)" 
                      class="book-action-btn collection-btn"
                      title="Add to collection"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3M1.5 4v-.5a1 1 0 0 1 1-1h3.672a1 1 0 0 1 .707.293L7.586 3.5A1 1 0 0 0 8.293 3.793l.828.828A1 1 0 0 1 9.828 5h3.982a1 1 0 0 1 .996 1.09l-.637 7a1 1 0 0 1-.996.91H2.826a1 1 0 0 1-.995-.91l-.637-7A1 1 0 0 1 2.19 5h-.69z"/>
                      </svg>
                    </button>
                    <button 
                      @click.stop="handleDeleteBook(book)" 
                      class="book-action-btn delete-btn"
                      title="Remove from library"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="book-info" @click="handleBookSelect(book)">
                  <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
                  <p class="book-author" :title="book.author">{{ book.author }}</p>
                  <div class="book-meta">
                    <span v-if="book.progress > 0" class="progress-text">{{ Math.round(book.progress) }}%</span>
                    <span v-if="book.lastOpened" class="last-opened">{{ formatDate(book.lastOpened) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      
      <!-- New Collection Dialog -->
      <div v-if="showNewCollectionDialog" class="dialog-overlay" @click.self="showNewCollectionDialog = false">
        <div class="dialog-content">
          <div class="dialog-header">
            <h3>Create New Collection</h3>
            <button @click="showNewCollectionDialog = false" class="icon-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
              </svg>
            </button>
          </div>
          <div class="dialog-body">
            <input 
              type="text" 
              v-model="newCollectionName"
              @keyup.enter="handleCreateCollection"
              placeholder="Collection name"
              class="collection-name-input"
              ref="collectionNameInput"
              autofocus
            />
          </div>
          <div class="dialog-footer">
            <button @click="showNewCollectionDialog = false" class="dialog-button secondary">
              Cancel
            </button>
            <button @click="handleCreateCollection" class="dialog-button primary">
              Create
            </button>
          </div>
        </div>
      </div>

      <!-- Collection Selection Dialog -->
      <div v-if="showCollectionDialog" class="dialog-overlay" @click.self="showCollectionDialog = false">
        <div class="dialog-content">
          <div class="dialog-header">
            <h3>Add to Collection</h3>
            <button @click="showCollectionDialog = false" class="icon-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
              </svg>
            </button>
          </div>
          <div class="dialog-body">
            <div class="collection-selection-list">
              <button 
                v-for="collection in selectableCollections" 
                :key="collection.id"
                @click="handleAddToCollection(collection)"
                class="collection-selection-item"
                :class="{ selected: isBookInCollection(selectedBookForCollection, collection) }"
              >
                <span>{{ collection.name }}</span>
                <span v-if="isBookInCollection(selectedBookForCollection, collection)" class="checkmark">✓</span>
              </button>
            </div>
          </div>
          <div class="dialog-footer">
            <button @click="showCollectionDialog = false" class="dialog-button secondary">
              Done
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Dialog -->
      <div v-if="showDeleteDialog" class="dialog-overlay" @click.self="showDeleteDialog = false">
        <div class="dialog-content">
          <div class="dialog-header">
            <h3>Remove Book</h3>
            <button @click="showDeleteDialog = false" class="icon-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
              </svg>
            </button>
          </div>
          <div class="dialog-body">
            <p class="delete-confirmation-text">
              Are you sure you want to remove <strong>{{ bookToDelete?.title }}</strong> from your library?
            </p>
          </div>
          <div class="dialog-footer">
            <button @click="showDeleteDialog = false" class="dialog-button secondary">
              Cancel
            </button>
            <button @click="confirmDelete" class="dialog-button danger">
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import useCollections from '../../../composables/useCollections';
import useBookStorage from '../../../composables/useBookStorage';

export default {
  props: {
    isOpen: { type: Boolean, default: false },
    books: { type: Array, default: () => [] },
    isBookLoaded: { type: Boolean, default: false }
  },
  emits: ['close', 'book-select', 'file-upload', 'book-deleted'],
  setup(props, { emit }) {
    const fileInput = ref(null);
    const showCollections = ref(true);
    const isMobile = ref(false);
    const selectedCollection = ref(null);
    const showNewCollectionDialog = ref(false);
    const newCollectionName = ref('');
    const collectionNameInput = ref(null);
    const showCollectionDialog = ref(false);
    const selectedBookForCollection = ref(null);
    const showDeleteDialog = ref(false);
    const bookToDelete = ref(null);
    
    const { getCollections, createCollection, addBookToCollection, removeBookFromCollection } = useCollections();
    const { deleteBook } = useBookStorage();
    const collections = ref(getCollections());

    // Check screen size
    const checkMobile = () => {
      isMobile.value = window.innerWidth < 1024;
      // Auto-hide collections on mobile
      if (isMobile.value) {
        showCollections.value = false;
      } else {
        showCollections.value = true;
      }
    };

    onMounted(() => {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      // Select "All Books" collection by default
      selectedCollection.value = collections.value.find(c => c.id === 'all');
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile);
    });

    const toggleCollections = () => {
      showCollections.value = !showCollections.value;
    };

    const selectCollection = (collection) => {
      selectedCollection.value = collection;
      // Close collections on mobile after selection
      if (isMobile.value) {
        showCollections.value = false;
      }
    };

    const getCollectionBookCount = (collection) => {
      if (collection.id === 'all') {
        return props.books.length;
      } else if (collection.id === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return props.books.filter(b => new Date(b.lastOpened) > oneWeekAgo).length;
      }
      return collection.bookIds?.length || 0;
    };

    const filteredBooks = computed(() => {
      if (!selectedCollection.value) return props.books;
      
      if (selectedCollection.value.id === 'all') {
        return [...props.books].sort((a, b) => {
          const dateA = a.lastOpened ? new Date(a.lastOpened) : new Date(0);
          const dateB = b.lastOpened ? new Date(b.lastOpened) : new Date(0);
          return dateB - dateA;
        });
      } else if (selectedCollection.value.id === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return props.books
          .filter(b => new Date(b.lastOpened) > oneWeekAgo)
          .sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
      }
      
      const bookIds = selectedCollection.value.bookIds || [];
      return props.books.filter(b => bookIds.includes(b.id));
    });

    const handleClose = () => {
      emit('close');
    };

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const handleFileSelected = (event) => {
      const file = event.target.files[0];
      if (file) {
        // Don't auto-open if a book is already loaded
        const shouldAutoOpen = !props.isBookLoaded;
        emit('file-upload', file, shouldAutoOpen);
        event.target.value = '';
      }
    };

    const handleBookSelect = (book) => {
      emit('book-select', book);
    };

    const handleCreateCollection = () => {
      if (newCollectionName.value.trim()) {
        const newCollection = createCollection(newCollectionName.value.trim());
        collections.value.push(newCollection);
        newCollectionName.value = '';
        showNewCollectionDialog.value = false;
        // Optionally select the new collection
        selectedCollection.value = newCollection;
      }
    };

    const openCollectionMenu = (book) => {
      selectedBookForCollection.value = book;
      showCollectionDialog.value = true;
    };

    const selectableCollections = computed(() => {
      return collections.value.filter(c => !c.isDefault);
    });

    const isBookInCollection = (book, collection) => {
      if (!book || !collection) return false;
      return collection.bookIds?.includes(book.id) || false;
    };

    const handleAddToCollection = (collection) => {
      if (!selectedBookForCollection.value) return;
      
      const bookId = selectedBookForCollection.value.id;
      const isInCollection = isBookInCollection(selectedBookForCollection.value, collection);
      
      if (isInCollection) {
        removeBookFromCollection(collection.id, bookId);
      } else {
        addBookToCollection(collection.id, bookId);
      }
      
      // Refresh collections
      collections.value = getCollections();
    };

    const handleDeleteBook = (book) => {
      bookToDelete.value = book;
      showDeleteDialog.value = true;
    };

    const confirmDelete = async () => {
      if (!bookToDelete.value) return;
      
      try {
        await deleteBook(bookToDelete.value.id);
        
        // Remove from all collections
        collections.value.forEach(collection => {
          if (collection.bookIds?.includes(bookToDelete.value.id)) {
            removeBookFromCollection(collection.id, bookToDelete.value.id);
          }
        });
        
        // Refresh collections
        collections.value = getCollections();
        
        // Emit event to parent to update book list
        emit('book-deleted', bookToDelete.value.id);
        
        showDeleteDialog.value = false;
        bookToDelete.value = null;
      } catch (error) {
        console.error('Error deleting book:', error);
        alert('Failed to delete book. Please try again.');
      }
    };

    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    };

    // Close on ESC key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showCollections.value && isMobile.value) {
          showCollections.value = false;
        } else if (props.isOpen) {
          handleClose();
        }
      }
    };

    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
      } else {
        document.removeEventListener('keydown', handleKeyDown);
      }
    });

    watch(showNewCollectionDialog, (isOpen) => {
      if (isOpen) {
        // Focus the input field when dialog opens
        setTimeout(() => {
          collectionNameInput.value?.focus();
        }, 100);
      }
    });

    return {
      fileInput,
      showCollections,
      isMobile,
      selectedCollection,
      collections,
      filteredBooks,
      showNewCollectionDialog,
      newCollectionName,
      collectionNameInput,
      showCollectionDialog,
      selectedBookForCollection,
      showDeleteDialog,
      bookToDelete,
      selectableCollections,
      toggleCollections,
      selectCollection,
      getCollectionBookCount,
      handleClose,
      triggerFileInput,
      handleFileSelected,
      handleBookSelect,
      handleCreateCollection,
      openCollectionMenu,
      isBookInCollection,
      handleAddToCollection,
      handleDeleteBook,
      confirmDelete,
      formatDate
    };
  }
};
</script>

<style scoped>
.bookshelf-container {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
}

.bookshelf-backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.bookshelf-sidebar {
  position: relative;
  width: 100%;
  max-width: 100%;
  background-color: var(--toolbar-bg-color);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
}

.bookshelf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--toolbar-bg-color);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
}

.header-icon {
  color: var(--hover-outline-color);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.icon-button {
  background: transparent;
  border: none;
  padding: 6px;
  cursor: pointer;
  border-radius: 6px;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.icon-button:hover {
  background-color: var(--button-hover-bg);
}

.collections-toggle-mobile {
  display: none;
}

.close-collections-mobile {
  display: none;
}

.bookshelf-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.collections-sidebar {
  width: 240px;
  background-color: var(--toolbar-bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.collections-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collections-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.collections-list {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.collection-item {
  width: 100%;
  background: transparent;
  border: none;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  color: var(--text-color);
  transition: all 0.2s;
  text-align: left;
}

.collection-item:hover {
  background-color: var(--button-hover-bg);
}

.collection-item.active {
  background-color: var(--hover-outline-color);
  color: white;
}

.collection-name {
  font-size: 14px;
  font-weight: 500;
}

.collection-count {
  font-size: 12px;
  opacity: 0.7;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
}

.new-collection-button {
  margin: 8px;
  padding: 10px;
  background-color: var(--hover-outline-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.2s;
}

.new-collection-button:hover {
  opacity: 0.9;
}

.books-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.upload-section {
  margin-bottom: 24px;
}

.file-input-hidden {
  display: none;
}

.upload-button {
  width: 100%;
  padding: 14px 20px;
  background-color: var(--hover-outline-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: opacity 0.2s;
}

.upload-button:hover {
  opacity: 0.9;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-color);
  opacity: 0.6;
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.empty-state span {
  font-size: 14px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px;
}

.book-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.book-cover-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2/3;
  background-color: var(--toolbar-bg-secondary);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  cursor: pointer;
}

.book-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.book-card:hover .book-actions {
  opacity: 1;
}

.book-action-btn {
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: white;
}

.book-action-btn:hover {
  transform: scale(1.1);
}

.collection-btn:hover {
  background-color: var(--hover-outline-color);
}

.delete-btn:hover {
  background-color: #dc2626;
}

.book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  opacity: 0.9;
}

.progress-bar-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.2);
}

.progress-bar {
  height: 100%;
  background-color: var(--hover-outline-color);
  transition: width 0.3s;
}

.book-info {
  padding: 12px 8px;
  cursor: pointer;
}

.collection-selection-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.collection-selection-item {
  background-color: var(--toolbar-bg-secondary);
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  color: var(--text-color);
  font-size: 14px;
  text-align: left;
}

.collection-selection-item:hover {
  background-color: var(--button-hover-bg);
  border-color: var(--hover-outline-color);
}

.collection-selection-item.selected {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: var(--hover-outline-color);
}

.checkmark {
  color: var(--hover-outline-color);
  font-weight: 700;
  font-size: 16px;
}

.delete-confirmation-text {
  color: var(--text-color);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.delete-confirmation-text strong {
  color: var(--text-color);
  font-weight: 600;
}

.dialog-button.danger {
  background-color: #dc2626;
  color: white;
}

.dialog-button.danger:hover {
  background-color: #b91c1c;
}

.book-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.book-author {
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.7;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-color);
  opacity: 0.6;
}

.progress-text {
  font-weight: 600;
  color: var(--hover-outline-color);
  opacity: 1;
}

/* Responsive Design */
@media (min-width: 640px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

@media (min-width: 768px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (min-width: 1024px) {
  .bookshelf-sidebar {
    max-width: 85%;
  }
  
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 24px;
  }
}

@media (max-width: 1023px) {
  .collections-toggle-mobile {
    display: flex;
  }
  
  .collections-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 10;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  }
  
  .collections-sidebar.mobile-nested .close-collections-mobile {
    display: flex;
  }
}

/* Animations */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-slide-enter-from {
  transform: translateX(-100%);
}

.sidebar-slide-leave-to {
  transform: translateX(-100%);
}

.collections-slide-enter-active,
.collections-slide-leave-active {
  transition: transform 0.3s ease;
}

.collections-slide-enter-from,
.collections-slide-leave-to {
  transform: translateX(-100%);
}

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  animation: fadeIn 0.2s ease;
}

.dialog-content {
  background-color: var(--toolbar-bg-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.dialog-body {
  padding: 24px 20px;
}

.collection-name-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 15px;
  color: var(--text-color);
  background-color: var(--toolbar-bg-secondary);
  outline: none;
  transition: border-color 0.2s;
}

.collection-name-input:focus {
  border-color: var(--hover-outline-color);
}

.dialog-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
}

.dialog-button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.dialog-button:hover {
  opacity: 0.9;
}

.dialog-button.primary {
  background-color: var(--hover-outline-color);
  color: white;
}

.dialog-button.secondary {
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.dialog-button.secondary:hover {
  background-color: var(--button-hover-bg);
}

</style>
