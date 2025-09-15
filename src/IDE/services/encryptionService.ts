/**
 * Encryption Service using Web Crypto API
 * Provides secure encryption/decryption for sensitive client-side data
 */

interface EncryptedData {
  encrypted: ArrayBuffer;
  iv: Uint8Array;
  salt?: Uint8Array;
}

interface KeyPair {
  encryptionKey: CryptoKey;
  salt: Uint8Array;
}

class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: CryptoKey | null = null;
  private keyStoreName = 'MominAI_Keys';

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialize the encryption service with a master key
   */
  async initialize(password?: string): Promise<void> {
    if (password) {
      // Derive master key from password
      this.masterKey = await this.deriveKeyFromPassword(password);
    } else {
      // Try to load existing master key
      this.masterKey = await this.loadMasterKey();
      if (!this.masterKey) {
        // Generate new master key
        this.masterKey = await this.generateMasterKey();
        await this.storeMasterKey(this.masterKey);
      }
    }
  }

  /**
   * Generate a new master key
   */
  private async generateMasterKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive a key from password using PBKDF2
   */
  private async deriveKeyFromPassword(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Store master key securely
   */
  private async storeMasterKey(key: CryptoKey): Promise<void> {
    try {
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      const keyData = Array.from(new Uint8Array(exportedKey));

      // Store in IndexedDB for persistence
      const db = await this.openKeyStore();
      const transaction = db.transaction([this.keyStoreName], 'readwrite');
      const store = transaction.objectStore(this.keyStoreName);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          id: 'masterKey',
          keyData: keyData,
          created: new Date().toISOString()
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.error('Failed to store master key:', error);
      throw new Error('Failed to store master key');
    }
  }

  /**
   * Load master key from storage
   */
  private async loadMasterKey(): Promise<CryptoKey | null> {
    try {
      const db = await this.openKeyStore();
      const transaction = db.transaction([this.keyStoreName], 'readonly');
      const store = transaction.objectStore(this.keyStoreName);

      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get('masterKey');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      db.close();

      if (result && result.keyData) {
        const keyData = new Uint8Array(result.keyData);
        return await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      }

      return null;
    } catch (error) {
      console.error('Failed to load master key:', error);
      return null;
    }
  }

  /**
   * Open IndexedDB for key storage
   */
  private async openKeyStore(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MominAI_KeyStore', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.keyStoreName)) {
          db.createObjectStore(this.keyStoreName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Encrypt data using AES-GCM
   */
  async encrypt(data: string): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.masterKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const encryptedData: EncryptedData = {
        encrypted: encrypted,
        iv: iv
      };

      // Convert to base64 for storage
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(encryptedData: string): Promise<string> {
    if (!this.masterKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.masterKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt sensitive data for storage
   */
  async encryptForStorage(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    return await this.encrypt(jsonString);
  }

  /**
   * Decrypt data from storage
   */
  async decryptFromStorage(encryptedData: string): Promise<any> {
    const jsonString = await this.decrypt(encryptedData);
    return JSON.parse(jsonString);
  }

  /**
   * Check if data is encrypted (simple heuristic)
   */
  isEncrypted(data: string): boolean {
    try {
      // Try to decode as base64 and check length
      const decoded = atob(data);
      return decoded.length > 12; // IV (12 bytes) + some encrypted data
    } catch {
      return false;
    }
  }

  /**
   * Clear all stored keys (for reset)
   */
  async clearKeys(): Promise<void> {
    try {
      const db = await this.openKeyStore();
      const transaction = db.transaction([this.keyStoreName], 'readwrite');
      const store = transaction.objectStore(this.keyStoreName);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
      this.masterKey = null;
    } catch (error) {
      console.error('Failed to clear keys:', error);
    }
  }

  /**
   * Get encryption status
   */
  isInitialized(): boolean {
    return this.masterKey !== null;
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();
export default encryptionService;