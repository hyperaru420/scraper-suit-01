import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(price)
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  })
}
