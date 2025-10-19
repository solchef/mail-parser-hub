export default function safeParse(value) {
    if (value == null) return {};
    if (typeof value === "object") return value;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }
    return {};
}