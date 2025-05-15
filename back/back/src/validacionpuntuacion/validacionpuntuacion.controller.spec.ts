import { Test, TestingModule } from '@nestjs/testing';
import { ValidacionpuntuacionController } from './validacionpuntuacion.controller';
import { ValidacionpuntuacionService } from './validacionpuntuacion.service';

describe('ValidacionpuntuacionController', () => {
  let controller: ValidacionpuntuacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValidacionpuntuacionController],
      providers: [ValidacionpuntuacionService],
    }).compile();

    controller = module.get<ValidacionpuntuacionController>(ValidacionpuntuacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
