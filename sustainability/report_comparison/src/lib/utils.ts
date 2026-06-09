import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatEmissions(tCO2eThousands: number): string {
  if (tCO2eThousands >= 1_000) {
    return `${(tCO2eThousands / 1_000).toFixed(1)}M tCO₂e`;
  }
  return `${formatNumber(tCO2eThousands)}k tCO₂e`;
}

export function getBestValue(
  values: (number | null)[],
  lowerIsBetter = true
): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return lowerIsBetter ? Math.min(...valid) : Math.max(...valid);
}
