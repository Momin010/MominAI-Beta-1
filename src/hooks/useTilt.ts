import { useEffect, useRef } from 'react';

export const useTilt = (options = {}) => {
    const ref = useRef(null);

    const mergedOptions = { 
        max: 15, 
        perspective: 1000, 
        speed: 300, 
        easing: "cubic-bezier(.03,.98,.52,.99)",
        ...options
    };

    const { max, perspective, speed, easing } = mergedOptions;

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const handleMouseMove = (e) => {
            const { left, top, width, height } = element.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;

            const rotateX = max * (y - 0.5) * -1;
            const rotateY = max * (x - 0.5);

            element.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        };

        const handleMouseLeave = () => {
            element.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        };
        
        const handleMouseEnter = () => {
            element.style.transition = `transform ${speed}ms ${easing}`;
        }

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
            element.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [ref, max, perspective, speed, easing]);

    return ref;
};