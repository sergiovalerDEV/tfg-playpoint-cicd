import { Test, TestingModule } from '@nestjs/testing';
import { UsuariogrupoService } from './usuariogrupo.service';

describe('UsuariogrupoService', () => {
  let service: UsuariogrupoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuariogrupoService],
    }).compile();

    service = module.get<UsuariogrupoService>(UsuariogrupoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
