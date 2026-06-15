import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @SkipThrottle()
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if the API process is running',
    description:
      'Lightweight liveness check. It does not verify external dependencies.',
  })
  @ApiOkResponse({
    description: 'The API process is running.',
    schema: {
      example: {
        status: 'ok',
        uptime: 123.45,
        timestamp: '2026-06-12T18:00:00.000Z',
      },
    },
  })
  live() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @SkipThrottle()
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if the API is ready to receive traffic',
    description:
      'Readiness check that verifies required dependencies such as the database.',
  })
  @ApiOkResponse({
    description: 'The API and required dependencies are healthy.',
    schema: {
      example: {
        status: 'ok',
        checks: {
          database: 'up',
        },
        timestamp: '2026-06-12T18:00:00.000Z',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'The API is running but one or more dependencies are down.',
    schema: {
      example: {
        statusCode: 503,
        message: {
          status: 'error',
          checks: {
            database: 'down',
          },
          timestamp: '2026-06-12T18:00:00.000Z',
        },
        error: 'Service Unavailable',
      },
    },
  })
  async ready() {
    const db = await this.healthService.checkDatabase();

    if (db.status === 'down') {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: { database: 'down' },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      checks: { database: 'up' },
      timestamp: new Date().toISOString(),
    };
  }
}
