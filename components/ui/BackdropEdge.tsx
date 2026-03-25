'use client';

import { useLayoutEffect, useState, type RefObject } from "react";

interface BackdropEdgeProps {
    position?: 'top' | 'bottom';
    className?: string;
    containerRef?: RefObject<HTMLElement | null>;
}

export default function BackdropEdge({
    position = 'bottom',
    className = '',
    containerRef,
}: BackdropEdgeProps) {
    const isBottom = position === 'bottom';
    const [metrics, setMetrics] = useState({ left: 0, width: 0 });

    useLayoutEffect(() => {
        const syncMetrics = () => {
            const container = containerRef?.current;
            if (!container) {
                setMetrics({ left: 0, width: 0 });
                return;
            }

            const rect = container.getBoundingClientRect();
            setMetrics({
                left: rect.left,
                width: rect.width,
            });
        };

        syncMetrics();

        const wrapper = document.querySelector<HTMLElement>("[data-lenis-wrapper='true']");
        wrapper?.addEventListener("scroll", syncMetrics, { passive: true });
        window.addEventListener("resize", syncMetrics);

        return () => {
            wrapper?.removeEventListener("scroll", syncMetrics);
            window.removeEventListener("resize", syncMetrics);
        };
    }, [containerRef]);

    return (
        <div
            className={`fixed h-36 brightness-125 backdrop-blur-xs z-50 pointer-events-none ${isBottom ? 'bottom-0' : 'top-0'
                } ${className}`}
            style={{
                left: metrics.left ? `${metrics.left}px` : undefined,
                width: metrics.width ? `${metrics.width}px` : undefined,
                WebkitBackdropFilter: 'blur(4px) brightness(120%)',
                maskImage: isBottom
                    ? 'linear-gradient(to top, black 0, black 6px, transparent 152px)'
                    : 'linear-gradient(to bottom, black 0, black 6px, transparent 152px)',
                WebkitMaskImage: isBottom
                    ? 'linear-gradient(to top, black 0, black 6px, transparent 152px)'
                    : 'linear-gradient(to bottom, black 0, black 6px, transparent 152px)',
            }}
            aria-hidden="true"
        />
    );
}
