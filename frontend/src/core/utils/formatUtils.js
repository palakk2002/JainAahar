/**
 * Utility functions for formatting product data, weights, currency, etc.
 */

/**
 * Formats a product weight/volume string or number with clean, standard units.
 *
 * Examples:
 *   100        -> "100 gm"
 *   "100"      -> "100 gm"
 *   "250"      -> "250 gm"
 *   "500"      -> "500 gm"
 *   "100g"     -> "100 gm"
 *   "100gm"    -> "100 gm"
 *   "100 gm"   -> "100 gm"
 *   "1kg"      -> "1 kg"
 *   "1 kg"     -> "1 kg"
 *   "500ml"    -> "500 ml"
 *   "1L"       -> "1 L"
 *   "1 unit"   -> "1 unit"
 *   "Monthly Supply" -> "Monthly Supply"
 *   null / ""  -> fallback (defaults to "1 unit")
 *
 * @param {string|number} rawValue
 * @param {string} [fallback="1 unit"]
 * @returns {string}
 */
export function formatWeight(rawValue, fallback = "1 unit") {
  if (rawValue === null || rawValue === undefined) {
    return fallback;
  }

  const str = String(rawValue).trim();
  if (!str) return fallback;

  // If it's a pure number (e.g. 100, 250, 500, "100", "500")
  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    // If it's >= 1000 and a clean multiple of 1000 (e.g. 1000 -> 1 kg, 2000 -> 2 kg)
    if (num >= 1000 && num % 1000 === 0) {
      return `${num / 1000} kg`;
    }
    // Numbers >= 10 are grams -> e.g. 100 -> "100 gm", 250 -> "250 gm", 500 -> "500 gm"
    if (num >= 10) {
      return `${str} gm`;
    }
    // Small integer 1 -> fallback or "1 unit"
    if (num === 1) {
      return fallback || "1 unit";
    }
    return `${str} units`;
  }

  // If it has number + unit like "100g", "100gm", "100gms", "1kg", "1kgs", "500ml", "1l", "1ltr"
  const unitMatch = str.match(
    /^(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|kg|kgs|kilo|kilogram|kilograms|ml|l|lt|ltr|litre|litres|pcs|piece|pieces|pack|packet|packs|packets|unit|units)$/i
  );

  if (unitMatch) {
    const [, amount, unitRaw] = unitMatch;
    const unitLower = unitRaw.toLowerCase();

    if (["g", "gm", "gms", "gram", "grams"].includes(unitLower)) {
      return `${amount} gm`;
    }
    if (["kg", "kgs", "kilo", "kilogram", "kilograms"].includes(unitLower)) {
      return `${amount} kg`;
    }
    if (["ml"].includes(unitLower)) {
      return `${amount} ml`;
    }
    if (["l", "lt", "ltr", "litre", "litres"].includes(unitLower)) {
      return `${amount} L`;
    }
    if (["pcs", "piece", "pieces"].includes(unitLower)) {
      return Number(amount) === 1 ? "1 piece" : `${amount} pcs`;
    }
    if (["pack", "packet", "packs", "packets"].includes(unitLower)) {
      return Number(amount) === 1 ? "1 pack" : `${amount} packs`;
    }
    if (["unit", "units"].includes(unitLower)) {
      return Number(amount) === 1 ? "1 unit" : `${amount} units`;
    }
  }

  // If already descriptive text like "100 gm Pack", "Monthly Supply", "Pack of 2", etc.
  return str;
}
