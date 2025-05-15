import { Injectable } from '@nestjs/common';
import { CreateLocalDto } from './dto/create-local.dto';
import { UpdateLocalDto } from './dto/update-local.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Local } from './entities/local.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LocalService {
  constructor(
    @InjectRepository(Local)
    private localRepository: Repository<Local>,
  ) {}

  findAll() {
    return this.localRepository.find();
  }
}
