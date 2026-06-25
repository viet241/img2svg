import type { Locale } from '../types';
import { en, type Messages } from './en';
import { vi } from './vi';

export const messages: Record<Locale, Messages> = { en, vi };
