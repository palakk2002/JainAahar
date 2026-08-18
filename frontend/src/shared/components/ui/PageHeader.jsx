import React from 'react';
import { cn } from '@/lib/utils';

/**
 * @typedef {Object} PageHeaderProps
 * @property {string} [title]
 * @property {string} [description]
 * @property {React.ReactNode} [actions]
 * @property {React.ReactNode} [badge]
 * @property {string} [className]
 */

/**
 * @param {PageHeaderProps} props
 */
const PageHeader = ({ title = "", description = "", actions = null, badge = null, className = "" } = {}) => {
    return (
        <div className={cn("ds-page-header", className)}>
            <div className="ds-page-title-group">
                <div className="flex items-center gap-2">
                    <h1 className="ds-h1">{title}</h1>
                    {badge && badge}
                </div>
                {description && <p className="ds-description">{description}</p>}
            </div>
            {actions && <div className="ds-page-actions">{actions}</div>}
        </div>
    );
};

export default PageHeader;
