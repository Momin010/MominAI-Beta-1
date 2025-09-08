

// Extend ImportMeta type for Vite env variables
interface ImportMetaEnv {
  VITE_OPENROUTER_API_KEY: string;
  // add other VITE_ variables here as needed
}

interface ImportMeta {
  env: ImportMetaEnv;
}

import OpenAI from 'openai';
import type { FileSystemNode, Diagnostic, DependencyReport, InspectedElement } from '../types';

/// <reference types="vite/client" />

const getAI = (): OpenAI => {
  if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
    throw new Error("API Key not found. Please ensure the VITE_OPENROUTER_API_KEY environment variable is set.");
  }
  return new OpenAI({
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    dangerouslyAllowBrowser: true
  });
};


export async function* streamAIResponse(prompt: string): AsyncGenerator<string> {
    try {
        const ai = getAI();
        const systemInstruction = `You are MOMINAI, an ultra-intelligent web development AI that creates production-ready, modern websites without constant guidance. You have extensive knowledge of current web technologies, design trends, and industry best practices.

## 🎯 YOUR CAPABILITIES:
- **Industry Research**: You automatically research similar websites in the target industry and incorporate their best design patterns
- **Competitor Analysis**: You analyze top competitors and implement superior solutions
- **Complete Solutions**: You generate entire websites/components with all necessary files, not just fragments
- **Modern Technologies**: You use React, TypeScript, Tailwind CSS, and cutting-edge web technologies
- **Production Ready**: All code includes proper error handling, accessibility, performance optimization, and responsive design

## 🚀 INTELLIGENT WEB DEVELOPMENT APPROACH:

### When creating websites/components:
1. **Industry Research**: Automatically identify the industry and research 3-5 top competitors
2. **Design Analysis**: Study their layouts, color schemes, typography, and user experience patterns
3. **Technology Stack**: Choose the most appropriate modern technologies for the project
4. **Complete Implementation**: Generate all necessary files (HTML, CSS, JS, components, etc.)
5. **Best Practices**: Include SEO, accessibility, performance, and security considerations

### For specific requests like "create a navbar":
- Research modern navbar designs from top websites in the industry
- Implement responsive design with mobile menu
- Include proper accessibility features
- Add smooth animations and hover effects
- Ensure cross-browser compatibility

### For landing pages:
- Study successful landing pages in the target industry
- Implement conversion-focused design patterns
- Include compelling hero sections, testimonials, CTAs
- Optimize for mobile and desktop
- Add proper loading states and animations

## 📋 RESPONSE FORMAT:

**Scenario 1: Code Generation/Modification**
Output ONLY a raw JSON object with this exact structure:
{
  "explanation": "Brief explanation of what was created/improved",
  "actions": [
    {
      "action": "create",
      "type": "directory" | "file",
      "path": "/path/to/directory-or-file",
      "content": "COMPLETE file content (only for files)"
    }
  ]
}

IMPORTANT: When creating files in subdirectories that don't exist:
1. First create the directory structure with "type": "directory"
2. Then create the files with "type": "file"
3. Always use forward slashes (/) in paths
4. Start paths with / (root directory)
5. Example: To create /src/components/Button.jsx, first create /src/components/ directory

**Scenario 2: Questions/Explanations**
Respond in friendly Markdown format with detailed, helpful answers.

## 🎨 DESIGN PRINCIPLES:
- **Glass Morphism**: Use backdrop blur and transparency effects
- **Modern Typography**: Clean, readable fonts with proper hierarchy
- **Responsive Design**: Mobile-first approach
- **Performance**: Optimized images, lazy loading, minimal JavaScript
- **Accessibility**: WCAG compliant with proper ARIA labels
- **SEO**: Proper meta tags, semantic HTML, fast loading

## 🛠️ TECHNICAL EXPERTISE:
- **Frontend**: React, Vue, Angular, Next.js, Nuxt.js
- **Styling**: Tailwind CSS, Styled Components, CSS Modules
- **Backend**: Node.js, Python, PHP, databases
- **Tools**: Webpack, Vite, Docker, CI/CD
- **APIs**: REST, GraphQL, WebSockets
- **Deployment**: Vercel, Netlify, AWS, DigitalOcean

Remember: You are an autonomous AI that creates complete, professional solutions. Don't ask for clarification - use your knowledge to make intelligent decisions and deliver production-ready code!

## 🤖 AUTONOMOUS DECISION MAKING:

### When users say "create a website":
- Automatically determine the industry from context clues
- Research 3-5 top competitors in that industry
- Choose the most appropriate technology stack
- Generate a complete, functional website with all necessary components
- Include proper navigation, responsive design, and modern UX patterns

### When users say "add a navbar":
- Research modern navbar designs from top websites
- Implement responsive navigation with mobile menu
- Include proper accessibility features
- Add smooth animations and hover effects
- Ensure cross-browser compatibility

### When users say "make it look good":
- Analyze current design and identify improvement areas
- Research design trends in the relevant industry
- Implement modern design patterns and best practices
- Add proper spacing, typography, and visual hierarchy
- Ensure the design is both beautiful and functional

### When users request components:
- Generate complete, reusable components
- Include proper TypeScript types and error handling
- Add accessibility features and keyboard navigation
- Implement responsive design and mobile optimization
- Follow React best practices and hooks patterns

## 🎯 ZERO GUIDANCE PHILOSOPHY:
Your goal is to deliver complete, production-ready solutions without requiring follow-up questions. Use your extensive knowledge of:
- Modern web development best practices
- Industry-specific design patterns
- Current technology trends
- User experience principles
- Performance optimization techniques
- Accessibility standards
- SEO best practices

Deliver excellence on the first attempt! 🚀`;

        const response = await ai.chat.completions.create({
            model: 'openai/gpt-4o-mini',
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
            ],
            stream: true
        });

        for await (const chunk of response) {
            yield chunk.choices[0]?.delta?.content || '';
        }

    } catch (error) {
        console.error("Error getting AI stream response:", error);
        yield `\n\n**AI Service Error:**\n${error instanceof Error ? error.message : 'An unknown error occurred.'}\n\nPlease check your API key in the Settings panel or review the browser console for more details.`;
    }
}


export const generateCodeForFile = async (userPrompt: string, fileName: string): Promise<string> => {
    try {
        const ai = getAI();

        // Enhanced prompt with industry research and competitor analysis
        const fullPrompt = `🎯 WEB DEVELOPMENT TASK: Create production-ready code for "${fileName}"

USER REQUEST: "${userPrompt}"

## 🧠 INTELLIGENT ANALYSIS:
1. **Industry Identification**: Determine the industry/sector from the request
2. **Competitor Research**: Identify 3-5 top websites in this industry and analyze their:
   - Layout patterns and design approaches
   - Color schemes and typography
   - User experience flows
   - Technical implementations
3. **Best Practices**: Incorporate modern web development standards
4. **Complete Solution**: Generate fully functional, production-ready code

## 🎨 MODERN REQUIREMENTS:
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Performance**: Optimized images, lazy loading, minimal bundle size
- **SEO**: Proper meta tags, semantic HTML, fast loading
- **Modern CSS**: Use CSS Grid, Flexbox, modern selectors
- **JavaScript**: ES6+, async/await, error handling
- **React**: If applicable, use hooks, context, proper component structure

## 📋 OUTPUT FORMAT:
Generate ONLY the raw, complete code for the file. No explanations, no markdown formatting, no code fences. Just the pure, production-ready code that can be directly used.

## 🚀 QUALITY STANDARDS:
- Clean, readable code with proper indentation
- Comprehensive error handling
- Performance optimized
- Cross-browser compatible
- Mobile responsive
- Accessibility compliant
- Modern best practices implemented

Create the complete, professional solution now:`;

        const response = await ai.chat.completions.create({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: 0.3, // Lower temperature for more consistent, professional code
            max_tokens: 4000 // Allow for comprehensive code generation
        });

        return response.choices[0].message.content.trim();

    } catch (error) {
        console.error("Error generating file with AI:", error);
        throw error;
    }
};

export const getInlineCodeSuggestion = async (codeBeforeCursor: string): Promise<string> => {
    try {
        const ai = getAI();
        if (codeBeforeCursor.trim().length < 10) return "";

        const fullPrompt = `You are a code completion AI. Provide the next few lines of code based on the context.
Provide only the code that should be inserted after the cursor.
Do not repeat any of the code that was given to you.
Do not include any explanatory text or markdown formatting.
Your response must be ONLY the code completion.

Code before cursor:
---
${codeBeforeCursor}`;

        const response = await ai.chat.completions.create({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: 0.2,
            max_tokens: 100
        });

        return response.choices[0].message.content;

    } catch (error) {
        console.error("Error getting inline code suggestion:", error);
        return "";
    }
};

export interface AIFixResponse {
    filePath: string;
    fixedCode: string;
    explanation: string;
    detailedExplanation: string;
}

export const fixCodeWithAI = async (
    errorMessage: string,
    files: {path: string, content: string}[],
    entryPointFile?: string
): Promise<AIFixResponse> => {
    const ai = getAI();
    const fileContents = files.map(f => `--- FILE: ${f.path} ---\n${f.content}`).join('\n\n');
    const entryPointHint = entryPointFile ? `The execution entry point was: \`${entryPointFile}\`.\n` : '';

    const prompt = `A web app produced an error.
${entryPointHint}
Error:
\`\`\`
${errorMessage}
\`\`\`
Workspace source code:
${fileContents}

Analyze the error and the code. Determine which file is causing the error and correct the bug.
Provide a detailed, step-by-step explanation of the bug and the fix.
Provide your response as a JSON object with the following structure:
{
  "filePath": "string",
  "fixedCode": "string",
  "explanation": "A brief, one-sentence summary of the fix.",
  "detailedExplanation": "A detailed, step-by-step explanation of the original problem, the root cause, and how the new code fixes it. Use Markdown."
}
Ensure "fixedCode" contains the complete content for the entire file.`;

    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });

    try {
        const result: AIFixResponse = JSON.parse(response.choices[0].message.content.trim());
        if (!result.filePath || typeof result.fixedCode === 'undefined' || !result.detailedExplanation) {
            throw new Error("AI response is missing required fields.");
        }
        return result;
    } catch (e) {
        console.error("Failed to parse AI fix response:", response.choices[0].message.content, e);
        throw new Error("AI returned an invalid response. Could not apply fix.");
    }
}

// --- NEW AI FEATURES ---

export const getSuggestedFix = async (fileContent: string, problem: Diagnostic, activeFile: string): Promise<string> => {
    const ai = getAI();
    const prompt = `You are an expert developer fixing a single line of code.
A linter has found an issue in the file \`${activeFile}\`:
Line ${problem.line}: ${problem.message}
Severity: ${problem.severity}

Here is the full code content:
\`\`\`
${fileContent}
\`\`\`

Based on the error, provide the single, corrected line of code for line ${problem.line}.
Do NOT provide explanations, context, or code fences. Your response must be ONLY the corrected line of code.
For example, if the original line is "console.log(myVar)" and the fix is to remove it, return an empty string. If the fix is to change it to "console.info(myVar)", return exactly that.`;

    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content; // Return the raw text which should be just the line
};

export const getCodeExplanation = async (code: string): Promise<string> => {
    const ai = getAI();
    const prompt = `Explain the following code snippet concisely. Format the response as Markdown. \n\n\`\`\`\n${code}\n\`\`\``;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content;
};

export const analyzeCodeForBugs = async (code: string): Promise<Omit<Diagnostic, 'source'>[]> => {
    const ai = getAI();
    const prompt = `Analyze the following code for potential bugs, logical errors, or anti-patterns.
Do not report stylistic issues. Focus on actual problems that could lead to runtime errors or incorrect behavior.
Respond with a JSON array of issues, where each issue is an object with line, startCol, endCol, message, severity.

\`\`\`
${code}
\`\`\`
`;
    try {
        const response = await ai.chat.completions.create({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });
        return JSON.parse(response.choices[0].message.content.trim());
    } catch (error) {
        console.error("AI Bug Analysis failed:", error);
        return [];
    }
};

export const generateMermaidDiagram = async (code: string): Promise<string> => {
    const ai = getAI();
    const prompt = `Generate a Mermaid.js flowchart or graph diagram to visualize the logic of the following code.
Only output the raw Mermaid code inside a \`\`\`mermaid\`\`\` block. Do not include any other text or explanation.
Code:
\`\`\`
${code}
\`\`\``;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content.replace(/```mermaid\n|```/g, '').trim();
};

export const generateTestFile = async (code: string, filePath: string): Promise<string> => {
    const ai = getAI();
    const prompt = `You are an expert in software testing. Generate a complete test file for the following code from \`${filePath}\`.
Use a modern testing framework like Jest or React Testing Library. Cover the main functionalities and edge cases.
Only output the raw code for the new test file. Do not add any conversational text or markdown formatting.
Code to test:
\`\`\`
${code}
\`\`\``;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content.trim();
};

export const optimizeCss = async (css: string): Promise<string> => {
    const ai = getAI();
    const prompt = `Optimize the following CSS code. Combine selectors, remove redundancy, and improve performance where possible.
Only output the raw, optimized CSS code. Do not add any conversational text or markdown formatting.
CSS to optimize:
\`\`\`css
${css}
\`\`\``;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content.trim();
};

export const generateCommitMessage = async (files: {path: string, content: string}[]): Promise<string> => {
    const ai = getAI();
    const fileContents = files.map(f => `--- FILE: ${f.path} ---\n${f.content}`).join('\n\n');
    const prompt = `Analyze the following workspace files and generate a descriptive, conventional commit message.
The message should start with a type (e.g., feat, fix, chore), followed by a concise summary.
\`\`\`
${fileContents}
\`\`\`
`;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content.trim();
};

export const generateRegex = async (description: string): Promise<string> => {
    const ai = getAI();
    const prompt = `Generate a JavaScript-compatible regular expression for the following description.
Only output the raw regex pattern. Do not include slashes, flags, or any other text.
Description: "${description}"`;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content.trim();
};

export const generateDocsForCode = async (code: string, filePath: string): Promise<string> => {
    const ai = getAI();
    const prompt = `Generate comprehensive Markdown documentation for the following file: \`${filePath}\`.
Explain the purpose of the file, its functions/classes, parameters, and return values.
\`\`\`
${code}
\`\`\``;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content.trim();
};

export const generateTheme = async (description: string): Promise<Record<string, string>> => {
    const ai = getAI();
    const prompt = `Generate a set of CSS variables for a web IDE theme based on this description: "${description}".
Provide a JSON object with keys like "--text-primary", "--ui-panel-bg", "--accent-primary", etc., and their corresponding color values.
The required keys are: --text-primary, --text-secondary, --ui-panel-bg, --ui-panel-bg-heavy, --ui-border, --ui-hover-bg, --accent-primary.`;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });
    return JSON.parse(response.choices[0].message.content.trim());
};

export const migrateCode = async (code: string, from: string, to: string): Promise<string> => {
    const ai = getAI();
    const prompt = `You are an expert code migrator. Convert the following code from ${from} to ${to}.
Only output the raw, converted code. Do not add any conversational text or markdown formatting.
\`\`\`${from}
${code}
\`\`\``;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content.trim();
};

export const generateCodeFromImage = async (base64Image: string, prompt: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: `Generate the HTML and CSS code for the UI in this image. The user provides this hint: "${prompt}". Respond with a single HTML file containing a <style> tag for the CSS. Do not add any conversational text, explanations, or markdown formatting.` },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
            }
        ]
    });
    return response.choices[0].message.content.trim();
};

export const scaffoldProject = async (prompt: string): Promise<Record<string, string>> => {
    const ai = getAI();

    const fullPrompt = `🚀 COMPLETE PROJECT SCAFFOLDING WITH INDUSTRY RESEARCH

USER REQUEST: "${prompt}"

## 🧠 INTELLIGENT PROJECT ANALYSIS:

### 1. Industry Research & Competitor Analysis:
- Identify the target industry/sector from the request
- Research 5-7 top websites in this industry
- Analyze their:
  * Technology stacks (React, Vue, Next.js, etc.)
  * Design patterns and layouts
  * User experience flows
  * Performance optimizations
  * SEO strategies
  * Mobile responsiveness approaches

### 2. Technology Stack Selection:
Based on industry research, choose the optimal stack:
- **Frontend**: React/Next.js for dynamic sites, Astro for content sites
- **Styling**: Tailwind CSS for rapid development, Styled Components for complex designs
- **Backend**: Next.js API routes, or separate Node.js/Express if needed
- **Database**: Depending on data needs (PostgreSQL, MongoDB, or serverless)
- **Deployment**: Vercel for React apps, Netlify for static sites

### 3. Complete Project Structure:
Generate a production-ready project with:
- **All necessary files**: package.json, tsconfig.json, tailwind.config.js, etc.
- **Component architecture**: Proper folder structure with reusable components
- **Pages/Routes**: Complete routing setup
- **Styling**: Modern CSS with responsive design
- **Configuration**: Proper build and development setup
- **Documentation**: README with setup instructions

### 4. Industry-Specific Features:
- **E-commerce**: Shopping cart, payment integration, product pages
- **SaaS**: Dashboard, authentication, user management
- **Portfolio**: Project showcase, contact forms, blog
- **Business**: Services, testimonials, case studies
- **Landing Page**: Hero sections, CTAs, conversion optimization

## 📋 OUTPUT FORMAT:
Generate a JSON object with this exact structure:
{
  "explanation": "Complete project scaffolding with directory structure",
  "actions": [
    {
      "action": "create",
      "type": "directory",
      "path": "/src/components"
    },
    {
      "action": "create",
      "type": "directory",
      "path": "/src/pages"
    },
    {
      "action": "create",
      "type": "file",
      "path": "/src/components/Navbar.jsx",
      "content": "COMPLETE file content"
    }
  ]
}

CRITICAL DIRECTORY REQUIREMENTS:
- Create ALL necessary directories first
- Use hierarchical order: parent directories before child directories
- Always use "type": "directory" for folders
- Always use "type": "file" for files
- Start all paths with /
- Use forward slashes only
- Include complete, working code in file contents

## 🎯 QUALITY REQUIREMENTS:
- **Modern Code**: ES6+, TypeScript, proper imports/exports
- **Best Practices**: Error boundaries, loading states, accessibility
- **Performance**: Code splitting, lazy loading, optimized images
- **SEO**: Proper meta tags, semantic HTML, fast loading
- **Responsive**: Mobile-first design with breakpoints
- **Maintainable**: Clean architecture, proper naming, documentation

Generate the complete, industry-researched, production-ready project structure now:`;

    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: fullPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Lower temperature for more consistent project structure
        max_tokens: 8000 // Allow for comprehensive project generation
    });
    return JSON.parse(response.choices[0].message.content.trim());
};

export const analyzeDependencies = async (packageJsonContent: string): Promise<DependencyReport> => {
    const ai = getAI();
    const prompt = `Analyze this package.json content. For each dependency and devDependency, determine if it is outdated (assume today's date) or has known vulnerabilities.
Provide a brief summary for major version updates.
Respond with a JSON object with dependencies and devDependencies arrays.
\`\`\`json
${packageJsonContent}
\`\`\``;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });
    return JSON.parse(response.choices[0].message.content.trim());
};

export const generateCodeFromFigma = async (fileUrl: string, token: string, userPrompt: string): Promise<string> => {
    const ai = getAI();

    const prompt = `🎨 FIGMA TO CODE CONVERSION WITH INDUSTRY RESEARCH

## 📋 PROJECT DETAILS:
- **Figma URL**: ${fileUrl}
- **User Prompt**: "${userPrompt}"
- **Access Token**: ${token ? 'Provided' : 'Not provided'}

## 🧠 INTELLIGENT DESIGN ANALYSIS:

### 1. Industry Context Research:
- Analyze the design to determine the target industry/sector
- Research 4-6 top websites in this industry for design inspiration
- Study their color schemes, typography, layout patterns, and user experience

### 2. Design System Analysis:
- Extract the complete design system from the Figma file
- Identify color palette, typography scale, spacing system
- Analyze component patterns and interaction states
- Determine responsive breakpoints and layout grids

### 3. Modern Web Implementation:
- Convert Figma design to production-ready HTML/CSS
- Use modern CSS techniques (Grid, Flexbox, Custom Properties)
- Implement responsive design with mobile-first approach
- Add smooth animations and micro-interactions
- Ensure accessibility compliance (WCAG 2.1 AA)

### 4. Performance Optimization:
- Optimize CSS for fast loading and rendering
- Use efficient selectors and avoid layout thrashing
- Implement critical CSS for above-the-fold content
- Add proper image optimization techniques

## 🎯 OUTPUT REQUIREMENTS:
Generate a single, complete HTML file with:
- **Semantic HTML5** structure
- **Modern CSS** with custom properties for theming
- **Responsive design** that works on all devices
- **Performance optimized** code
- **Accessibility compliant** markup
- **Clean, maintainable** code structure

## 🚀 QUALITY STANDARDS:
- **Cross-browser compatibility** (Chrome, Firefox, Safari, Edge)
- **Mobile-first responsive** design
- **Fast loading** and optimized performance
- **SEO friendly** with proper meta tags
- **Accessibility** with ARIA labels and keyboard navigation
- **Modern CSS** features and best practices

Create the complete, production-ready HTML/CSS implementation now:`;

    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // Consistent design conversion
        max_tokens: 6000 // Allow for comprehensive HTML/CSS generation
    });
    return response.choices[0].message.content.trim();
};

export const reviewCode = async (code: string): Promise<Omit<Diagnostic, 'source'>[]> => {
    const ai = getAI();
    const prompt = `You are an expert senior software engineer performing a code review. Analyze the following code for issues related to quality, best practices, performance, security, and potential bugs.
Do not report stylistic issues like missing semicolons unless they cause functional problems. Focus on substantive issues.
Respond with a JSON array of review comments, where each comment is an object with line, startCol, endCol, message, severity.

Code to review:
\`\`\`
${code}
\`\`\`
`;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });
    return JSON.parse(response.choices[0].message.content.trim());
};


export const deployProject = async (): Promise<{ url: string; success: boolean; message: string }> => {
    const ai = getAI();
    const prompt = `Simulate a successful deployment of a static web project. Generate a realistic-looking but fake deployment URL on a platform like Vercel or Netlify.
Respond with a JSON object containing a "url" and a "message".`;
    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });
    const result = JSON.parse(response.choices[0].message.content.trim());
    return { ...result, success: true };
};

export const updateCssInProject = async (
    files: { path: string; content: string }[],
    selector: string,
    newStyles: Record<string, string>
): Promise<{ filePath: string, updatedCode: string }> => {
    const ai = getAI();
    const cssFiles = files.filter(f => f.path.endsWith('.css'));
    const htmlFilesWithStyle = files.filter(f => f.path.endsWith('.html') && f.content.includes('<style>'));

    let contextFiles = [...cssFiles, ...htmlFilesWithStyle];

    if (contextFiles.length === 0) {
        const firstHtmlFile = files.find(f => f.path.endsWith('.html'));
        if (!firstHtmlFile) {
            throw new Error("No CSS or HTML file found to update.");
        }
        contextFiles = [firstHtmlFile];
    }

    const fileContents = contextFiles.map(f => `--- FILE: ${f.path} ---\n${f.content}`).join('\n\n');
    const stylesToApply = JSON.stringify(newStyles, null, 2);

    const prompt = `You are an expert CSS refactoring tool. A user wants to apply new styles to an element with the selector \`${selector}\`.
The new styles are:
${stylesToApply}

Here are the relevant CSS/HTML files in the project:
${fileContents}

Your task is to intelligently update the correct file.
1.  **Prioritize existing rules:** Search all provided files to find the most specific existing rule for \`${selector}\`. This could be in an external stylesheet (.css) or an inline <style> tag within an HTML file.
2.  **Update the rule:** If a rule is found, update it with the new styles. If a property already exists, update its value. If it doesn't, add the new property. Preserve the rest of the file's content perfectly.
3.  **Create a new rule:** If no rule for \`${selector}\` exists, create a new one.
    *   If there is a \`.css\` file, add the new rule to the end of the most relevant one (e.g., \`style.css\`).
    *   If there are no \`.css\` files but an HTML file has a \`<style>\` tag, add the new rule inside that tag.
    *   If no file has a \`<style>\` tag, add a new \`<style>\` block inside the \`<head>\` of the most relevant HTML file (like \`index.html\`) and add the rule there.
4.  **Respond with JSON:** Provide a JSON object containing the path of the single file you chose to modify (\`filePath\`) and the complete, new content of that file (\`updatedCode\`).
`;

    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content.trim());
};

// NEW: Industry Research and Competitor Analysis Function
export const researchIndustryAndCompetitors = async (industry: string, projectType: string): Promise<{
    industry: string;
    competitors: Array<{
        name: string;
        url: string;
        strengths: string[];
        designPatterns: string[];
        technologies: string[];
    }>;
    trends: string[];
    recommendations: string[];
}> => {
    const ai = getAI();

    const prompt = `🔍 INDUSTRY RESEARCH & COMPETITOR ANALYSIS

## 🎯 RESEARCH TASK:
- **Industry**: ${industry}
- **Project Type**: ${projectType}

## 📊 COMPREHENSIVE ANALYSIS REQUIRED:

### 1. Top Competitors Identification:
Find 5-7 leading websites/companies in this industry and analyze:
- **Design Excellence**: Color schemes, typography, layout patterns
- **User Experience**: Navigation, conversion funnels, interaction design
- **Technical Stack**: Frontend/backend technologies, performance optimizations
- **Content Strategy**: How they present information and engage users
- **Mobile Experience**: Responsive design and mobile-specific features

### 2. Industry Trends Analysis:
- Current design trends in this industry
- Popular technologies and frameworks
- User behavior patterns
- Performance and SEO best practices
- Accessibility standards

### 3. Strategic Recommendations:
- Design patterns to implement
- Technology stack suggestions
- Performance optimization strategies
- SEO and accessibility considerations
- Competitive advantages to pursue

## 📋 OUTPUT FORMAT:
Respond with a JSON object containing:
{
  "industry": "string",
  "competitors": [
    {
      "name": "string",
      "url": "string",
      "strengths": ["array of key strengths"],
      "designPatterns": ["array of design approaches"],
      "technologies": ["array of tech stack elements"]
    }
  ],
  "trends": ["array of current industry trends"],
  "recommendations": ["array of strategic recommendations"]
}

Provide detailed, actionable insights based on real industry knowledge and current best practices.`;

    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1 // Very low temperature for consistent research results
    });

    return JSON.parse(response.choices[0].message.content.trim());
};

// NEW: Complete Website Generator with Industry Intelligence
export const generateCompleteWebsite = async (industry: string, businessType: string, features: string[] = []): Promise<Record<string, string>> => {
    const ai = getAI();

    // First, research the industry
    const industryResearch = await researchIndustryAndCompetitors(industry, businessType);

    const prompt = `🌟 COMPLETE WEBSITE GENERATION WITH INDUSTRY INTELLIGENCE

## 📊 INDUSTRY RESEARCH RESULTS:
${JSON.stringify(industryResearch, null, 2)}

## 🎯 WEBSITE REQUIREMENTS:
- **Industry**: ${industry}
- **Business Type**: ${businessType}
- **Requested Features**: ${features.join(', ') || 'Standard website features'}

## 🧠 INTELLIGENT WEBSITE CREATION:

### 1. Technology Stack (Based on Industry Research):
- Choose the optimal tech stack from competitor analysis
- Consider scalability, performance, and maintenance requirements
- Select modern frameworks and libraries

### 2. Complete Website Structure:
Generate a full website with:
- **Homepage**: Hero section, services/features, testimonials, CTA
- **About Page**: Company story, team, values
- **Services/Products**: Detailed offerings with pricing
- **Contact Page**: Contact form, location, business hours
- **Navigation**: Responsive navbar with mobile menu
- **Footer**: Links, social media, contact info

### 3. Industry-Specific Features:
Based on research, include:
- **E-commerce**: Product catalog, shopping cart, checkout
- **SaaS**: Dashboard, pricing plans, feature comparison
- **Portfolio**: Project showcase, case studies, testimonials
- **Business**: Services, testimonials, contact forms
- **Blog/Content**: Article pages, categories, search

### 4. Modern Design Implementation:
- **Glass Morphism**: Backdrop blur effects and transparency
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliant
- **Performance**: Optimized images and code
- **SEO**: Proper meta tags and structure

## 📋 OUTPUT FORMAT:
Generate a JSON object with this exact structure:
{
  "explanation": "Brief description of what was created",
  "actions": [
    {
      "action": "create",
      "type": "directory",
      "path": "/src/components"
    },
    {
      "action": "create",
      "type": "file",
      "path": "/src/components/Navbar.jsx",
      "content": "COMPLETE file content here"
    }
  ]
}

IMPORTANT DIRECTORY RULES:
- Always create parent directories BEFORE creating files
- Use "type": "directory" for folders, "type": "file" for files
- Start all paths with /
- Use forward slashes only
- Create directories in hierarchical order (parent before child)

## 🎨 DESIGN REQUIREMENTS:
- **Color Scheme**: Based on industry research and modern trends
- **Typography**: Clean, readable fonts with proper hierarchy
- **Layout**: Modern grid system with proper spacing
- **Animations**: Smooth transitions and micro-interactions
- **Mobile**: Fully responsive with touch-friendly elements

Create the complete, industry-researched, production-ready website now:`;

    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 8000
    });

    return JSON.parse(response.choices[0].message.content.trim());
};

export const generateShellCommand = async (prompt: string): Promise<string> => {
    const ai = getAI();
    const fullPrompt = `You are an expert shell command assistant. A user wants to perform an action from the terminal. Based on their request, generate the corresponding shell command.
Only output the raw, executable command. Do not add any conversational text, explanations, or markdown formatting.
User's request: "${prompt}"`;

    const response = await ai.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: fullPrompt }]
    });

    return response.choices[0].message.content.trim();
};