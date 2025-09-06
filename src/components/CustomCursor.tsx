import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// --- CURSOR DEFINITIONS ---
const CURSORS = {
  default: { uri: '/cursor/pointinghand.svg', hotspot: { x: 0, y: 0 } },
  pointer: { uri: '/cursor/openhand.svg', hotspot: { x: 22, y: 22 } },
  grabbing: { uri: '/cursor/closedhand.svg', hotspot: { x: 22, y: 22 } },
};

const CustomCursor = () => {
    const [position, setPosition] = useState({ x: -100, y: -100 });
    const [cursorType, setCursorType] = useState<'default' | 'pointer' | 'grabbing'>('default');
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [isGloballyHidden, setIsGloballyHidden] = useState(false);

    useEffect(() => {
        document.body.classList.add('custom-cursor-active');

        const updatePosition = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // When hovering buttons, etc., show the open hand ('pointer' state)
            if (target.closest('a, button, input, [role="button"], [onclick], .monaco-editor')) {
                setCursorType('pointer');
            } else {
                // Otherwise, show the default pointing hand
                setCursorType('default');
            }
        };
        
        const handleMouseDown = () => setIsMouseDown(true);
        const handleMouseUp = () => setIsMouseDown(false);

        document.addEventListener('mousemove', updatePosition);
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        
        const observer = new MutationObserver(() => {
            setIsGloballyHidden(document.body.classList.contains('native-cursor-active'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => {
            document.removeEventListener('mousemove', updatePosition);
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('custom-cursor-active');
            observer.disconnect();
        };
    }, []);
    
    if (isGloballyHidden) {
        return null;
    }

    // On mouse down, always show the grabbing (closed hand) cursor
    const finalCursorType = isMouseDown ? 'grabbing' : cursorType;
    const currentCursor = CURSORS[finalCursorType];
    const isInteracting = finalCursorType !== 'default';

    const styles = {
        cursor: {
            position: 'fixed',
            top: '0px',
            left: '0px',
            width: '44px',
            height: '44px',
            backgroundImage: `url('${currentCursor.uri}')`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            // Position using the cursor's hotspot for pixel-perfect alignment
            transform: `translate3d(${position.x - currentCursor.hotspot.x}px, ${position.y - currentCursor.hotspot.y}px, 0) scale(${isInteracting ? 1.1 : 1})`,
            pointerEvents: 'none',
            zIndex: 99999,
            willChange: 'transform',
            transition: 'transform 0.05s ease-out', // Faster transition for responsiveness
        } as React.CSSProperties,
    };
    
    return createPortal(
        <>
            <div style={styles.cursor} aria-hidden="true" />
        </>,
        document.body
    );
};

export default CustomCursor;
