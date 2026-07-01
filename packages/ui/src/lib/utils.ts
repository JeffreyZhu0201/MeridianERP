/**
 * 合并 Tailwind CSS 类名的工具函数
 *
 * 使用 clsx 进行条件类名拼接，使用 tailwind-merge 合并重复的 Tailwind 原子类。
 * 这是 @meridian/ui 包中最常用的工具函数，所有需要组合类名的地方都应使用此函数。
 *
 * @param inputs - 可变数量的类名输入，支持字符串、对象、数组等 clsx 支持的格式
 * @returns 合并后的唯一 Tailwind 类名字符串
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', { 'bg-red-500': isError }, ['text-sm', isLarge && 'text-lg'])
 * // => 'px-2 py-1 bg-red-500 text-sm text-lg'
 * ```
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
