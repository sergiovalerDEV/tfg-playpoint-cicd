import { Test, TestingModule } from '@nestjs/testing';
import { UsuariogrupoController } from './usuariogrupo.controller';
import { UsuariogrupoService } from './usuariogrupo.service';

describe('UsuariogrupoController', () => {
  let controller: UsuariogrupoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariogrupoController],
      providers: [UsuariogrupoService],
    }).compile();

    controller = module.get<UsuariogrupoController>(UsuariogrupoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
