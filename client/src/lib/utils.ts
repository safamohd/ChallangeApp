import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency in Arabic locale
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ﷼';
}

/**
 * Format a date in Arabic locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Calculate percentage
 */
export function calculatePercentage(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
}

/**
 * Get the appropriate icon class for a category
 */
export function getCategoryIcon(iconName: string): string {
  return `fas fa-${iconName}`;
}

/**
 * Get months in Arabic
 */
export function getArabicMonths(): string[] {
  return [
    'يناير',
    'فبراير',
    'مارس',
    'إبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر'
  ];
}

/**
 * Get the current month name in Arabic
 */
export function getCurrentMonthName(): string {
  const monthIndex = new Date().getMonth();
  return getArabicMonths()[monthIndex];
}

/**
 * Get the current year in Arabic numerals
 */
export function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}
