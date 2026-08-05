export function formatBytesToGB(bytes: number, decimals = 1): string {
  const gb = bytes / 1024 ** 3
  return `${gb.toFixed(decimals)} GB`
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}
