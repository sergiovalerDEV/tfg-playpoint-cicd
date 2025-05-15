import { Test, TestingModule } from '@nestjs/testing';
import { QuedadaController } from './quedada.controller';
import { QuedadaService } from './quedada.service';

describe('QuedadaController', () => {
  let controller: QuedadaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuedadaController],
      providers: [QuedadaService],
    }).compile();

    controller = module.get<QuedadaController>(QuedadaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
