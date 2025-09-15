// Internet Access Service - Safely removable module
// This entire file can be deleted to remove internet access features

import { encryptionService } from './encryptionService';

export interface CompanyInfo {
    name: string;
    url: string;
    description: string;
    industry?: string;
}

export interface ScreenshotResult {
    url: string;
    imageData: string;
    timestamp: number;
}

export interface ImageSearchResult {
    id: string;
    url: string;
    thumbnail: string;
    title: string;
    description: string;
    source: string;
}

export interface SketchfabModel {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    embedUrl: string;
    viewerUrl: string;
    author: string;
    tags: string[];
    categories: string[];
}

class InternetAccessService {
    private isEnabled: boolean = true;

    constructor() {
        // Initialize encryption service and load settings asynchronously
        this.initializeService();
    }

    private async initializeService() {
        try {
            await encryptionService.initialize();
            await this.loadSettings();
        } catch (error) {
            console.error('Failed to initialize internet access service:', error);
            this.isEnabled = false;
        }
    }

    private async loadSettings() {
        try {
            const storedValue = localStorage.getItem('internetAccessEnabled');
            if (storedValue && encryptionService.isEncrypted(storedValue)) {
                // Decrypt the stored value
                const decrypted = await encryptionService.decrypt(storedValue);
                this.isEnabled = decrypted === 'true';
            } else {
                // Handle legacy unencrypted value
                this.isEnabled = storedValue === 'true';
                // Encrypt and re-store if it was unencrypted
                if (storedValue) {
                    await this.setEnabled(this.isEnabled);
                }
            }
        } catch (error) {
            console.error('Failed to load internet access settings:', error);
            this.isEnabled = false;
        }
    }

    public async setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        try {
            // Encrypt the setting before storing
            const encryptedValue = await encryptionService.encrypt(enabled.toString());
            localStorage.setItem('internetAccessEnabled', encryptedValue);
        } catch (error) {
            console.warn('Failed to save internet access setting:', error);
        }
    }

    public isInternetAccessEnabled(): boolean {
        return this.isEnabled;
    }

    // Web scraping functionality
    public async scanIndustryWebsites(industry: string): Promise<CompanyInfo[]> {
        if (!this.isEnabled) {
            throw new Error('Internet access is disabled');
        }

        try {
            // Mock implementation - replace with actual web scraping
            console.log(`Scanning for ${industry} companies...`);

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            return [
                {
                    name: 'TechCorp Solutions',
                    url: 'https://techcorp-solutions.com',
                    description: `Leading ${industry} company specializing in innovative solutions`,
                    industry
                },
                {
                    name: 'InnovateLabs',
                    url: 'https://innovatelabs.io',
                    description: `Cutting-edge ${industry} research and development`,
                    industry
                },
                {
                    name: 'FutureWorks',
                    url: 'https://futureworks.dev',
                    description: `Next-generation ${industry} platform`,
                    industry
                }
            ];
        } catch (error) {
            console.error('Failed to scan industry websites:', error);
            throw new Error('Failed to scan industry websites');
        }
    }

    // Screenshot functionality
    public async takeWebsiteScreenshot(url: string): Promise<ScreenshotResult> {
        if (!this.isEnabled) {
            throw new Error('Internet access is disabled');
        }

        try {
            console.log(`Taking screenshot of ${url}...`);

            // Mock implementation - replace with actual screenshot service
            // In a real implementation, you would use:
            // - Puppeteer for server-side screenshots
            // - Screenshot API services
            // - Browser automation

            await new Promise(resolve => setTimeout(resolve, 3000));

            // Return mock base64 image data
            const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

            return {
                url,
                imageData: mockImageData,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Failed to take screenshot:', error);
            throw new Error('Failed to take website screenshot');
        }
    }

    // Image search functionality
    public async searchStockImages(query: string, limit: number = 10): Promise<ImageSearchResult[]> {
        if (!this.isEnabled) {
            throw new Error('Internet access is disabled');
        }

        try {
            console.log(`Searching for images: ${query}`);

            // Mock implementation - replace with actual API calls
            // In a real implementation, you would call:
            // - Pexels API
            // - Unsplash API
            // - Pixabay API
            // - Shutterstock API

            await new Promise(resolve => setTimeout(resolve, 2000));

            return this.generateMockImageResults(query, limit);
        } catch (error) {
            console.error('Failed to search images:', error);
            throw new Error('Failed to search for images');
        }
    }

    private generateMockImageResults(query: string, limit: number): ImageSearchResult[] {
        // Generate proper base64 data URLs for mock images
        const generateMockImageData = (color: string, text: string) => {
            // Create a simple SVG and convert to base64
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
                <rect width="400" height="300" fill="${color}"/>
                <text x="200" y="150" text-anchor="middle" fill="white" font-size="24" font-family="Arial">${text}</text>
            </svg>`;
            return `data:image/svg+xml;base64,${btoa(svg)}`;
        };

        const mockImages = [
            {
                id: '1',
                url: generateMockImageData('#667eea', `${query} - Professional`),
                thumbnail: generateMockImageData('#667eea', `${query} - Pro`),
                title: `${query} - Professional Photo`,
                description: `High-quality ${query} image for your project`,
                source: 'Pexels'
            },
            {
                id: '2',
                url: generateMockImageData('#764ba2', `${query} - Creative`),
                thumbnail: generateMockImageData('#764ba2', `${query} - Creative`),
                title: `${query} - Creative Design`,
                description: `Beautiful ${query} image with modern design`,
                source: 'Unsplash'
            },
            {
                id: '3',
                url: generateMockImageData('#f093fb', `${query} - Business`),
                thumbnail: generateMockImageData('#f093fb', `${query} - Business`),
                title: `${query} - Business`,
                description: `Professional ${query} image for business use`,
                source: 'Pixabay'
            }
        ];

        return mockImages.slice(0, limit);
    }

    // 3D Model search functionality
    public async searchSketchfabModels(query: string, limit: number = 5): Promise<SketchfabModel[]> {
        if (!this.isEnabled) {
            throw new Error('Internet access is disabled');
        }

        try {
            console.log(`Searching Sketchfab for 3D models: ${query}`);

            // Mock implementation - replace with actual Sketchfab API
            // In a real implementation, you would use:
            // - Sketchfab API: https://docs.sketchfab.com/data-api/v3/index.html
            // - API Key authentication
            // - Search endpoints

            await new Promise(resolve => setTimeout(resolve, 2500));

            return this.generateMock3DModels(query, limit);
        } catch (error) {
            console.error('Failed to search 3D models:', error);
            throw new Error('Failed to search for 3D models');
        }
    }

    private generateMock3DModels(query: string, limit: number): SketchfabModel[] {
        const mockModels = [
            {
                id: 'porsche-911',
                name: 'Porsche 911 GT3',
                description: 'High-quality 3D model of Porsche 911 GT3 sports car',
                thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#ff0000"/><text x="200" y="150" text-anchor="middle" fill="white" font-size="24" font-family="Arial">Porsche 911</text></svg>`),
                embedUrl: 'https://sketchfab.com/models/porsche-911/embed',
                viewerUrl: 'https://sketchfab.com/models/porsche-911',
                author: 'AutoDesigner',
                tags: ['car', 'sports car', 'porsche', 'automotive'],
                categories: ['Vehicles', 'Transportation']
            },
            {
                id: 'modern-office',
                name: 'Modern Office Building',
                description: 'Contemporary office building with glass facade',
                thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#4a90e2"/><text x="200" y="150" text-anchor="middle" fill="white" font-size="20" font-family="Arial">Office Building</text></svg>`),
                embedUrl: 'https://sketchfab.com/models/modern-office/embed',
                viewerUrl: 'https://sketchfab.com/models/modern-office',
                author: 'ArchitecturePro',
                tags: ['building', 'office', 'modern', 'architecture'],
                categories: ['Architecture', 'Buildings']
            },
            {
                id: 'robot-arm',
                name: 'Industrial Robot Arm',
                description: 'Precision industrial robot arm for manufacturing',
                thumbnail: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#666666"/><text x="200" y="150" text-anchor="middle" fill="white" font-size="20" font-family="Arial">Robot Arm</text></svg>`),
                embedUrl: 'https://sketchfab.com/models/robot-arm/embed',
                viewerUrl: 'https://sketchfab.com/models/robot-arm',
                author: 'IndustrialDesign',
                tags: ['robot', 'industrial', 'automation', 'manufacturing'],
                categories: ['Industrial', 'Robotics']
            }
        ];

        // Filter models based on query
        const filteredModels = mockModels.filter(model =>
            model.name.toLowerCase().includes(query.toLowerCase()) ||
            model.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
            model.categories.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
        );

        return filteredModels.slice(0, limit);
    }

    // Generate 3D hero section code
    public async generate3DHeroSection(model: SketchfabModel, backgroundColor: string = '#ffffff'): Promise<string> {
        if (!this.isEnabled) {
            throw new Error('Internet access is disabled');
        }

        try {
            console.log('Generating 3D hero section code...');

            await new Promise(resolve => setTimeout(resolve, 3000));

            return this.generate3DHeroCode(model, backgroundColor);
        } catch (error) {
            console.error('Failed to generate 3D hero section:', error);
            throw new Error('Failed to generate 3D hero section');
        }
    }

    private generate3DHeroCode(model: SketchfabModel, backgroundColor: string): string {
        return `<!-- 3D Hero Section with ${model.name} -->
<div class="hero-3d-container">
    <div class="hero-background" style="background-color: ${backgroundColor};"></div>

    <div class="hero-content">
        <div class="hero-text">
            <h1>Welcome to Our World</h1>
            <p>Experience innovation through immersive 3D design</p>
            <button class="cta-button">Explore More</button>
        </div>

        <div class="hero-3d-model">
            <div class="model-container">
                <iframe
                    title="${model.name}"
                    src="${model.embedUrl}?autostart=1&ui_theme=dark&ui_controls=1&ui_infos=0&ui_stop=0&ui_watermark=0"
                    width="100%"
                    height="100%"
                    frameborder="0"
                    allowfullscreen
                    mozallowfullscreen="true"
                    webkitallowfullscreen="true">
                </iframe>
            </div>
        </div>
    </div>

    <!-- Realistic shadow -->
    <div class="model-shadow"></div>
</div>

<style>
.hero-3d-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.hero-content {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    max-width: 1400px;
    width: 100%;
    padding: 0 2rem;
    align-items: center;
}

.hero-text {
    color: #333;
    text-align: left;
}

.hero-text h1 {
    font-size: 4rem;
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-text p {
    font-size: 1.3rem;
    margin-bottom: 2rem;
    color: #666;
    line-height: 1.6;
}

.cta-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 2rem;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.hero-3d-model {
    position: relative;
    width: 100%;
    height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.model-container {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.model-container iframe {
    border-radius: 20px;
    transition: transform 0.3s ease;
}

.model-container:hover iframe {
    transform: scale(1.02);
}

.model-shadow {
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 100px;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.1) 50%, transparent 70%);
    border-radius: 50%;
    z-index: 1;
    animation: floatShadow 3s ease-in-out infinite;
}

@keyframes floatShadow {
    0%, 100% {
        transform: translateX(-50%) scale(1);
        opacity: 0.4;
    }
    50% {
        transform: translateX(-50%) scale(1.1);
        opacity: 0.6;
    }
}

/* Responsive Design */
@media (max-width: 1024px) {
    .hero-content {
        grid-template-columns: 1fr;
        gap: 2rem;
        text-align: center;
    }

    .hero-text h1 {
        font-size: 3rem;
    }

    .hero-3d-model {
        height: 400px;
    }

    .model-shadow {
        width: 300px;
        height: 75px;
        bottom: 30px;
    }
}

@media (max-width: 768px) {
    .hero-text h1 {
        font-size: 2.5rem;
    }

    .hero-text p {
        font-size: 1.1rem;
    }

    .hero-3d-model {
        height: 300px;
    }

    .model-shadow {
        width: 250px;
        height: 60px;
        bottom: 20px;
    }
}
</style>

<script>
// Add floating animation to the 3D model
document.addEventListener('DOMContentLoaded', function() {
    const modelContainer = document.querySelector('.model-container');
    if (modelContainer) {
        modelContainer.style.animation = 'floatModel 6s ease-in-out infinite';
    }
});

@keyframes floatModel {
    0%, 100% {
        transform: translateY(0px) rotateY(0deg);
    }
    25% {
        transform: translateY(-10px) rotateY(5deg);
    }
    50% {
        transform: translateY(-20px) rotateY(0deg);
    }
    75% {
        transform: translateY(-10px) rotateY(-5deg);
    }
}
</script>`;
    }

    // Image to code conversion
    public async convertScreenshotToCode(imageData: string, description: string): Promise<string> {
        if (!this.isEnabled) {
            throw new Error('Internet access is disabled');
        }

        try {
            console.log('Converting screenshot to code...');

            // Mock implementation - replace with actual AI vision model
            // In a real implementation, you would use:
            // - OpenAI Vision API
            // - Google Cloud Vision
            // - Custom ML models

            await new Promise(resolve => setTimeout(resolve, 4000));

            // Generate mock HTML/CSS based on description
            return this.generateMockCode(description);
        } catch (error) {
            console.error('Failed to convert screenshot to code:', error);
            throw new Error('Failed to convert screenshot to code');
        }
    }

    private generateMockCode(description: string): string {
        // Generate different code based on description keywords
        const lowerDesc = description.toLowerCase();

        if (lowerDesc.includes('login') || lowerDesc.includes('sign')) {
            return `<!-- Login Form Generated from Screenshot -->
<div class="login-container">
    <div class="login-form">
        <h2>Sign In</h2>
        <form>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="login-btn">Sign In</button>
        </form>
    </div>
</div>

<style>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 400px;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
}

.login-btn {
    width: 100%;
    padding: 0.75rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.login-btn:hover {
    background: #5a6fd8;
}
</style>`;
        }

        if (lowerDesc.includes('dashboard') || lowerDesc.includes('admin')) {
            return `<!-- Dashboard Generated from Screenshot -->
<div class="dashboard">
    <header class="dashboard-header">
        <h1>Dashboard</h1>
        <nav>
            <a href="#overview">Overview</a>
            <a href="#analytics">Analytics</a>
            <a href="#settings">Settings</a>
        </nav>
    </header>

    <div class="dashboard-content">
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Users</h3>
                <div class="stat-number">12,345</div>
            </div>
            <div class="stat-card">
                <h3>Revenue</h3>
                <div class="stat-number">$45,678</div>
            </div>
            <div class="stat-card">
                <h3>Orders</h3>
                <div class="stat-number">1,234</div>
            </div>
        </div>

        <div class="charts-section">
            <div class="chart-placeholder">
                <p>Chart would go here</p>
            </div>
        </div>
    </div>
</div>

<style>
.dashboard {
    min-height: 100vh;
    background: #f5f5f5;
}

.dashboard-header {
    background: white;
    padding: 1rem 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dashboard-header nav {
    display: flex;
    gap: 2rem;
}

.dashboard-header a {
    color: #666;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    transition: background 0.3s;
}

.dashboard-header a:hover {
    background: #f0f0f0;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin: 2rem 0;
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #667eea;
    margin-top: 0.5rem;
}

.charts-section {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.chart-placeholder {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9f9f9;
    border: 2px dashed #ddd;
    border-radius: 5px;
}
</style>`;
        }

        // Default landing page
        return `<!-- Landing Page Generated from Screenshot -->
<div class="landing-page">
    <header class="hero-section">
        <nav class="navbar">
            <div class="logo">${description}</div>
            <ul class="nav-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>

        <div class="hero-content">
            <h1>Welcome to ${description}</h1>
            <p>Discover amazing possibilities and transform your experience</p>
            <button class="cta-button">Get Started</button>
        </div>
    </header>

    <section class="features-section">
        <div class="container">
            <h2>Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <h3>Feature 1</h3>
                    <p>Description of feature 1</p>
                </div>
                <div class="feature-card">
                    <h3>Feature 2</h3>
                    <p>Description of feature 2</p>
                </div>
                <div class="feature-card">
                    <h3>Feature 3</h3>
                    <p>Description of feature 3</p>
                </div>
            </div>
        </div>
    </section>
</div>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
}

.landing-page {
    min-height: 100vh;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 5%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    text-decoration: none;
    color: #333;
    transition: color 0.3s;
}

.nav-links a:hover {
    color: #667eea;
}

.hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 100px 5% 150px;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.cta-button {
    background: white;
    color: #667eea;
    padding: 1rem 2rem;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.3s;
}

.cta-button:hover {
    transform: translateY(-2px);
}

.features-section {
    padding: 80px 5%;
    background: #f8f9fa;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}

.features-section h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    text-align: center;
}

.feature-card h3 {
    color: #333;
    margin-bottom: 1rem;
}

.feature-card p {
    color: #666;
}
</style>`;
    }

    // Emergency disable function
    public emergencyDisable() {
        this.isEnabled = false;
        try {
            localStorage.removeItem('internetAccessEnabled');
        } catch {
            // Ignore errors during emergency disable
        }
        console.log('Internet access emergency disabled');
    }

    // Safety check - ensure this can be easily removed
    public static removeAllInternetFeatures() {
        console.log('=== INTERNET ACCESS FEATURES REMOVAL ===');
        console.log('To completely remove internet access features:');
        console.log('1. Delete src/IDE/services/internetAccessService.ts');
        console.log('2. Delete src/IDE/plugins/internetAccess.ts');
        console.log('3. Remove internetAccessPlugin from src/IDE/plugins/index.ts');
        console.log('4. Remove internet access functions from src/IDE/contexts/AIContext.tsx');
        console.log('5. Remove internet access types from AIContextType interface');
        console.log('6. Clear localStorage: localStorage.removeItem("internetAccessEnabled")');
        console.log('=====================================');
    }
}

// Export singleton instance
export const internetAccessService = new InternetAccessService();