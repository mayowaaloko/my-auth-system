import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: Pick<HealthService, 'checkDatabase'>;

  beforeEach(async () => {
    healthService = {
      checkDatabase: jest.fn().mockResolvedValue({ status: 'up' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return liveness metadata', () => {
    expect(controller.live()).toEqual({
      status: 'ok',
      uptime: expect.any(Number),
      timestamp: expect.any(String),
    });
  });

  it('should return ready when database is up', async () => {
    await expect(controller.ready()).resolves.toEqual({
      status: 'ok',
      checks: { database: 'up' },
      timestamp: expect.any(String),
    });
  });
});
