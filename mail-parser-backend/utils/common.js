/**
 * Normalize any date-like value into YYYY-MM-DD for MySQL.
 * Supports formats like:
 *   10/1/2025, 1-10-25, 2025-10-01, 01.10.2025, 10.01.25
 */
export function normalizeDateValue(value) {
    if (!value || typeof value !== "string") return value.trim?.() || value;

    // Clean stray whitespace or invisible chars
    value = value.trim().replace(/\uFEFF/g, "");

    // Common delimiters
    const delimiters = /[\/\-.]/;

    // Split based on delimiter
    const parts = value.split(delimiters);

    // If it's already in ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    // Handle DD/MM/YYYY or MM/DD/YYYY
    if (parts.length === 3) {
        let [a, b, c] = parts.map(x => x.padStart(2, "0"));

        // Normalize year
        if (c.length === 2) c = "20" + c;

        // Decide if format is MM/DD/YYYY or DD/MM/YYYY
        // If a > 12, assume DD/MM/YYYY
        let year, month, day;
        if (parseInt(a) > 12) {
            day = a; month = b; year = c;
        } else {
            month = a; day = b; year = c;
        }

        // Final sanity check
        const iso = `${year}-${month}-${day}`;
        const d = new Date(iso);
        if (!isNaN(d.getTime())) return iso;
    }

    // Try native JS Date parsing
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
    }

    // If nothing works, return original (don’t break import)
    return value;
}
