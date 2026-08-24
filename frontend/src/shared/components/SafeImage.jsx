import React, { useState, useEffect, forwardRef } from 'react';
import { applyCloudinaryTransform, getRealCategoryFallback, DEFAULT_CATEGORY_IMAGE } from '@/core/utils/imageUtils';

/**
 * SafeImage Component
 * Robust image rendering with Cloudinary optimization and real photo fallback handling.
 * @type {React.ForwardRefExoticComponent<React.ImgHTMLAttributes<HTMLImageElement> & { fallbackSrc?: string; transformParams?: string }>}
 */
const SafeImage = React.forwardRef(({
    src,
    fallbackSrc,
    transformParams,
    alt = '',
    className = '',
    onError,
    ...props
}, ref) => {
    const effectiveFallback = fallbackSrc || getRealCategoryFallback(alt) || DEFAULT_CATEGORY_IMAGE;

    const [imgSrc, setImgSrc] = useState(() => {
        if (!src) return effectiveFallback;
        return transformParams ? applyCloudinaryTransform(src, transformParams) : applyCloudinaryTransform(src);
    });
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
        if (!src) {
            setImgSrc(effectiveFallback);
        } else {
            const transformed = transformParams ? applyCloudinaryTransform(src, transformParams) : applyCloudinaryTransform(src);
            setImgSrc(transformed || effectiveFallback);
        }
    }, [src, effectiveFallback, transformParams]);

    const handleError = (e) => {
        if (!hasError) {
            setHasError(true);
            setImgSrc(effectiveFallback);
        }
        if (typeof onError === 'function') {
            onError(e);
        }
    };

    return (
        <img
            ref={ref}
            src={imgSrc || effectiveFallback}
            alt={alt}
            decoding="async"
            className={className}
            onError={handleError}
            {...props}
        />
    );
});

SafeImage.displayName = 'SafeImage';

export default SafeImage;

