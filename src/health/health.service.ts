import { Injectable } from '@nestjs/common';

import { db } from '../db/db';

export type HealthCheckStatus = 'up' | 'down';

@Injectable()
export class HealthService {
  async checkDatabase(): Promise<{ status: HealthCheckStatus }> {
    try {
      await db.execute('SELECT 1');
      return { status: 'up' };
    } catch (error) {
      return { status: 'down' };
    }
  }
}
