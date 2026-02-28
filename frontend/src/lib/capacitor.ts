// ─── Capacitor Native Plugin Initialization ─────────────────────────────────
//
// This module initializes Capacitor plugins for Android & iOS.
// On web, these calls are safely no-ops.

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import toast from 'react-hot-toast';

/**
 * Returns true if the app is running as a native mobile app (Android/iOS).
 */
export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

/**
 * Returns the current platform: 'android' | 'ios' | 'web'
 */
export const getPlatform = (): string => Capacitor.getPlatform();

/**
 * Initialize all Capacitor plugins.
 * Call this once in your app entry point (main.tsx).
 */
export async function initCapacitor(): Promise<void> {
  if (!isNativePlatform()) return;

  // ── Status Bar ──
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#0f172a' });
    }
  } catch (e) {
    console.warn('StatusBar init failed:', e);
  }

  // ── Keyboard ──
  try {
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
    });
  } catch (e) {
    console.warn('Keyboard listener init failed:', e);
  }

  // ── Network monitoring ──
  try {
    Network.addListener('networkStatusChange', (status) => {
      if (!status.connected) {
        toast.error('You are offline. Some features may not work.', { duration: 5000 });
      } else {
        toast.success('Back online!', { duration: 2000 });
      }
    });
  } catch (e) {
    console.warn('Network listener init failed:', e);
  }

  // ── App lifecycle (back button on Android) ──
  try {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (e) {
    console.warn('App back button listener init failed:', e);
  }

  // ── Hide splash screen after app has loaded ──
  try {
    await SplashScreen.hide();
  } catch (e) {
    console.warn('SplashScreen hide failed:', e);
  }
}
