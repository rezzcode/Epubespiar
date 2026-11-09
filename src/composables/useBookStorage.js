/**
 * Composable for managing EPUB book storage in IndexedDB
 */
export default function useBookStorage() {
  const DB_NAME = "EpubReaderDB";
  const DB_VERSION = 1;
  const STORE_NAME = "books";

  const openDatabase = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open database"));
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
          });
          objectStore.createIndex("title", "title", { unique: false });
          objectStore.createIndex("author", "author", { unique: false });
          objectStore.createIndex("lastOpened", "lastOpened", {
            unique: false,
          });
        }
      };
    });
  };

  const saveBook = async (bookData) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      transaction.onabort = () =>
        console.error("Book transaction aborted", transaction.error);
      const store = transaction.objectStore(STORE_NAME);

      const cleanMetadata = bookData.metadata
        ? {
            title: bookData.metadata.title,
            creator: bookData.metadata.creator,
            description: bookData.metadata.description,
            pubdate: bookData.metadata.pubdate,
            publisher: bookData.metadata.publisher,
            identifier: bookData.metadata.identifier,
            language: bookData.metadata.language,
            rights: bookData.metadata.rights,
            modified_date: bookData.metadata.modified_date,
            layout: bookData.metadata.layout,
            orientation: bookData.metadata.orientation,
            flow: bookData.metadata.flow,
            viewport: bookData.metadata.viewport,
            spread: bookData.metadata.spread,
          }
        : {};

      const bookRecord = {
        id:
          bookData.id ||
          `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: bookData.title || "Unknown Title",
        author: bookData.author || "Unknown Author",
        cover: bookData.cover || null,
        file: bookData.file,
        sourceUrl: bookData.sourceUrl || null,
        progress: bookData.progress || 0,
        currentChapter: bookData.currentChapter || 0,
        lastOpened: bookData.lastOpened || new Date().toISOString(),
        addedDate: bookData.addedDate || new Date().toISOString(),
        metadata: cleanMetadata,
      };

      return new Promise((resolve, reject) => {
        const request = store.put(bookRecord);

        transaction.oncomplete = () => {
          resolve(bookRecord.id);
        };

        transaction.onabort = transaction.onerror = () => {
          reject(new Error("Failed to save book"));
        };
      });
    } catch (error) {
      console.error("Error saving book:", error);
      throw error;
    }
  };

  const getBook = async (bookId) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], "readonly");
      transaction.onabort = () =>
        console.error("Book transaction aborted", transaction.error);
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get(bookId);

        transaction.oncomplete = () => {
          resolve(request.result);
        };

        transaction.onabort = transaction.onerror = () => {
          reject(new Error("Failed to get book"));
        };
      });
    } catch (error) {
      console.error("Error getting book:", error);
      throw error;
    }
  };

  const getAllBooks = async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], "readonly");
      transaction.onabort = () =>
        console.error("Book transaction aborted", transaction.error);
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const books = request.result || [];
          books.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
          resolve(books);
        };

        transaction.onabort = transaction.onerror = () => {
          reject(new Error("Failed to get books"));
        };
      });
    } catch (error) {
      console.error("Error getting all books:", error);
      throw error;
    }
  };

  const updateBook = async (bookId, updates) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      transaction.onabort = () =>
        console.error("Book transaction aborted", transaction.error);
      const store = transaction.objectStore(STORE_NAME);

      const getRequest = store.get(bookId);

      return new Promise((resolve, reject) => {
        getRequest.onsuccess = () => {
          const book = getRequest.result;

          if (!book) {
            reject(new Error("Book not found"));
            return;
          }

          const updatedBook = { ...book, ...updates };
          const putRequest = store.put(updatedBook);

          transaction.oncomplete = () => {
            resolve(updatedBook);
          };

          putRequest.onerror = () => {
            reject(new Error("Failed to update book"));
          };
        };

        getRequest.onerror = () => {
          reject(new Error("Failed to get book"));
        };
      });
    } catch (error) {
      console.error("Error updating book:", error);
      throw error;
    }
  };

  const deleteBook = async (bookId) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      transaction.onabort = () =>
        console.error("Book transaction aborted", transaction.error);
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.delete(bookId);

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onabort = transaction.onerror = () => {
          reject(new Error("Failed to delete book"));
        };
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      throw error;
    }
  };

  const clearAllBooks = async () => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      transaction.onabort = () =>
        console.error("Book transaction aborted", transaction.error);
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.clear();

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onabort = transaction.onerror = () => {
          reject(new Error("Failed to clear books"));
        };
      });
    } catch (error) {
      console.error("Error clearing books:", error);
      throw error;
    }
  };

  return {
    saveBook,
    getBook,
    getAllBooks,
    updateBook,
    deleteBook,
    clearAllBooks,
  };
}
