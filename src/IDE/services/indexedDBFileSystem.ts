/**
 * IndexedDB File System Implementation
 * Provides a complete file system API using IndexedDB for browser-only storage
 * with encryption for sensitive data
 */

import { encryptionService } from './encryptionService';

interface FileEntry {
  path: string;
  content: string;
  lastModified: Date;
  size: number;
  encrypted?: boolean; // Flag to indicate if content is encrypted
}

interface DirectoryEntry {
  path: string;
  lastModified: Date;
  children: string[];
}

interface FileSystemEntry {
  type: 'file' | 'directory';
  path: string;
  lastModified: Date;
  content?: string;
  size?: number;
  children?: string[];
}

class IndexedDBFileSystem {
  private db: IDBDatabase | null = null;
  private dbName = 'MominAI_IDE_FileSystem';
  private dbVersion = 1;
  private watchers: Map<string, (entry: FileSystemEntry) => void> = new Map();

  constructor() {
    this.initDB();
    this.initEncryption();
  }

  private async initEncryption(): Promise<void> {
    try {
      await encryptionService.initialize();
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
    }
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.db = db;

        // Create object stores
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'path' });
          filesStore.createIndex('path', 'path', { unique: true });
        }

        if (!db.objectStoreNames.contains('directories')) {
          const directoriesStore = db.createObjectStore('directories', { keyPath: 'path' });
          directoriesStore.createIndex('path', 'path', { unique: true });
        }

        console.log('IndexedDB schema created');
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  // File operations
  async createFile(path: string, content: string = ''): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');

    // Determine if content should be encrypted
    const shouldEncrypt = this.shouldEncryptFile(path, content);
    let processedContent = content;
    let encrypted = false;

    if (shouldEncrypt && content.trim()) {
      try {
        processedContent = await encryptionService.encrypt(content);
        encrypted = true;
      } catch (error) {
        console.warn('Failed to encrypt file content, storing unencrypted:', error);
        processedContent = content;
        encrypted = false;
      }
    }

    const fileEntry: FileEntry = {
      path,
      content: processedContent,
      lastModified: new Date(),
      size: content.length,
      encrypted
    };

    return new Promise((resolve, reject) => {
      const request = store.put(fileEntry);
      request.onsuccess = () => {
        this.updateParentDirectory(path);
        this.notifyWatchers(path, { type: 'file', ...fileEntry });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async readFile(path: string): Promise<string | null> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');

    return new Promise((resolve, reject) => {
      const request = store.get(path);
      request.onsuccess = async () => {
        const result = request.result as FileEntry | undefined;
        if (!result) {
          resolve(null);
          return;
        }

        let content = result.content;

        // Decrypt if the file was encrypted
        if (result.encrypted) {
          try {
            content = await encryptionService.decrypt(content);
          } catch (error) {
            console.error('Failed to decrypt file content:', error);
            // Return encrypted content as fallback
            content = result.content;
          }
        }

        resolve(content);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateFile(path: string, content: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(path);
      getRequest.onsuccess = async () => {
        const existing = getRequest.result as FileEntry | undefined;
        if (!existing) {
          reject(new Error('File not found'));
          return;
        }

        // Determine if content should be encrypted
        const shouldEncrypt = this.shouldEncryptFile(path, content);
        let processedContent = content;
        let encrypted = false;

        if (shouldEncrypt && content.trim()) {
          try {
            processedContent = await encryptionService.encrypt(content);
            encrypted = true;
          } catch (error) {
            console.warn('Failed to encrypt file content, storing unencrypted:', error);
            processedContent = content;
            encrypted = false;
          }
        }

        const updatedEntry: FileEntry = {
          ...existing,
          content: processedContent,
          lastModified: new Date(),
          size: content.length,
          encrypted
        };

        const putRequest = store.put(updatedEntry);
        putRequest.onsuccess = () => {
          this.notifyWatchers(path, { type: 'file', ...updatedEntry });
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteFile(path: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');

    return new Promise((resolve, reject) => {
      const request = store.delete(path);
      request.onsuccess = () => {
        this.updateParentDirectory(path, true);
        this.notifyWatchers(path, null);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Directory operations
  async createDirectory(path: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['directories'], 'readwrite');
    const store = transaction.objectStore('directories');

    const dirEntry: DirectoryEntry = {
      path,
      lastModified: new Date(),
      children: []
    };

    return new Promise((resolve, reject) => {
      const request = store.put(dirEntry);
      request.onsuccess = () => {
        this.updateParentDirectory(path);
        this.notifyWatchers(path, { type: 'directory', ...dirEntry });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async listDirectory(path: string): Promise<string[]> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['directories'], 'readonly');
    const store = transaction.objectStore('directories');

    return new Promise((resolve, reject) => {
      const request = store.get(path);
      request.onsuccess = () => {
        const result = request.result as DirectoryEntry | undefined;
        resolve(result ? result.children : []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDirectory(path: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    // First, check if directory is empty
    const children = await this.listDirectory(path);
    if (children.length > 0) {
      throw new Error('Directory is not empty');
    }

    const transaction = this.db.transaction(['directories'], 'readwrite');
    const store = transaction.objectStore('directories');

    return new Promise((resolve, reject) => {
      const request = store.delete(path);
      request.onsuccess = () => {
        this.updateParentDirectory(path, true);
        this.notifyWatchers(path, null);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  private async updateParentDirectory(childPath: string, isDelete: boolean = false): Promise<void> {
    const parentPath = this.getParentPath(childPath);
    if (!parentPath) return;

    await this.ensureDB();
    if (!this.db) return;

    const transaction = this.db.transaction(['directories'], 'readwrite');
    const store = transaction.objectStore('directories');

    const getRequest = store.get(parentPath);
    getRequest.onsuccess = () => {
      let dirEntry = getRequest.result as DirectoryEntry | undefined;

      if (!dirEntry) {
        // Create parent directory if it doesn't exist
        dirEntry = {
          path: parentPath,
          lastModified: new Date(),
          children: []
        };
      }

      const childName = this.getFileName(childPath);
      if (isDelete) {
        dirEntry.children = dirEntry.children.filter(child => child !== childName);
      } else if (!dirEntry.children.includes(childName)) {
        dirEntry.children.push(childName);
      }

      dirEntry.lastModified = new Date();
      store.put(dirEntry);
    };
  }

  private getParentPath(path: string): string | null {
    const parts = path.split('/').filter(p => p);
    if (parts.length <= 1) return null;
    return '/' + parts.slice(0, -1).join('/');
  }

  private getFileName(path: string): string {
    return path.split('/').pop() || '';
  }

  /**
   * Determine if a file should be encrypted based on path and content
   */
  private shouldEncryptFile(path: string, content: string): boolean {
    const fileName = this.getFileName(path).toLowerCase();

    // Encrypt files with sensitive extensions
    const sensitiveExtensions = [
      '.env', '.key', '.secret', '.pem', '.crt', '.p12', '.pfx',
      '.token', '.auth', '.config', '.credentials'
    ];

    if (sensitiveExtensions.some(ext => fileName.endsWith(ext))) {
      return true;
    }

    // Encrypt files with sensitive names
    const sensitiveNames = [
      'config', 'settings', 'credentials', 'auth', 'token', 'key',
      'secret', 'password', 'api', 'database'
    ];

    if (sensitiveNames.some(name => fileName.includes(name))) {
      return true;
    }

    // Encrypt content containing sensitive patterns
    const sensitivePatterns = [
      /api[_-]?key/i,
      /auth[_-]?token/i,
      /access[_-]?token/i,
      /refresh[_-]?token/i,
      /secret[_-]?key/i,
      /private[_-]?key/i,
      /password/i,
      /bearer/i,
      /authorization/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(content));
  }

  // File watching
  watchFile(path: string, callback: (entry: FileSystemEntry | null) => void): () => void {
    this.watchers.set(path, callback);
    return () => {
      this.watchers.delete(path);
    };
  }

  private notifyWatchers(path: string, entry: FileSystemEntry | null): void {
    const watcher = this.watchers.get(path);
    if (watcher) {
      watcher(entry);
    }
  }

  // Bulk operations for synchronization
  async getAllFiles(): Promise<FileEntry[]> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result as FileEntry[]);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDirectories(): Promise<DirectoryEntry[]> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['directories'], 'readonly');
    const store = transaction.objectStore('directories');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result as DirectoryEntry[]);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data (for reset)
  async clearAll(): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['files', 'directories'], 'readwrite');
    const filesStore = transaction.objectStore('files');
    const directoriesStore = transaction.objectStore('directories');

    return new Promise((resolve, reject) => {
      const clearFiles = filesStore.clear();
      const clearDirectories = directoriesStore.clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };

      clearFiles.onsuccess = checkComplete;
      clearDirectories.onsuccess = checkComplete;

      clearFiles.onerror = () => reject(clearFiles.error);
      clearDirectories.onerror = () => reject(clearDirectories.error);
    });
  }
}

// Export singleton instance
export const indexedDBFileSystem = new IndexedDBFileSystem();
export default indexedDBFileSystem;