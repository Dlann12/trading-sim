/**
 * NusaTrade Sim — Tailwind CSS Theme Configuration
 */
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                terminal: {
                    bg: '#0b0f19',
                    card: '#111827',
                    panel: '#161f33',
                    border: '#1f2937',
                    accent: '#6366f1',
                    up: '#10b981',
                    down: '#f43f5e'
                }
            }
        }
    }
};
