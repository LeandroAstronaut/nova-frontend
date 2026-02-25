import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend = null, route }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (route) {
            navigate(route);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`card p-0! overflow-hidden border-none shadow-sm ring-1 ring-[var(--border-color)] transition-all duration-200 ${
                route ? 'cursor-pointer hover:ring-primary-300 hover:shadow-md' : ''
            }`}
        >
            <div className="p-4">
                {/* Header con icono y valor en la misma línea */}
                <div className="flex items-center justify-between mb-2">
                    {Icon && (
                        <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Icon size={18} strokeWidth={1.5} />
                        </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                        {/* Valor más compacto */}
                        <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                            {value}
                        </span>
                        
                        {trend && (
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-medium ${
                                trend.isPositive 
                                    ? 'bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400' 
                                    : 'bg-danger-50 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'
                            }`}>
                                {trend.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {trend.isPositive ? '+' : ''}{trend.value}%
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Título y subtítulo */}
                <div className="space-y-0.5">
                    <p className="text-[12px] font-medium text-[var(--text-secondary)]">{title}</p>
                    {subtitle && (
                        <p className="text-[11px] text-[var(--text-muted)]">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
