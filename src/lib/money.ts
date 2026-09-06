export function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function sumItems(
  items: { unitCents: number; quantity: number; status?: string }[],
) {
  return items
    .filter((i) => i.status !== "void")
    .reduce((sum, i) => sum + i.unitCents * i.quantity, 0);
}
