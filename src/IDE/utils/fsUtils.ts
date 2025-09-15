
import type { FileSystemNode } from '../types';

/**
 * Recursively traverses the file system to create a flat array of all files with their full paths and content.
 */
export const getAllFiles = (node: FileSystemNode, currentPath: string): { path: string; content: string }[] => {
    if (node.type === 'file') {
        return [{ path: currentPath, content: node.content }];
    }
    
    let files: { path: string; content: string }[] = [];
    
    if (node.type === 'directory') {
        for (const name in node.children) {
            const childPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
            files = files.concat(getAllFiles(node.children[name], childPath));
        }
    }
    
    return files;
};

/**
 * Recursively analyzes the directory structure and returns a tree-like string representation.
 */
export const analyzeDirectoryStructure = (node: FileSystemNode, prefix = ''): string => {
    let result = prefix + node.name + '\n';
    if (node.type === 'directory' && node.children) {
        const childNames = Object.keys(node.children);
        childNames.forEach((name, index) => {
            const child = node.children![name];
            const isLast = index === childNames.length - 1;
            const newPrefix = prefix + (isLast ? '└── ' : '├── ');
            result += analyzeDirectoryStructure(child, newPrefix);
        });
    }
    return result;
};
