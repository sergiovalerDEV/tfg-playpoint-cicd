import { Test, TestingModule } from '@nestjs/testing';
import { MailmanagerController } from './mailmanager.controller';
import { MailmanagerService } from './mailmanager.service';

describe('MailmanagerController', () => {
  let controller: MailmanagerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailmanagerController],
      providers: [MailmanagerService],
    }).compile();

    controller = module.get<MailmanagerController>(MailmanagerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
