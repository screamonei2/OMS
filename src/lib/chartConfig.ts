import { Chart } from 'chart.js';
import type { ChartConfiguration } from 'chart.js';

// Color palette matching your design system
export const colors = {
    primary: 'oklch(23.27% 0.0249 284.3)',
    success: 'oklch(83.92% 0.0901 136.87)',
    warning: 'oklch(83.92% 0.1085 80)',
    error: 'oklch(75.1% 0.1814 22.37)',
    info: 'oklch(80.39% 0.1148 241.68)',
    base100: 'oklch(97% 0.0035 67.78)',
    base200: 'oklch(95% 0.0081 61.42)',
    base300: 'oklch(90% 0.0081 61.42)',
    baseContent: 'oklch(40% 0.0081 61.42)'
};

const fontDefaults = {
    family: 'var(--default-font-family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji")',
    size: 18
};

export const titleFont = {
    ...fontDefaults,
    size: 48,
    weight: 600
};

// Global chart configuration
export const defaultOptions: Partial<ChartConfiguration['options']> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: colors.baseContent,
                usePointStyle: true,
                font: fontDefaults
            }
        },
        title: {
            color: colors.baseContent,
            font: {
                size: 16,
                weight: 'bold',
                family: fontDefaults.family
            },
            align: 'start'
        },
        tooltip: {
            backgroundColor: colors.base200,
            titleColor: colors.baseContent,
            bodyColor: colors.baseContent,
            borderColor: colors.base300,
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            usePointStyle: true,
            titleFont: fontDefaults,
            bodyFont: fontDefaults,
            footerFont: fontDefaults
        }
    },
    scales: {
        x: {
            grid: {
                color: colors.base200,
                display: true,
                tickColor: colors.base300
            },
            border: {
                display: true,
                color: colors.base300
            },
            ticks: {
                color: colors.baseContent,
                font: fontDefaults
            },
            title: {
                font: titleFont
            }
        },
        y: {
            grid: {
                color: colors.base200,
                display: true,
                tickColor: colors.base300
            },
            border: {
                display: true,
                color: colors.base300
            },
            ticks: {
                color: colors.baseContent,
                font: fontDefaults
            },
            title: {
                font: titleFont
            }
        }
    },
    elements: {
        point: {
            radius: 4,
            hoverRadius: 6
        },
        line: {
            borderWidth: 2,
            tension: 0.3
        },
        arc: {
            borderWidth: 1,
            borderColor: colors.base100
        },
        bar: {
            borderWidth: 0,
            borderRadius: 4
        }
    }
} as const;

// Apply global defaults
Chart.defaults.font = {
    ...Chart.defaults.font,
    ...fontDefaults
};
Chart.defaults.borderColor = colors.base200;
Chart.defaults.color = colors.baseContent;