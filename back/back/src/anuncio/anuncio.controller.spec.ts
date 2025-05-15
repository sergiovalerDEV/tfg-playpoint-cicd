import { Test, TestingModule } from '@nestjs/testing';
import { AnuncioController } from './anuncio.controller';
import { AnuncioService } from './anuncio.service';

describe('AnuncioController', () => {
  let controller: AnuncioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnuncioController],
      providers: [AnuncioService],
    }).compile();

    controller = module.get<AnuncioController>(AnuncioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
