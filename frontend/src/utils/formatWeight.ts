export function formatWeight(grams: number | undefined | null): string {
    const g = Number(grams) || 0;
    if (g <= 0) return "";
    if (g >= 1000) {
        const kg = g / 1000;
        return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(2)} kg`;
    }
    return `${g} g`;
}