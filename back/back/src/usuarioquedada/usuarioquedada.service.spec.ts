import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioquedadaService } from './usuarioquedada.service';

describe('UsuarioquedadaService', () => {
  let service: UsuarioquedadaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuarioquedadaService],
    }).compile();

    service = module.get<UsuarioquedadaService>(UsuarioquedadaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
