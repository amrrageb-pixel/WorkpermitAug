import { SandboxRole, Language } from '../types';

export interface PushNotificationPayload {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  targetRole?: SandboxRole;
  targetEmpCode?: string;
  permitId?: string;
  actionRequired?: boolean;
}

export interface PushSubscriber {
  empCode: string;
  username: string;
  roleEn: string;
  roleAr: string;
  deviceToken: string;
  subscribedAt: string;
  enabled: boolean;
}

// Custom event key for real-time notification dispatch
const PUSH_EVENT_NAME = 'ehs_device_push_notification';

// Simple pub-sub listener list
type PushListener = (payload: PushNotificationPayload) => void;
const listeners: Set<PushListener> = new Set();

export const PushNotificationService = {
  /**
   * Check if native browser Notifications are supported in the current environment.
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  /**
   * Get current native browser notification permission.
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  /**
   * Request native browser notification permission.
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      // In some older environments, requestPermission uses a callback instead of a promise
      return new Promise((resolve) => {
        try {
          Notification.requestPermission((p) => resolve(p));
        } catch {
          resolve('denied');
        }
      });
    }
  },

  /**
   * Play a clean, synthetic, electronic double-beep notify sound using the Web Audio API.
   * This operates without external asset files and guarantees immediate playback on browsers.
   */
  playNotificationSound() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      
      const playBeep = (delay: number, frequency: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + delay + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + duration);
      };
      
      // Dual high-frequency chime (D6 -> F#6) for a professional workspace notice
      playBeep(0, 1174.66, 0.12); 
      playBeep(0.1, 1479.98, 0.18);
    } catch (e) {
      console.warn('Notification sound blocked or unsupported:', e);
    }
  },

  /**
   * Get all active subscribers from local storage.
   */
  getSubscribers(): PushSubscriber[] {
    const stored = localStorage.getItem('ehs_push_subscribers_v3');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  /**
   * Subscribe a user profile to the push notification service.
   */
  subscribeUser(empCode: string, username: string, roleEn: string, roleAr: string): PushSubscriber {
    const subs = this.getSubscribers();
    const existing = subs.find(s => s.empCode === empCode);
    
    if (existing) {
      existing.enabled = true;
      existing.subscribedAt = new Date().toISOString();
      localStorage.setItem('ehs_push_subscribers_v3', JSON.stringify(subs));
      return existing;
    }
    
    const newSub: PushSubscriber = {
      empCode,
      username,
      roleEn,
      roleAr,
      deviceToken: 'DEV_TOKEN_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      subscribedAt: new Date().toISOString(),
      enabled: true
    };
    
    subs.push(newSub);
    localStorage.setItem('ehs_push_subscribers_v3', JSON.stringify(subs));
    return newSub;
  },

  /**
   * Unsubscribe a user profile from push notifications.
   */
  unsubscribeUser(empCode: string) {
    const subs = this.getSubscribers();
    const updated = subs.map(s => s.empCode === empCode ? { ...s, enabled: false } : s);
    localStorage.setItem('ehs_push_subscribers_v3', JSON.stringify(updated));
  },

  /**
   * Check if a specific employee is subscribed.
   */
  isUserSubscribed(empCode: string): boolean {
    const subs = this.getSubscribers();
    const found = subs.find(s => s.empCode === empCode);
    return found ? found.enabled : false;
  },

  /**
   * Get historical notification logs.
   */
  getLogs(): PushNotificationPayload[] {
    const stored = localStorage.getItem('ehs_push_logs_v3');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  /**
   * Clear push history logs.
   */
  clearLogs() {
    localStorage.setItem('ehs_push_logs_v3', JSON.stringify([]));
  },

  /**
   * Dispatch a push notification immediately.
   */
  sendNotification(
    title: string, 
    body: string, 
    options: { 
      targetRole?: SandboxRole; 
      targetEmpCode?: string;
      permitId?: string; 
      actionRequired?: boolean;
    } = {}
  ): PushNotificationPayload {
    const payload: PushNotificationPayload = {
      id: 'PUSH-' + Date.now().toString().slice(-6),
      title,
      body,
      timestamp: new Date().toISOString(),
      ...options
    };

    // 1. Save to local log history
    const logs = this.getLogs();
    logs.unshift(payload);
    localStorage.setItem('ehs_push_logs_v3', JSON.stringify(logs.slice(0, 100))); // Keep last 100

    // 2. Play Audio Feedback
    this.playNotificationSound();

    // 3. Trigger HTML5 Native Notification if browser permission is GRANTED
    if (this.getPermissionStatus() === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: '/favicon.ico', // fallback
          tag: payload.id,
          requireInteraction: false
        });
      } catch (e) {
        console.warn('Native notification failed, falling back to simulated UI notification:', e);
      }
    }

    // 4. Notify all active React in-app subscribers via our Pub/Sub channel
    listeners.forEach(callback => callback(payload));

    return payload;
  },

  /**
   * Subscribe to real-time notification events inside React components.
   */
  onNotificationReceived(callback: PushListener) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }
};
