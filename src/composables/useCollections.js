/**
 * Composable for managing book collections
 */
export default function useCollections() {
  const COLLECTIONS_KEY = 'epub_reader_collections';

  /**
   * Get all collections from localStorage
   */
  const getCollections = () => {
    try {
      const stored = localStorage.getItem(COLLECTIONS_KEY);
      if (!stored) {
        return [
          { id: 'all', name: 'All Books', bookIds: [], isDefault: true },
          { id: 'recent', name: 'Recently Opened', bookIds: [], isDefault: true },
          { id: 'favorites', name: 'Favorites', bookIds: [] }
        ];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading collections:', error);
      return [];
    }
  };

  /**
   * Save collections to localStorage
   */
  const saveCollections = (collections) => {
    try {
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    } catch (error) {
      console.error('Error saving collections:', error);
    }
  };

  /**
   * Create a new collection
   */
  const createCollection = (name) => {
    const collections = getCollections();
    const newCollection = {
      id: `collection_${Date.now()}`,
      name: name,
      bookIds: [],
      createdAt: new Date().toISOString()
    };
    
    collections.push(newCollection);
    saveCollections(collections);
    
    return newCollection;
  };

  /**
   * Add a book to a collection
   */
  const addBookToCollection = (collectionId, bookId) => {
    const collections = getCollections();
    const collection = collections.find(c => c.id === collectionId);
    
    if (collection && !collection.bookIds.includes(bookId)) {
      collection.bookIds.push(bookId);
      saveCollections(collections);
    }
  };

  /**
   * Remove a book from a collection
   */
  const removeBookFromCollection = (collectionId, bookId) => {
    const collections = getCollections();
    const collection = collections.find(c => c.id === collectionId);
    
    if (collection) {
      collection.bookIds = collection.bookIds.filter(id => id !== bookId);
      saveCollections(collections);
    }
  };

  /**
   * Delete a collection
   */
  const deleteCollection = (collectionId) => {
    let collections = getCollections();
    collections = collections.filter(c => c.id !== collectionId);
    saveCollections(collections);
  };

  /**
   * Rename a collection
   */
  const renameCollection = (collectionId, newName) => {
    const collections = getCollections();
    const collection = collections.find(c => c.id === collectionId);
    
    if (collection) {
      collection.name = newName;
      saveCollections(collections);
    }
  };

  return {
    getCollections,
    createCollection,
    addBookToCollection,
    removeBookFromCollection,
    deleteCollection,
    renameCollection
  };
}
