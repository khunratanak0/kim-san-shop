'use client';

// ---------------------------------------------------------------------------
// Telegram Mini App SDK wrapper
// Only works inside Telegram's in-app browser (webview).
// Falls back gracefully when opened in a regular browser.
// ---------------------------------------------------------------------------

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface TelegramThemeParams {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
  secondary_bg_color: string;
  header_bg_color: string;
  bottom_bar_bg_color: string;
  section_bg_color: string;
  section_header_text_color: string;
  subtitle_text_color: string;
  destructive_text_color: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;

  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    receiver?: TelegramUser;
    start_param?: string;
    auth_date?: string;
    hash?: string;
  };

  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  viewportHeight: number;
  viewportStableHeight: number;

  isExpanded: boolean;
  platform: string;
  version: string;

  // Haptic feedback
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };

  // Main button
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }) => void;
  };

  // Back button
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };

  // Settings button
  SettingsButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };

  // Event bindings
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
  sendData: (data: string) => void;
}

// ---------------------------------------------------------------------------
// Safe accessors (SSR-safe)
// ---------------------------------------------------------------------------

let _webApp: TelegramWebApp | null = null;

export function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;

  if (!_webApp) {
    // Telegram injects this global
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      _webApp = tg;
    }
  }

  return _webApp;
}

/** Returns true when running inside a Telegram Mini App webview. */
export function isTelegramWebApp(): boolean {
  return getWebApp() !== null;
}

/** Returns the authenticated Telegram user, or null outside Telegram. */
export function getTelegramUser(): TelegramUser | null {
  return getWebApp()?.initDataUnsafe?.user ?? null;
}

/** Returns Telegram's current theme params (colors). */
export function getThemeParams(): TelegramThemeParams | null {
  return getWebApp()?.themeParams ?? null;
}

/** Returns Telegram's color scheme preference. */
export function getTelegramColorScheme(): 'light' | 'dark' | null {
  return getWebApp()?.colorScheme ?? null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Tell Telegram the Mini App is ready to display. */
export function telegramReady(): void {
  getWebApp()?.ready();
}

/** Expand the Mini App to full height. */
export function expandApp(): void {
  getWebApp()?.expand();
}

/** Close the Mini App. */
export function closeApp(): void {
  getWebApp()?.close();
}

/** Prevent accidental closing (swipe-down). */
export function enableClosingConfirmation(): void {
  getWebApp()?.enableClosingConfirmation();
}

export function disableClosingConfirmation(): void {
  getWebApp()?.disableClosingConfirmation();
}

// ---------------------------------------------------------------------------
// Haptic feedback
// ---------------------------------------------------------------------------

export function hapticLight(): void {
  getWebApp()?.HapticFeedback?.impactOccurred('light');
}

export function hapticMedium(): void {
  getWebApp()?.HapticFeedback?.impactOccurred('medium');
}

export function hapticHeavy(): void {
  getWebApp()?.HapticFeedback?.impactOccurred('heavy');
}

export function hapticSuccess(): void {
  getWebApp()?.HapticFeedback?.notificationOccurred('success');
}

export function hapticError(): void {
  getWebApp()?.HapticFeedback?.notificationOccurred('error');
}

export function hapticSelection(): void {
  getWebApp()?.HapticFeedback?.selectionChanged();
}

// ---------------------------------------------------------------------------
// Main Button helpers
// ---------------------------------------------------------------------------

export function showMainButton(
  text: string,
  onClick: () => void,
  options?: { color?: string; textColor?: string }
): void {
  const tg = getWebApp();
  if (!tg) return;

  tg.MainButton.setText(text);
  if (options?.color) tg.MainButton.color = options.color;
  if (options?.textColor) tg.MainButton.textColor = options.textColor;
  tg.MainButton.onClick(onClick);
  tg.MainButton.show();
}

export function hideMainButton(): void {
  getWebApp()?.MainButton.hide();
}

// ---------------------------------------------------------------------------
// Back Button helpers
// ---------------------------------------------------------------------------

export function showBackButton(onClick: () => void): void {
  const tg = getWebApp();
  if (!tg) return;

  tg.BackButton.onClick(onClick);
  tg.BackButton.show();
}

export function hideBackButton(): void {
  getWebApp()?.BackButton.hide();
}

// ---------------------------------------------------------------------------
// Event listeners (viewport changes, theme changes, etc.)
// ---------------------------------------------------------------------------

export function onViewportChanged(callback: (height: number) => void): () => void {
  const tg = getWebApp();
  if (!tg) return () => {};

  const handler = () => {
    callback(tg.viewportStableHeight);
  };

  tg.onEvent('viewportChanged', handler);
  return () => tg.offEvent('viewportChanged', handler);
}

export function onThemeChanged(callback: () => void): () => void {
  const tg = getWebApp();
  if (!tg) return () => {};

  tg.onEvent('themeChanged', callback);
  return () => tg.offEvent('themeChanged', callback);
}