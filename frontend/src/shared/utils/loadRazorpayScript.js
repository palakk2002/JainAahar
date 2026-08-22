/**
 * loadRazorpayScript.js
 *
 * Dynamically loads the official Razorpay Checkout SDK script (https://checkout.razorpay.com/v1/checkout.js).
 * Returns a Promise resolving to `true` if loaded successfully or `false` on failure.
 * Caches the script element to avoid duplicate script injections.
 */

let razorpayLoadingPromise = null;

export const loadRazorpayScript = () => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayLoadingPromise) {
    return razorpayLoadingPromise;
  }

  razorpayLoadingPromise = new Promise((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayLoadingPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayLoadingPromise;
};

export default loadRazorpayScript;
