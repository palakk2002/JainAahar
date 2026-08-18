import { selectProvider, getProviderFallbackChain, withProviderFallback } from "../../app/modules/delivery/selection/providerSelector.js";
import { getDeliveryProvider } from "../../app/modules/delivery/deliveryProviderRegistry.js";

describe("Provider Selector Unit Tests", () => {
  it("should select preferred provider when explicitly requested", async () => {
    const provider = await selectProvider({ preferredProvider: "mock" });
    expect(provider.name).toBe("mock");
  });

  it("should return fallback chain starting with shiprocket by default", () => {
    const chain = getProviderFallbackChain({ preferredProvider: "auto" });
    expect(chain[0].name).toBe("shiprocket");
    expect(chain.some(p => p.name === "internal")).toBe(true);
  });

  it("should execute operation through fallback chain", async () => {
    const res = await withProviderFallback({ preferredProvider: "mock" }, async (p) => {
      return { status: "OK", providerUsed: p.name };
    });

    expect(res.status).toBe("OK");
    expect(res.providerName).toBe("mock");
  });
});
