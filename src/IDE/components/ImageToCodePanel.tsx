
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../App';
import { useAI } from '../contexts/AIContext';
import { generateCodeFromImage } from '../services/aiService';

const ImageToCodePanel: React.FC = () => {
    const { addNotification } = useNotifications();
    const { createNode, openFile } = useAI();
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
      return () => cleanup();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            cleanup();
            const reader = new FileReader();
            reader.onload = (e) => setImageSrc(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        cleanup();
        setImageSrc(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            addNotification({type: 'error', message: 'Could not access camera.'});
        }
    };

    const takePicture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            setImageSrc(canvas.toDataURL('image/jpeg'));
            cleanup();
        }
    };
    
    const handleSubmit = async () => {
        if (!imageSrc) {
            addNotification({type: 'warning', message: 'Please provide an image.'});
            return;
        }
        setIsLoading(true);
        try {
            const base64Image = imageSrc.split(',')[1];
            const code = await generateCodeFromImage(base64Image, prompt);
            const path = '/components/GeneratedUI.html';
            createNode(path, 'file', code);
            addNotification({type: 'success', message: `UI generated at ${path}`});
            openFile(path);
        } catch (error) {
            if(error instanceof Error) addNotification({type: 'error', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const isCameraActive = !!videoRef.current?.srcObject;

    return (
        <div className="frost bg-transparent text-white w-full h-full flex flex-col p-4 overflow-y-auto">
             <div className="p-2 border-b border-[var(--border-color)] flex-shrink-0 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider">Image to Code</h2>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center">
                <div className="w-full">
                    <div className="w-full h-64 bg-[var(--gray-dark)]/50 border border-dashed border-[var(--border-color)] rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                        {imageSrc && <img src={imageSrc} className="max-w-full max-h-full object-contain rounded-lg" />}
                        {isCameraActive && <video ref={videoRef} autoPlay className="w-full h-full object-contain rounded-lg" />}
                        {!imageSrc && !isCameraActive && (
                            <div className="text-center text-gray-400">
                                <p>Upload an image or use your camera.</p>
                            </div>
                        )}
                    </div>

                     <div className="flex items-center justify-center space-x-4 mb-4">
                        <label className="bg-[var(--gray-light)] hover:bg-[var(--gray)] text-white font-bold py-2 px-4 rounded-md cursor-pointer transition-colors text-sm">
                            Upload Image
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        <button onClick={isCameraActive ? takePicture : startCamera} className="bg-[var(--accent)] hover:brightness-125 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                            {isCameraActive ? 'Take Picture' : 'Use Camera'}
                        </button>
                    </div>

                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Add a hint (e.g., 'This is a login form, make it responsive')" className="w-full bg-[var(--gray-dark)] border border-[var(--border-color)] p-2 rounded-md mb-4 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors resize-y" rows={2}/>

                    <button onClick={handleSubmit} disabled={isLoading || !imageSrc} className="w-full px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-bold disabled:bg-gray-500 disabled:cursor-wait transition-colors">
                        {isLoading ? 'Generating...' : 'Generate Code'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageToCodePanel;
