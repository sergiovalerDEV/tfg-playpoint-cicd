import { Test, TestingModule } from '@nestjs/testing';
import { PuntuacionService } from './puntuacion.service';

describe('PuntuacionService', () => {
  let service: PuntuacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PuntuacionService],
    }).compile();

    service = module.get<PuntuacionService>(PuntuacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
