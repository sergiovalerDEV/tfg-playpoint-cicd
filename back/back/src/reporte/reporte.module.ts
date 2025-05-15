import { Module } from '@nestjs/common';
import { ReporteService } from './reporte.service';
import { ReporteController } from './reporte.controller';
import { Reporte } from './entities/reporte.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([Reporte])],
  controllers: [ReporteController],
  providers: [ReporteService],
})
export class ReporteModule {}
