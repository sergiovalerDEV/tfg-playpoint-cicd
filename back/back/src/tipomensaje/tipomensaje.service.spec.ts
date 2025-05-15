import { Test, TestingModule } from '@nestjs/testing';
import { TipomensajeService } from './tipomensaje.service';

describe('TipomensajeService', () => {
  let service: TipomensajeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipomensajeService],
    }).compile();

    service = module.get<TipomensajeService>(TipomensajeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
