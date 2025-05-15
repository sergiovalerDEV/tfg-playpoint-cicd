import { Test, TestingModule } from '@nestjs/testing';
import { DeporteController } from './deporte.controller';
import { DeporteService } from './deporte.service';

describe('DeporteController', () => {
  let controller: DeporteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeporteController],
      providers: [DeporteService],
    }).compile();

    controller = module.get<DeporteController>(DeporteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
