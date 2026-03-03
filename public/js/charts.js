/**
 * charts.js — Chart.js helper utilities
 */
const CHART_COLORS = [
    '#6366f1', '#a78bfa', '#06b6d4', '#22c55e', '#f59e0b',
    '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
];

const Charts = {
    _instances: {},

    destroy(id) {
        if (this._instances[id]) {
            this._instances[id].destroy();
            delete this._instances[id];
        }
    },

    destroyAll() {
        Object.keys(this._instances).forEach(id => this.destroy(id));
    },

    donut(canvasId, labels, data, title) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        this._instances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: CHART_COLORS.slice(0, labels.length),
                    borderColor: '#0a0f1e',
                    borderWidth: 2,
                    hoverOffset: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 11, weight: '500' },
                            padding: 12,
                            usePointStyle: true,
                            pointStyleWidth: 10,
                        }
                    },
                    title: {
                        display: !!title,
                        text: title || '',
                        color: '#f1f5f9',
                        font: { family: 'Inter', size: 13, weight: '600' },
                        padding: { bottom: 16 },
                    },
                    tooltip: {
                        backgroundColor: '#1e2a3e',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 10,
                        titleFont: { family: 'Inter', weight: '600' },
                        bodyFont: { family: 'Inter' },
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${ctx.parsed}%`
                        }
                    }
                }
            }
        });
    },

    bar(canvasId, labels, data, label, color) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        this._instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: label || '',
                    data,
                    backgroundColor: (color || '#6366f1') + '99',
                    borderColor: color || '#6366f1',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 40,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e2a3e',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 10,
                        titleFont: { family: 'Inter', weight: '600' },
                        bodyFont: { family: 'Inter' },
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.04)' },
                    },
                    y: {
                        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
                        grid: { display: false },
                    }
                }
            }
        });
    },

    radar(canvasId, labels, datasets) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        this._instances[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels,
                datasets: datasets.map((ds, i) => ({
                    label: ds.label,
                    data: ds.data,
                    borderColor: CHART_COLORS[i % CHART_COLORS.length],
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '22',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 11, weight: '500' },
                            usePointStyle: true,
                        }
                    },
                },
                scales: {
                    r: {
                        ticks: { color: '#64748b', backdropColor: 'transparent', font: { size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        angleLines: { color: 'rgba(255,255,255,0.06)' },
                        pointLabels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
                        suggestedMin: 0,
                        suggestedMax: 1,
                    }
                }
            }
        });
    },

    verticalBar(canvasId, labels, datasets) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        this._instances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: datasets.map((ds, i) => ({
                    label: ds.label,
                    data: ds.data,
                    backgroundColor: (CHART_COLORS[i % CHART_COLORS.length]) + '99',
                    borderColor: CHART_COLORS[i % CHART_COLORS.length],
                    borderWidth: 1,
                    borderRadius: 4,
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 11, weight: '500' },
                            usePointStyle: true,
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e2a3e',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 10,
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 }, maxRotation: 45 },
                        grid: { display: false },
                    },
                    y: {
                        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.04)' },
                    }
                }
            }
        });
    },
};
