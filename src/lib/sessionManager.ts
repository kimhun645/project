import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  checkIntervalSeconds: number;
  useSessionStorage: boolean;
}

export class SessionManager {
  private config: SessionConfig;
  private lastActivity: number = Date.now();
  private warningShown: boolean = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private warningId: NodeJS.Timeout | null = null;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private onWarning?: () => void;
  private onLogout?: () => void;

  constructor(config: SessionConfig) {
    this.config = config;
    this.setupEventListeners();
    this.startSessionCheck();
  }

  private setupEventListeners() {
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, true);
    });

    // Handle visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseSession();
      } else {
        this.resumeSession();
      }
    });

    // Handle beforeunload (browser close)
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  private updateActivity() {
    this.lastActivity = Date.now();
    this.warningShown = false;
    this.resetTimers();
  }

  private startSessionCheck() {
    this.checkIntervalId = setInterval(() => {
      this.checkSession();
    }, this.config.checkIntervalSeconds * 1000);
  }

  private checkSession() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const minutesSinceActivity = timeSinceActivity / (1000 * 60);

    // Show warning
    if (minutesSinceActivity >= this.config.warningMinutes && !this.warningShown) {
      this.showWarning();
    }

    // Auto logout
    if (minutesSinceActivity >= this.config.timeoutMinutes) {
      this.forceLogout();
    }
  }

  private showWarning() {
    this.warningShown = true;
    if (this.onWarning) {
      this.onWarning();
    }
  }

  private async forceLogout() {
    try {
      await signOut(auth);
      if (this.onLogout) {
        this.onLogout();
      }
      // Redirect to home page
      window.location.href = 'https://stock-6e930.web.app/';
    } catch (error) {
      console.error('Error during forced logout:', error);
    }
  }

  private resetTimers() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
    }
  }

  private pauseSession() {
    // Pause session checking when tab is not visible
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
  }

  private resumeSession() {
    // Resume session checking when tab becomes visible
    this.startSessionCheck();
  }

  public setCallbacks(onWarning?: () => void, onLogout?: () => void) {
    this.onWarning = onWarning;
    this.onLogout = onLogout;
  }

  public extendSession() {
    this.updateActivity();
  }

  public getTimeUntilTimeout(): number {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeUntilTimeout = (this.config.timeoutMinutes * 60 * 1000) - timeSinceActivity;
    return Math.max(0, timeUntilTimeout);
  }

  public getTimeUntilWarning(): number {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeUntilWarning = (this.config.warningMinutes * 60 * 1000) - timeSinceActivity;
    return Math.max(0, timeUntilWarning);
  }

  public cleanup() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningId) {
      clearTimeout(this.warningId);
    }
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
  }
}

// Default configuration
export const defaultSessionConfig: SessionConfig = {
  timeoutMinutes: 30,        // 30 minutes timeout
  warningMinutes: 25,        // Show warning at 25 minutes
  checkIntervalSeconds: 30,  // Check every 30 seconds
  useSessionStorage: true    // Use sessionStorage instead of localStorage
};

// Create global session manager instance
export const sessionManager = new SessionManager(defaultSessionConfig);
