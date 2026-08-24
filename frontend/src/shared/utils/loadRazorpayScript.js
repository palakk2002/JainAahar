/**
 * loadRazorpayScript.js
 *
 * Dynamically loads the official Razorpay Checkout SDK script (https://checkout.razorpay.com/v1/checkout.js).
 * Returns a Promise resolving to `true` if loaded successfully or `false` on failure.
 */

let razorpayLoadingPromise = null;

const getWindowRazorpay = () => {
  if (typeof window === "undefined") return undefined;
  return /** @type {any} */ (window).Razorpay || /** @type {any} */ (window)["Razorpay"];
};

export const loadRazorpayScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (getWindowRazorpay()) {
    return Promise.resolve(true);
  }

  if (razorpayLoadingPromise) {
    return razorpayLoadingPromise;
  }

  razorpayLoadingPromise = new Promise((resolve) => {
    // Check if script is already present in DOM
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    let timeoutId = null;

    const cleanupAndResolve = (success) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (!success) {
        razorpayLoadingPromise = null;
      }
      resolve(success);
    };

    // Safety timeout: 10 seconds
    timeoutId = setTimeout(() => {
      if (getWindowRazorpay()) {
        cleanupAndResolve(true);
      } else {
        console.warn("[loadRazorpayScript] Razorpay SDK loading timed out");
        cleanupAndResolve(false);
      }
    }, 10000);

    if (existingScript) {
      if (getWindowRazorpay()) {
        cleanupAndResolve(true);
        return;
      }
      // If script is in DOM but window.Razorpay isn't ready yet, poll briefly
      let pollCount = 0;
      const pollInterval = setInterval(() => {
        pollCount += 1;
        if (getWindowRazorpay()) {
          clearInterval(pollInterval);
          cleanupAndResolve(true);
        } else if (pollCount > 50) {
          clearInterval(pollInterval);
          cleanupAndResolve(false);
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (getWindowRazorpay()) {
        cleanupAndResolve(true);
      } else {
        // Razorpay may take a microtask tick to attach to window
        setTimeout(() => {
          cleanupAndResolve(Boolean(getWindowRazorpay()));
        }, 50);
      }
    };
    script.onerror = () => {
      console.error("[loadRazorpayScript] Failed to load Razorpay SDK from checkout.razorpay.com");
      try {
        if (script.parentNode) script.parentNode.removeChild(script);
      } catch {}
      cleanupAndResolve(false);
    };

    document.body.appendChild(script);
  });


  return razorpayLoadingPromise;
};

export default loadRazorpayScript;

