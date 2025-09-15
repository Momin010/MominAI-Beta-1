import type { Plugin, IDEApi } from '../types';

export const internetAccessPlugin: Plugin = {
    id: 'internet-access',
    name: 'Internet Access',
    description: 'Enable AI to access the internet for research and analysis',

    activate: (api: IDEApi) => {
        // Register toggle command
        api.registerCommand({
            id: 'internet.toggle',
            label: 'Toggle Internet Access',
            category: 'AI Features',
            action: () => {
                const { toggleInternetAccess, internetAccessEnabled } = api as any;
                if (toggleInternetAccess) {
                    toggleInternetAccess();
                } else {
                    api.showNotification({
                        type: 'error',
                        message: 'Internet access feature not available'
                    });
                }
            }
        });

        // Register industry scan command
        api.registerCommand({
            id: 'internet.scan-industry',
            label: 'Scan Industry Websites',
            category: 'AI Features',
            action: async () => {
                const industry = prompt('Enter industry to scan (e.g., "web development", "e-commerce"):');
                if (!industry) return;

                try {
                    const { scanIndustryWebsites } = api as any;
                    if (scanIndustryWebsites) {
                        api.showNotification({
                            type: 'info',
                            message: `Scanning ${industry} companies...`
                        });

                        const companies = await scanIndustryWebsites(industry);

                        api.showNotification({
                            type: 'success',
                            message: `Found ${companies.length} companies in ${industry}`
                        });

                        // Could open a modal to show results
                        console.log('Industry scan results:', companies);
                    } else {
                        throw new Error('Industry scanning not available');
                    }
                } catch (error: any) {
                    api.showNotification({
                        type: 'error',
                        message: error.message || 'Failed to scan industry'
                    });
                }
            }
        });

        // Register image search command
        api.registerCommand({
            id: 'internet.search-images',
            label: 'Search Stock Images',
            category: 'AI Features',
            action: async () => {
                const query = prompt('Enter image search query (e.g., "business meeting", "technology", "nature"):');
                if (!query) return;

                try {
                    const { searchStockImages } = api as any;
                    if (searchStockImages) {
                        api.showNotification({
                            type: 'info',
                            message: `Searching for images: ${query}`
                        });

                        const images = await searchStockImages(query, 5);

                        api.showNotification({
                            type: 'success',
                            message: `Found ${images.length} images for "${query}"`
                        });

                        // Could open a modal to show results
                        console.log('Image search results:', images);
                    } else {
                        throw new Error('Image search not available');
                    }
                } catch (error: any) {
                    api.showNotification({
                        type: 'error',
                        message: error.message || 'Failed to search images'
                    });
                }
            }
        });

        // Register image search and code generation command
        api.registerCommand({
            id: 'internet.search-images-generate-code',
            label: 'Search Images & Generate Code',
            category: 'AI Features',
            action: async () => {
                const query = prompt('Enter image search query and code description (e.g., "modern website hero section"):');
                if (!query) return;

                try {
                    const { searchStockImages, convertScreenshotToCode } = api as any;
                    if (searchStockImages && convertScreenshotToCode) {
                        api.showNotification({
                            type: 'info',
                            message: `Searching for images and generating code for: ${query}`
                        });

                        // Search for images
                        const images = await searchStockImages(query, 3);

                        if (images.length > 0) {
                            // Use the first image to generate code
                            const selectedImage = images[0];
                            const code = await convertScreenshotToCode(selectedImage.thumbnail, query);

                            api.showNotification({
                                type: 'success',
                                message: `Generated code using image: ${selectedImage.title}`
                            });

                            console.log('Generated code:', code);
                            console.log('Image used:', selectedImage);
                        } else {
                            throw new Error('No images found');
                        }
                    } else {
                        throw new Error('Image search and code generation not available');
                    }
                } catch (error: any) {
                    api.showNotification({
                        type: 'error',
                        message: error.message || 'Failed to search images and generate code'
                    });
                }
            }
        });

        // Register 3D model search command
        api.registerCommand({
            id: 'internet.search-3d-models',
            label: 'Search 3D Models (Sketchfab)',
            category: 'AI Features',
            action: async () => {
                const query = prompt('Enter 3D model search query (e.g., "car", "building", "robot"):');
                if (!query) return;

                try {
                    const { searchSketchfabModels } = api as any;
                    if (searchSketchfabModels) {
                        api.showNotification({
                            type: 'info',
                            message: `Searching Sketchfab for 3D models: ${query}`
                        });

                        const models = await searchSketchfabModels(query, 5);

                        api.showNotification({
                            type: 'success',
                            message: `Found ${models.length} 3D models for "${query}"`
                        });

                        console.log('3D models found:', models);
                    } else {
                        throw new Error('3D model search not available');
                    }
                } catch (error: any) {
                    api.showNotification({
                        type: 'error',
                        message: error.message || 'Failed to search 3D models'
                    });
                }
            }
        });

        // Register 3D hero section generation command
        api.registerCommand({
            id: 'internet.generate-3d-hero',
            label: 'Generate 3D Hero Section',
            category: 'AI Features',
            action: async () => {
                const query = prompt('Enter website theme for 3D hero (e.g., "car company", "modern office", "robotics"):');
                if (!query) return;

                try {
                    const { searchSketchfabModels, generate3DHeroSection } = api as any;
                    if (searchSketchfabModels && generate3DHeroSection) {
                        api.showNotification({
                            type: 'info',
                            message: `Finding 3D model and generating hero section for: ${query}`
                        });

                        // Search for relevant 3D models
                        const models = await searchSketchfabModels(query, 3);

                        if (models.length > 0) {
                            const selectedModel = models[0];

                            // Determine background color based on query
                            const backgroundColor = query.toLowerCase().includes('car') ? '#f8f9fa' :
                                                  query.toLowerCase().includes('office') ? '#ffffff' :
                                                  query.toLowerCase().includes('robot') ? '#1a1a1a' : '#ffffff';

                            const heroCode = await generate3DHeroSection(selectedModel, backgroundColor);

                            api.showNotification({
                                type: 'success',
                                message: `Generated 3D hero section with ${selectedModel.name}`
                            });

                            console.log('Generated 3D hero code:', heroCode);
                            console.log('3D model used:', selectedModel);
                        } else {
                            throw new Error('No suitable 3D models found');
                        }
                    } else {
                        throw new Error('3D model search and hero generation not available');
                    }
                } catch (error: any) {
                    api.showNotification({
                        type: 'error',
                        message: error.message || 'Failed to generate 3D hero section'
                    });
                }
            }
        });

        // Register emergency remove command
        api.registerCommand({
            id: 'internet.remove-features',
            label: 'Remove Internet Features (Emergency)',
            category: 'AI Features',
            action: () => {
                if (confirm('This will permanently remove all internet access features. Are you sure?')) {
                    // Call the service removal function
                    const { internetAccessService } = require('../services/internetAccessService');
                    internetAccessService.removeAllInternetFeatures();

                    api.showNotification({
                        type: 'warning',
                        message: 'Internet features removed. Please restart the application.'
                    });
                }
            }
        });

        // Register test command
        api.registerCommand({
            id: 'internet.test-features',
            label: 'Test Internet Features',
            category: 'AI Features',
            action: async () => {
                try {
                    const { internetAccessEnabled, scanIndustryWebsites, takeWebsiteScreenshot, convertScreenshotToCode } = api as any;

                    if (!internetAccessEnabled) {
                        api.showNotification({
                            type: 'warning',
                            message: 'Internet access is disabled. Enable it first with "Toggle Internet Access"'
                        });
                        return;
                    }

                    api.showNotification({
                        type: 'info',
                        message: 'Testing internet access features...'
                    });

                    // Test industry scanning
                    const companies = await scanIndustryWebsites('technology');
                    console.log('Industry scan test:', companies);

                    // Test screenshot (mock)
                    const screenshot = await takeWebsiteScreenshot('https://example.com');
                    console.log('Screenshot test:', screenshot.substring(0, 50) + '...');

                    // Test image to code conversion
                    const code = await convertScreenshotToCode(screenshot, 'Modern landing page');
                    console.log('Code conversion test:', code.substring(0, 100) + '...');

                    api.showNotification({
                        type: 'success',
                        message: 'All internet features tested successfully!'
                    });

                } catch (error: any) {
                    api.showNotification({
                        type: 'error',
                        message: `Test failed: ${error.message}`
                    });
                }
            }
        });

        console.log("Internet Access plugin activated");
    },

    deactivate: (api: IDEApi) => {
        // Cleanup - unregister commands
        try {
            api.unregisterCommand('internet.toggle');
            api.unregisterCommand('internet.scan-industry');
            api.unregisterCommand('internet.search-images');
            api.unregisterCommand('internet.search-images-generate-code');
            api.unregisterCommand('internet.search-3d-models');
            api.unregisterCommand('internet.generate-3d-hero');
            api.unregisterCommand('internet.test-features');
            api.unregisterCommand('internet.remove-features');
        } catch (error) {
            console.warn('Failed to unregister internet access commands:', error);
        }
    },
};