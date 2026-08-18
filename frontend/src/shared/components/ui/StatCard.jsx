/* eslint-disable no-unused-vars */
import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * @typedef {Object} StatCardProps
 * @property {React.ReactNode} [label]
 * @property {React.ReactNode} [value]
 * @property {any} [icon]
 * @property {React.ReactNode} [trend]
 * @property {string} [trendDirection]
 * @property {React.ReactNode} [description]
 * @property {string} [color]
 * @property {string} [bg]
 * @property {React.MouseEventHandler<HTMLDivElement>} [onClick]
 * @property {string} [className]
 */

/**
 * @param {StatCardProps} props
 */
const StatCard = ({ 
    label = "", 
    value = "", 
    icon: Icon = null, 
    trend = null, 
    trendDirection = 'up',
    description = null,
    color = 'text-brand-600',
    bg = 'bg-brand-50',
    onClick = null,
    className = "" 
} = {}) => {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "ds-stat-card group",
                onClick && "cursor-pointer",
                className
            )}
        >
            <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                    <div className={cn("ds-stat-card-icon", bg)}>
                        {Icon && <Icon className={cn("ds-icon-lg", color)} strokeWidth={2.5} />}
                    </div>
                    {trend && (
                        <div className={cn(
                            "ds-stat-card-trend",
                            trendDirection === 'up' ? 'text-brand-600 bg-brand-50' : 'text-red-600 bg-red-50'
                        )}>
                            {trendDirection === 'up' ? (
                                <TrendingUp className="ds-icon-sm mr-0.5" />
                            ) : (
                                <TrendingDown className="ds-icon-sm mr-0.5" />
                            )}
                            {trend}
                        </div>
                    )}
                </div>
                <div>
                    <p className="ds-caption mb-1.5">{label}</p>
                    <p className="ds-stat-large">{value}</p>
                    {description && <p className="ds-description mt-1">{description}</p>}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
