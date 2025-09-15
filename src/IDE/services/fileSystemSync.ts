/**
 * File System Synchronization Service
 * Synchronizes between IndexedDB and WebContainer file systems
 */

import { WebContainer } from '@webcontainer/api';
import indexedDBFileSystem from './indexedDBFileSystem';

interface SyncOptions {
  preferIndexedDB?: boolean; // If true, IndexedDB takes precedence in conflicts
  autoSync?: boolean; // Automatically sync on changes
}

interface FileChange {
  path: string;
  type: 'create' | 'update' | 'delete';
  content?: string;
  timestamp: Date;
}

class FileSystemSync {
  private webContainer: WebContainer | null = null;
  private options: SyncOptions;
  private changeQueue: FileChange[] = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(options: SyncOptions = {}) {
    this.options = {
      preferIndexedDB: true,
      autoSync: true,
      ...options
    };
  }

  // Initialize with WebContainer instance
  setWebContainer(container: WebContainer): void {
    this.webContainer = container;
    if (this.options.autoSync) {
      this.startAutoSync();
    }
  }

  // Sync from IndexedDB to WebContainer
  async syncToWebContainer(): Promise<void> {
    if (!this.webContainer) {
      console.warn('WebContainer not available for sync');
      return;
    }

    this.isSyncing = true;
    try {
      console.log('🔄 Syncing from IndexedDB to WebContainer...');

      // Get all files from IndexedDB
      const files = await indexedDBFileSystem.getAllFiles();
      const directories = await indexedDBFileSystem.getAllDirectories();

      // Create directories first
      for (const dir of directories) {
        try {
          await this.webContainer.fs.mkdir(dir.path, { recursive: true });
        } catch (error) {
          console.warn(`Failed to create directory ${dir.path}:`, error);
        }
      }

      // Create/update files
      for (const file of files) {
        try {
          await this.webContainer.fs.writeFile(file.path, file.content);
        } catch (error) {
          console.warn(`Failed to write file ${file.path}:`, error);
        }
      }

      console.log('✅ Sync to WebContainer completed');
    } catch (error) {
      console.error('❌ Sync to WebContainer failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync from WebContainer to IndexedDB
  async syncFromWebContainer(): Promise<void> {
    if (!this.webContainer) {
      console.warn('WebContainer not available for sync');
      return;
    }

    this.isSyncing = true;
    try {
      console.log('🔄 Syncing from WebContainer to IndexedDB...');

      // Get root directory listing recursively
      await this.syncDirectoryFromWebContainer('/');

      console.log('✅ Sync from WebContainer completed');
    } catch (error) {
      console.error('❌ Sync from WebContainer failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncDirectoryFromWebContainer(dirPath: string): Promise<void> {
    if (!this.webContainer) return;

    try {
      const entries = await this.webContainer.fs.readdir(dirPath);

      // Ensure directory exists in IndexedDB
      await indexedDBFileSystem.createDirectory(dirPath);

      for (const entry of entries) {
        const fullPath = dirPath === '/' ? `/${entry}` : `${dirPath}/${entry}`;

        try {
          // Try to read as file first
          const content = await this.webContainer.fs.readFile(fullPath, 'utf8');
          await indexedDBFileSystem.createFile(fullPath, content);
        } catch (fileError) {
          // If reading as file fails, try as directory
          try {
            await this.syncDirectoryFromWebContainer(fullPath);
          } catch (dirError) {
            console.warn(`Failed to sync ${fullPath}: not a file or directory`, fileError, dirError);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dirPath}:`, error);
    }
  }

  // Bidirectional sync with conflict resolution
  async bidirectionalSync(): Promise<void> {
    if (!this.webContainer) {
      console.warn('WebContainer not available for sync');
      return;
    }

    this.isSyncing = true;
    try {
      console.log('🔄 Performing bidirectional sync...');

      // Get all files from both systems
      const idbFiles = await indexedDBFileSystem.getAllFiles();
      const idbDirs = await indexedDBFileSystem.getAllDirectories();

      // Create maps for quick lookup
      const idbFileMap = new Map(idbFiles.map(f => [f.path, f]));
      const idbDirMap = new Map(idbDirs.map(d => [d.path, d]));

      // Sync WebContainer to IndexedDB (new files from WebContainer)
      await this.syncDirectoryFromWebContainer('/');

      // Sync IndexedDB to WebContainer (new files from IndexedDB)
      for (const file of idbFiles) {
        try {
          // Check if file exists in WebContainer
          const wcContent = await this.webContainer.fs.readFile(file.path, 'utf8');

          // Compare content
          if (wcContent !== file.content) {
            if (this.options.preferIndexedDB) {
              await this.webContainer.fs.writeFile(file.path, file.content);
            } else {
              await indexedDBFileSystem.updateFile(file.path, wcContent);
            }
          }
        } catch (error) {
          // File doesn't exist in WebContainer, create it
          await this.webContainer.fs.writeFile(file.path, file.content);
        }
      }

      // Sync directories
      for (const dir of idbDirs) {
        try {
          await this.webContainer.fs.mkdir(dir.path, { recursive: true });
        } catch (error) {
          console.warn(`Failed to create directory ${dir.path} in WebContainer:`, error);
        }
      }

      console.log('✅ Bidirectional sync completed');
    } catch (error) {
      console.error('❌ Bidirectional sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // File operations with sync
  async createFile(path: string, content: string = ''): Promise<void> {
    await indexedDBFileSystem.createFile(path, content);

    if (this.webContainer && !this.isSyncing) {
      try {
        await this.webContainer.fs.writeFile(path, content);
      } catch (error) {
        console.warn(`Failed to sync file creation to WebContainer: ${path}`, error);
      }
    }
  }

  async readFile(path: string): Promise<string | null> {
    // Try IndexedDB first
    let content = await indexedDBFileSystem.readFile(path);

    // If not found and WebContainer is available, try WebContainer
    if (content === null && this.webContainer) {
      try {
        content = await this.webContainer.fs.readFile(path, 'utf8');
        // Cache in IndexedDB
        if (content !== null) {
          await indexedDBFileSystem.createFile(path, content);
        }
      } catch (error) {
        // File doesn't exist in either system
      }
    }

    return content;
  }

  async updateFile(path: string, content: string): Promise<void> {
    await indexedDBFileSystem.updateFile(path, content);

    if (this.webContainer && !this.isSyncing) {
      try {
        await this.webContainer.fs.writeFile(path, content);
      } catch (error) {
        console.warn(`Failed to sync file update to WebContainer: ${path}`, error);
      }
    }
  }

  async deleteFile(path: string): Promise<void> {
    await indexedDBFileSystem.deleteFile(path);

    if (this.webContainer && !this.isSyncing) {
      try {
        await this.webContainer.fs.rm(path);
      } catch (error) {
        console.warn(`Failed to sync file deletion to WebContainer: ${path}`, error);
      }
    }
  }

  async createDirectory(path: string): Promise<void> {
    await indexedDBFileSystem.createDirectory(path);

    if (this.webContainer && !this.isSyncing) {
      try {
        await this.webContainer.fs.mkdir(path, { recursive: true });
      } catch (error) {
        console.warn(`Failed to sync directory creation to WebContainer: ${path}`, error);
      }
    }
  }

  async listDirectory(path: string): Promise<string[]> {
    // Try IndexedDB first
    let children = await indexedDBFileSystem.listDirectory(path);

    // If empty and WebContainer is available, try WebContainer
    if (children.length === 0 && this.webContainer) {
      try {
        children = await this.webContainer.fs.readdir(path);
        // Update IndexedDB
        await indexedDBFileSystem.createDirectory(path);
        // Note: children are automatically updated in IndexedDB via createDirectory
      } catch (error) {
        // Directory doesn't exist
      }
    }

    return children;
  }

  async deleteDirectory(path: string): Promise<void> {
    await indexedDBFileSystem.deleteDirectory(path);

    if (this.webContainer && !this.isSyncing) {
      try {
        await this.webContainer.fs.rm(path, { recursive: true });
      } catch (error) {
        console.warn(`Failed to sync directory deletion to WebContainer: ${path}`, error);
      }
    }
  }

  // Auto-sync functionality
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      if (!this.isSyncing) {
        this.bidirectionalSync();
      }
    }, 30000);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Manual sync trigger
  async forceSync(): Promise<void> {
    await this.bidirectionalSync();
  }

  // Get sync status
  getSyncStatus(): { isSyncing: boolean; webContainerAvailable: boolean } {
    return {
      isSyncing: this.isSyncing,
      webContainerAvailable: this.webContainer !== null
    };
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await indexedDBFileSystem.clearAll();

    if (this.webContainer) {
      // Note: Clearing WebContainer filesystem is not straightforward
      // We'll leave it as is for now
    }
  }
}

// Export singleton instance
export const fileSystemSync = new FileSystemSync();
export default fileSystemSync;