import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioquedadaController } from './usuarioquedada.controller';
import { UsuarioquedadaService } from './usuarioquedada.service';

describe('UsuarioquedadaController', () => {
  let controller: UsuarioquedadaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuarioquedadaController],
      providers: [UsuarioquedadaService],
    }).compile();

    controller = module.get<UsuarioquedadaController>(UsuarioquedadaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
