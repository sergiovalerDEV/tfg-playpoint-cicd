import { Test, TestingModule } from '@nestjs/testing';
import { AnuncioService } from './anuncio.service';

describe('AnuncioService', () => {
  let service: AnuncioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnuncioService],
    }).compile();

    service = module.get<AnuncioService>(AnuncioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
