import { Logger } from '@nestjs/common';
export class ConsoleMailTransport {
  private readonly logger = new Logger(ConsoleMailTransport.name);

  send(to: string, subject: string, body: Record<string, unknown>): void {
    this.logger.log(
      `[EMAIL] to=${to} subject="${subject}" body=${JSON.stringify(body)}`,
    );
  }
}
