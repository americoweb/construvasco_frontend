import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private logLevel: LogLevel = LogLevel.DEBUG;

  constructor(private configService: ConfigService) {
    this.logLevel = this.configService.isProduction() ? LogLevel.WARN : LogLevel.DEBUG;
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`, error, ...args);
      
      // In production, send to external service (Sentry, etc.)
      if (this.configService.isProduction()) {
        this.sendToExternalService(message, error);
      }
    }
  }

  private sendToExternalService(message: string, error?: any): void {
    // TODO: Implement external error reporting (Sentry, LogRocket, etc.)
    // For now, just keep in console
    console.error('External logging:', { message, error });
  }
}
