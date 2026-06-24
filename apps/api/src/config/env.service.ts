import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvService {
  get(key: string, fallback?: string): string | undefined {
    return process.env[key] ?? fallback;
  }

  getOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}
