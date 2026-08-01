import { Injectable, signal } from '@angular/core';

export interface LogEntry { level: 'info' | 'warn' | 'error'; msg: string; time: string; }

@Injectable({ providedIn: 'root' })
export class LogService {
  logs = signal<LogEntry[]>([]);

  private add(level: LogEntry['level'], ...args: any[]) {
    const msg = args.map(a => {
      if (a instanceof Error) return `${a.message}\n${a.stack}`;
      if (typeof a === 'object') { try { return JSON.stringify(a); } catch { return String(a); } }
      return String(a);
    }).join(' ');
    const time = new Date().toLocaleTimeString();
    this.logs.update(l => [...l.slice(-49), { level, msg, time }]);
    // Also forward to real console
    console[level](msg);
  }

  info(...args: any[]) { this.add('info', ...args); }
  warn(...args: any[]) { this.add('warn', ...args); }
  error(...args: any[]) { this.add('error', ...args); }
  clear() { this.logs.set([]); }
}
