import { useState, useEffect, useCallback, useRef } from 'react';
import { useIndexedDBFileSystem } from '../IndexedDBFileSystemProvider.tsx';
import type { Directory, FileSystemNode, File } from '../types.ts';

// Simple file system structure for RemoteVM
const createInitialFs = (): Directory => ({
    type: 'directory',
    children: {
        'src': {
            type: 'directory',
            children: {
                'App.tsx': { type: 'file', content: '// Your React app code here' },
                'index.tsx': { type: 'file', content: '// Entry point' }
            }
        },
        'package.json': { type: 'file', content: JSON.stringify({
            name: 'my-app',
            version: '1.0.0',
            scripts: { dev: 'vite', build: 'vite build' }
        }, null, 2) }
    }
});

export const useFileSystem = () => {
    const { isConnected, readFile, writeFile, listDirectory, createDirectory, deleteFile } = useIndexedDBFileSystem();
    const [fs, setFs] = useState<Directory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fileContents = useRef(new Map<string, string>());

    // Initialize with a basic file structure
    useEffect(() => {
        if (isConnected && !fs) {
            const initialFs = createInitialFs();
            setFs(initialFs);
            setIsLoading(false);
        }
    }, [isConnected, fs]);

    const updateNode = useCallback(async (path: string, content: string) => {
        if (!isConnected) return;

        try {
            // Send to IndexedDB
            await writeFile(path, content);

            // Update local cache
            fileContents.current.set(path, content);

            // Update local file system state
            setFs(prevFs => {
                if (!prevFs) return null;
                const newFs = JSON.parse(JSON.stringify(prevFs)); // Deep clone
                const parts = path.split('/').filter(p => p);
                let currentNode: Directory = newFs;

                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    if (!currentNode.children[part]) {
                        currentNode.children[part] = { type: 'directory', children: {} };
                    }
                    currentNode = currentNode.children[part] as Directory;
                }

                const fileName = parts[parts.length - 1];
                currentNode.children[fileName] = { type: 'file', content };
                return newFs;
            });
        } catch (error) {
            console.error('Failed to update file:', error);
        }
    }, [isConnected, writeFile]);

    const createNode = useCallback(async (path: string, type: 'file' | 'directory', content = '') => {
        if (!isConnected) return;

        try {
            if (type === 'file') {
                await writeFile(path, content);
                fileContents.current.set(path, content);
            } else {
                await createDirectory(path);
            }

            // Update local file system state
            setFs(prevFs => {
                if (!prevFs) return null;
                const newFs = JSON.parse(JSON.stringify(prevFs)); // Deep clone
                const parts = path.split('/').filter(p => p);
                let currentNode: Directory = newFs;

                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    if (!currentNode.children[part]) {
                        currentNode.children[part] = { type: 'directory', children: {} };
                    }
                    currentNode = currentNode.children[part] as Directory;
                }

                const fileName = parts[parts.length - 1];
                if (type === 'file') {
                    currentNode.children[fileName] = { type: 'file', content };
                } else {
                    currentNode.children[fileName] = { type: 'directory', children: {} };
                }
                return newFs;
            });
        } catch (error) {
            console.error('Failed to create node:', error);
        }
    }, [isConnected, writeFile, createDirectory]);

    const deleteNode = useCallback(async (path: string) => {
        if (!isConnected) return;

        try {
            await deleteFile(path);
            fileContents.current.delete(path);

            // Update local file system state
            setFs(prevFs => {
                if (!prevFs) return null;
                const newFs = JSON.parse(JSON.stringify(prevFs)); // Deep clone
                const parts = path.split('/').filter(p => p);
                let currentNode: Directory = newFs;

                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    const child = currentNode.children[part];
                    if (child && child.type === 'directory') {
                        currentNode = child;
                    } else {
                        return prevFs;
                    }
                }

                const fileName = parts[parts.length - 1];
                delete currentNode.children[fileName];
                return newFs;
            });
        } catch (error) {
            console.error('Failed to delete node:', error);
        }
    }, [isConnected, deleteFile]);

    const renameNode = useCallback(async (oldPath: string, newName: string) => {
        if (!isConnected) return;

        try {
            // For now, implement as delete + create (simplified)
            const content = fileContents.current.get(oldPath) || '';
            const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/';
            const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;

            await deleteNode(oldPath);
            await createNode(newPath, 'file', content);
        } catch (error) {
            console.error('Failed to rename node:', error);
        }
    }, [isConnected, deleteNode, createNode]);

    const moveNode = useCallback(async (sourcePath: string, destDir: string) => {
        if (!isConnected) return;

        try {
            const content = fileContents.current.get(sourcePath) || '';
            const name = sourcePath.split('/').pop();
            if (!name) return;

            const newPath = destDir === '/' ? `/${name}` : `${destDir}/${name}`;

            await deleteNode(sourcePath);
            await createNode(newPath, 'file', content);
        } catch (error) {
            console.error('Failed to move node:', error);
        }
    }, [isConnected, deleteNode, createNode]);

    return {
        fs,
        isLoading,
        updateNode,
        createNode,
        deleteNode,
        renameNode,
        moveNode,
    };
};
