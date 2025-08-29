import { NextRequest } from 'next/server';

// Cache for system settings to avoid frequent API calls
let settingsCache: any = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get system settings with caching (for client-side and API routes)
 */
export async function getSystemSettings() {
  const now = Date.now();

  // Return cached settings if still valid
  if (settingsCache && now < cacheExpiry) {
    return settingsCache;
  }

  try {
    // Check if we're in Edge Runtime (middleware context)
    const isEdgeRuntime =
      (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) ||
      process.env.NEXT_RUNTIME === 'edge';

    // For server-side (but not Edge Runtime), try to import and use the model
    if (typeof window === 'undefined' && !isEdgeRuntime) {
      try {
        const connectDB = (await import('./mongodb')).default;
        const SystemSettings = (await import('../models/SystemSettings'))
          .default;

        await connectDB();
        const settings = await SystemSettings.getSettings();

        // Update cache
        settingsCache = settings;
        cacheExpiry = now + CACHE_DURATION;

        return settings;
      } catch (modelError) {
        // If model import fails, fall back to API call
        console.warn('Model import failed, falling back to API:', modelError);
      }
    }

    // Fallback to API call for client-side, Edge Runtime, or when model fails
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      'http://localhost:3004';
    const response = await fetch(`${baseUrl}/api/system/status`);
    if (response.ok) {
      const settings = await response.json();

      // Update cache
      settingsCache = settings;
      cacheExpiry = now + CACHE_DURATION;

      return settings;
    }
  } catch (error) {
    console.error('Error fetching system settings:', error);
  }

  // Return default settings if everything fails
  return {
    login_enabled: true,
    maintenance_mode: false,
    maintenance_message: 'System is under maintenance. Please try again later.',
    max_login_attempts: 5,
    session_timeout: 24 * 60 * 60 * 1000, // 24 hours
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_special_chars: false,
    },
    email_settings: {
      smtp_host: '',
      smtp_port: 587,
      smtp_secure: false,
      smtp_user: '',
      smtp_password: '',
      from_email: '',
      from_name: 'Organizational Climate Platform',
    },
  };
}

/**
 * Clear the settings cache
 */
export function clearSystemSettingsCache() {
  settingsCache = null;
  cacheExpiry = 0;
}

/**
 * Check if login is enabled
 */
export async function isLoginEnabled(): Promise<boolean> {
  const settings = await getSystemSettings();
  return settings.login_enabled;
}

/**
 * Check if system is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const settings = await getSystemSettings();
  return settings.maintenance_mode;
}
