import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Calendar, ArrowUpRight, TrendingUp } from 'lucide-react';
import { getChartData } from '../../services/dashboardService';

const SalesChart = ({ title = "Ventas", isLoading: parentLoading = false, onViewDetails, showPricesWithTax = false, taxRate = 21 }) => {
    const [period, setPeriod] = useState('6months');
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const primaryColor = '#3b82f6';
    const gridColor = 'var(--border-color)';
    const textColor = 'var(--text-muted)';

    const periods = [
        { value: '30days', label: '30 días' },
        { value: '3months', label: '3 meses' },
        { value: '6months', label: '6 meses' },
        { value: '1year', label: '1 año' },
    ];

    useEffect(() => {
        loadChartData();
    }, [period]);

    const loadChartData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getChartData(period);
            if (response.success) {
                setChartData(response.data);
            }
        } catch (err) {
            console.error('Error loading chart data:', err);
            setError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const total = chartData?.values?.reduce((sum, val) => sum + val, 0) || 0;
    const average = chartData?.values?.length 
        ? Math.round(total / chartData.values.length) 
        : 0;
    const lastValue = chartData?.values?.[chartData.values.length - 1] || 0;
    const prevValue = chartData?.values?.[chartData.values.length - 2] || 0;
    const growth = prevValue > 0 ? ((lastValue - prevValue) / prevValue * 100).toFixed(1) : 0;

    const series = [{
        name: 'Ventas',
        data: chartData?.values || [],
    }];

    const options = {
        chart: {
            type: 'area',
            height: 260,
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 600,
            },
        },
        colors: [primaryColor],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.25,
                opacityTo: 0.05,
                stops: [0, 100],
            },
        },
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 2.5,
        },
        xaxis: {
            categories: chartData?.labels || [],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: {
                    colors: textColor,
                    fontSize: '11px',
                },
            },
        },
        yaxis: {
            labels: {
                formatter: (value) => {
                    if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                    if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
                    return '$' + value;
                },
                style: {
                    colors: textColor,
                    fontSize: '11px',
                },
            },
        },
        grid: {
            borderColor: gridColor,
            strokeDashArray: 3,
            yaxis: { lines: { show: true } },
            padding: { top: 0, right: 0, bottom: 0, left: 10 },
        },
        tooltip: {
            theme: 'light',
            shared: true,
            intersect: false,
            y: {
                formatter: (val) => '$' + val.toLocaleString('es-AR'),
            },
            custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                const value = series[seriesIndex][dataPointIndex];
                const label = w.globals.labels[dataPointIndex];
                return `
                    <div style="padding: 10px 12px; border-radius: 8px; background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px; text-transform: capitalize;">${label}</div>
                        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary);">
                            $${value.toLocaleString('es-AR')}
                        </div>
                    </div>
                `;
            },
        },
        markers: {
            size: 0,
            hover: { size: 5 },
        },
    };

    const isLoadingState = loading || parentLoading;

    if (isLoadingState) {
        return (
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)] h-[380px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100"></div>
                    <div className="text-[var(--text-muted)] text-xs">Cargando...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)] h-[380px] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[var(--text-muted)] text-sm mb-2">{error}</p>
                    <button 
                        onClick={loadChartData}
                        className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)]">
            <div className="p-6">
                <h3 className="text-[11px] font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <TrendingUp size={14} />
                    {title}
                </h3>
                <div className="h-px bg-secondary-200 dark:bg-secondary-700 mb-4" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <p className="text-[13px] text-[var(--text-secondary)]">Evolución de ventas en el período seleccionado</p>

                    <div className="flex items-center gap-2">
                        {onViewDetails && (
                            <button
                                onClick={onViewDetails}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                            >
                                Ver detalle
                                <ArrowUpRight size={14} />
                            </button>
                        )}
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg pl-9 pr-8 py-1.5 text-[11px] text-[var(--text-secondary)] appearance-none cursor-pointer min-w-[100px] focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                            >
                                {periods.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg width="10" height="6" viewBox="0 0 10 6" className="text-[var(--text-muted)]">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <ReactApexChart
                    options={options}
                    series={series}
                    type="area"
                    height={240}
                />

                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-[var(--border-color)]">
                    <div>
                        <div className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1">
                            Total {showPricesWithTax ? 'c/IVA' : 's/IVA'}
                        </div>
                        <div className="text-base font-bold text-[var(--text-primary)]">${total.toLocaleString('es-AR')}</div>
                    </div>
                    <div className="border-x border-[var(--border-color)] px-4">
                        <div className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1">
                            Promedio {showPricesWithTax ? 'c/IVA' : 's/IVA'}
                        </div>
                        <div className="text-base font-bold text-[var(--text-primary)]">${average.toLocaleString('es-AR')}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-normal text-[var(--text-muted)] uppercase tracking-wider mb-1">Crecimiento</div>
                        <div className={`text-base font-bold ${parseFloat(growth) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                            {parseFloat(growth) >= 0 ? '+' : ''}{growth}%
                        </div>
                    </div>
                </div>
                {showPricesWithTax && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-color)] text-center">
                        <span className="text-[10px] text-success-600 dark:text-success-400">
                            Precios incluyen IVA ({taxRate}%)
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesChart;
