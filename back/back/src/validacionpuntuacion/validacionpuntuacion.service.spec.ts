import { Test, TestingModule } from '@nestjs/testing';
import { ValidacionpuntuacionService } from './validacionpuntuacion.service';

describe('ValidacionpuntuacionService', () => {
  let service: ValidacionpuntuacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidacionpuntuacionService],
    }).compile();

    service = module.get<ValidacionpuntuacionService>(ValidacionpuntuacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
