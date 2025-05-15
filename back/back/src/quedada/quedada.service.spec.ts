import { Test, TestingModule } from '@nestjs/testing';
import { QuedadaService } from './quedada.service';

describe('QuedadaService', () => {
  let service: QuedadaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuedadaService],
    }).compile();

    service = module.get<QuedadaService>(QuedadaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
