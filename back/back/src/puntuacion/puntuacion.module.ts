import { Module } from '@nestjs/common';
import { PuntuacionService } from './puntuacion.service';
import { PuntuacionController } from './puntuacion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Puntuacion } from './entities/puntuacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Puntuacion])],
  controllers: [PuntuacionController],
  providers: [PuntuacionService],
})
export class PuntuacionModule {}
