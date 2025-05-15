import { Injectable } from '@nestjs/common';
import { CreateDeporteDto } from './dto/create-deporte.dto';
import { UpdateDeporteDto } from './dto/update-deporte.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Deporte } from './entities/deporte.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DeporteService {
  constructor(
    @InjectRepository(Deporte)
    private deporteRepository: Repository<Deporte>,
  ) {}

  findAll() {
    return this.deporteRepository.find();
  }
}
