import { Test, TestingModule } from '@nestjs/testing';
import { DeporteService } from './deporte.service';

describe('DeporteService', () => {
  let service: DeporteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeporteService],
    }).compile();

    service = module.get<DeporteService>(DeporteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
