import React, { useEffect } from 'react';

/**
 * V2 Control Plane Feature Flag Wrapper
 * Enforces dark mode and base UI structural requirements for the Enterprise AI Infrastructure view.
 */
export const V2ControlPlane: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        // Lock HTML into dark mode
        document.documentElement.classList.add('dark');
        document.documentElement.style.backgroundColor = 'hsl(240 10% 4%)';
        document.documentElement.style.color = 'hsl(0 0% 98%)';
    }, []);

    return (
        <div className="v2-control-plane min-h-screen bg-background text-foreground selection:bg-primary/30">
            {children}
        </div>
    );
};
