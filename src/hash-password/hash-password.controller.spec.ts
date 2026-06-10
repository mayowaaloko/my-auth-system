import { Test, TestingModule } from '@nestjs/testing';
import { HashPasswordController } from './hash-password.controller';

describe('HashPasswordController', () => {
  let controller: HashPasswordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HashPasswordController],
    }).compile();

    controller = module.get<HashPasswordController>(HashPasswordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
