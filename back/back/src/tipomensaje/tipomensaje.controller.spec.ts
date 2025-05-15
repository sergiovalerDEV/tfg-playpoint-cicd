import { Test, TestingModule } from '@nestjs/testing';
import { TipomensajeController } from './tipomensaje.controller';
import { TipomensajeService } from './tipomensaje.service';

describe('TipomensajeController', () => {
  let controller: TipomensajeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipomensajeController],
      providers: [TipomensajeService],
    }).compile();

    controller = module.get<TipomensajeController>(TipomensajeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
