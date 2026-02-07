
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// Log interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: number;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
}

class Logger {
  private appLogStream?: NodeJS.WritableStream;
  private errorLogStream?: NodeJS.WritableStream;
  private accessLogStream?: NodeJS.WritableStream;
  private isServerless: boolean;

  constructor() {
    // Detect Vercel environment
    this.isServerless = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

    if (!this.isServerless) {
      try {
        // Create logs directory if it doesn't exist
        const logsDir = join(process.cwd(), 'logs');
        if (!existsSync(logsDir)) {
          mkdirSync(logsDir, { recursive: true });
        }

        // Create log streams
        this.appLogStream = createWriteStream(join(logsDir, 'app.log'), { flags: 'a' });
        this.errorLogStream = createWriteStream(join(logsDir, 'error.log'), { flags: 'a' });
        this.accessLogStream = createWriteStream(join(logsDir, 'access.log'), { flags: 'a' });
      } catch (error) {
        console.warn("Failed to initialize file logging (likely read-only fs), falling back to console only.");
        this.isServerless = true;
      }
    }
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, data, userId, endpoint, method, statusCode, responseTime } = entry;
    let logString = `[${timestamp}] ${level}: ${message}`;

    if (userId) logString += ` | User: ${userId}`;
    if (method && endpoint) logString += ` | ${method} ${endpoint}`;
    if (statusCode) logString += ` | Status: ${statusCode}`;
    if (responseTime) logString += ` | ${responseTime}ms`;
    if (data) logString += ` | Data: ${JSON.stringify(data)}`;

    return logString + '\n';
  }

  private writeLog(stream: NodeJS.WritableStream | undefined, entry: LogEntry) {
    const logString = this.formatLog(entry);

    if (!this.isServerless && stream) {
      stream.write(logString);
    }

    // Always log to console in serverless or development
    // In Vercel, console logs are captured by the platform
    const colorCode = {
      [LogLevel.ERROR]: '\x1b[31m',
      [LogLevel.WARN]: '\x1b[33m',
      [LogLevel.INFO]: '\x1b[36m',
      [LogLevel.DEBUG]: '\x1b[90m'
    };
    // Use proper console methods for better visibility in Vercel logs
    const consoleMethod = entry.level === LogLevel.ERROR ? console.error :
      entry.level === LogLevel.WARN ? console.warn : console.log;

    consoleMethod(`${colorCode[entry.level]}${logString.trim()}\x1b[0m`);
  }

  info(message: string, data?: any, userId?: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      data,
      userId
    };
    this.writeLog(this.appLogStream, entry);
  }

  error(message: string, error?: Error | any, userId?: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      data: error?.stack || error,
      userId
    };
    this.writeLog(this.errorLogStream, entry);
    this.writeLog(this.appLogStream, entry);
  }

  warn(message: string, data?: any, userId?: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      data,
      userId
    };
    this.writeLog(this.appLogStream, entry);
  }

  debug(message: string, data?: any, userId?: number) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      data,
      userId
    };
    this.writeLog(this.appLogStream, entry);
  }

  // Access logging for HTTP requests
  access(method: string, endpoint: string, statusCode: number, responseTime: number, userId?: number, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: 'HTTP Request',
      method,
      endpoint,
      statusCode,
      responseTime,
      userId,
      data
    };
    this.writeLog(this.accessLogStream, entry);
  }

  // Database operation logging
  database(operation: string, table: string, data?: any, userId?: number) {
    this.info(`Database ${operation} on ${table}`, data, userId);
  }

  // API generation logging
  apiGeneration(projectName: string, framework: string, success: boolean, userId?: number, error?: any) {
    if (success) {
      this.info(`API generated successfully: ${projectName} (${framework})`, { projectName, framework }, userId);
    } else {
      this.error(`API generation failed: ${projectName} (${framework})`, error, userId);
    }
  }

  // AI service logging
  aiRequest(prompt: string, model: string, success: boolean, userId?: number, error?: any) {
    if (success) {
      this.info(`AI request successful: ${model}`, { prompt: prompt.substring(0, 100) + '...' }, userId);
    } else {
      this.error(`AI request failed: ${model}`, error, userId);
    }
  }

  // Payment logging
  payment(action: string, amount?: number, currency?: string, success?: boolean, userId?: number, error?: any) {
    if (success) {
      this.info(`Payment ${action} successful`, { amount, currency }, userId);
    } else {
      this.error(`Payment ${action} failed`, error, userId);
    }
  }

  // Authentication logging
  auth(action: string, username: string, success: boolean, ip?: string, error?: any) {
    if (success) {
      this.info(`Authentication ${action} successful: ${username}`, { ip });
    } else {
      this.warn(`Authentication ${action} failed: ${username}`, { error: error?.message, ip });
    }
  }
}

export const logger = new Logger();