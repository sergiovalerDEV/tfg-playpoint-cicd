import { Module } from '@nestjs/common';
import { DeporteService } from './deporte.service';
import { DeporteController } from './deporte.controller';
import { Deporte } from './entities/deporte.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([Deporte])],
  controllers: [DeporteController],
  providers: [DeporteService],
})
export class DeporteModule {}
