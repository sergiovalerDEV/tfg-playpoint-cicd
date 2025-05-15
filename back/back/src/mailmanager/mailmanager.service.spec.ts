import { Test, TestingModule } from '@nestjs/testing';
import { MailmanagerService } from './mailmanager.service';

describe('MailmanagerService', () => {
  let service: MailmanagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailmanagerService],
    }).compile();

    service = module.get<MailmanagerService>(MailmanagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
