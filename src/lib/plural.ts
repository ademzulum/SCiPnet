// A count with its noun in the right number: "1 Person", "3 Personen".
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
