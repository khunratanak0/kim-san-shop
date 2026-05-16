'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import {
  isTelegramWebApp,
  telegramReady,
  expandApp,
  getThemeParams,
  getTelegramColorScheme,
  onThemeChanged,
  onViewportChanged,
  type TelegramThemeParams,
} from '@/lib/telegram';

// Map Telegram color keys to CSS custom property names
const TELEGRAM_CSS_MAP: Record<keyof TelegramThemeParams, string> = {
  bg_color: '--tg-bg-color',
  text_color: '--tg-text-color',
  hint_color: '--tg-hint-color',
  link_color: '--tg-link-color',
  button_color: '--tg-button-color',
  button_text_color: '--tg-button-text-color',
  secondary_bg_color: '--tg-secondary-bg-color',
  header_bg_color: '--tg-header-bg-color',
  bottom_bar_bg_color: '--tg-bottom-bar-bg-color',
  section_bg_color: '--tg-section-bg-color',
  section_header_text_color: '--tg-section-header-text-color',
  subtitle_text_color: '--tg-subtitle-text-color',
  destructive_text_color: '--tg-destructive-text-color',
};

/**
 * Applies Telegram theme colors as CSS custom properties on <html>.
 * Falls back gracefully when not inside Telegram.
 */
function applyTelegramTheme() {
  const params = getThemeParams();
  if (!params) return;

  const root = document.documentElement;

  for (const [tgKey, cssVar] of Object.entries(TELEGRAM_CSS_MAP)) {
    const color = params[tgKey as keyof TelegramThemeParams];
    if (color) {
      root.style.setProperty(cssVar, color);
    }
  }
}

/**
 * Syncs Telegram's colorScheme with next-themes.
 */
function syncColorScheme(setTheme: (theme: string) => void) {
  const scheme = getTelegramColorScheme();
  if (scheme) {
    setTheme(scheme);
  }
}

export default function TelegramProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isTelegramWebApp()) return;
    if (initialized.current) return;
    initialized.current = true;

    // 1. Apply Telegram colors as CSS variables
    applyTelegramTheme();

    // 2. Sync initial color scheme with next-themes
    syncColorScheme(setTheme);

    // 3. Expand to full height inside Telegram
    expandApp();

    // 4. Tell Telegram the app is ready
    telegramReady();

    // 5. Listen for theme changes (user switches Telegram theme)
    const unsubTheme = onThemeChanged(() => {
      applyTelegramTheme();
      syncColorScheme(setTheme);
    });

    // 6. Listen for viewport changes (keyboard open/close, etc.)
    const unsubViewport = onViewportChanged((height) => {
      // Set a CSS variable so sticky/fixed elements can adjust
      document.documentElement.style.setProperty(
        '--tg-viewport-height',
        `${height}px`
      );
    });

    return () => {
      unsubTheme();
      unsubViewport();
    };
  }, [setTheme]);

  return <>{children}</>;
}