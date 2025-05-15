import { Test, TestingModule } from '@nestjs/testing';
import { PuntuacionController } from './puntuacion.controller';
import { PuntuacionService } from './puntuacion.service';

describe('PuntuacionController', () => {
  let controller: PuntuacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuntuacionController],
      providers: [PuntuacionService],
    }).compile();

    controller = module.get<PuntuacionController>(PuntuacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
