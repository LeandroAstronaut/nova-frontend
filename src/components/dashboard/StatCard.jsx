import React from 'react';
import { useNavigate } from 'react-router-dom';

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
            className={`card rounded-xl p-5 transition-all duration-200 ${
                route ? 'cursor-pointer hover:border-primary-300 hover:shadow-sm' : ''
            }`}
        >
            <div className="flex items-start justify-between mb-3">
                {Icon && (
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                        <Icon size={18} strokeWidth={1.5} />
                    </div>
                )}
                {trend && (
                    <span className={`text-xs font-medium ${trend.isPositive ? 'text-primary-600' : 'text-[var(--text-muted)]'}`}>
                        {trend.isPositive ? '+' : ''}{trend.value}%
                    </span>
                )}
            </div>
            
            <div className="space-y-0.5">
                <h3 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">{value}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{title}</p>
                {subtitle && (
                    <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
                )}
            </div>
        </div>
    );
};

export default StatCard;
