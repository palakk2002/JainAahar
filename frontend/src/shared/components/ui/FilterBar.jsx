import React from 'react';
import { cn } from '@/lib/utils';

/**
 * @typedef {Object} FilterBarProps
 * @property {React.ReactNode} [left]
 * @property {React.ReactNode} [right]
 * @property {string} [className]
 * @property {React.ReactNode} [children]
 */

/**
 * @param {FilterBarProps} props
 */
const FilterBar = ({ left = null, right = null, className = "", children = null } = {}) => {
    if (children) {
        return (
            <div
                className={cn(
                    'flex flex-wrap items-center gap-3 pb-4',
                    className,
                )}
            >
                {children}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-3 pb-4',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-2">{left}</div>
            {right ? (
                <div className="flex flex-wrap items-center gap-2">{right}</div>
            ) : null}
        </div>
    );
};

export default FilterBar;
