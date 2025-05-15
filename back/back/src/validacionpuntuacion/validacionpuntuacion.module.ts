import { Module } from '@nestjs/common';
import { ValidacionpuntuacionService } from './validacionpuntuacion.service';
import { ValidacionpuntuacionController } from './validacionpuntuacion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Validacionpuntuacion } from './entities/validacionpuntuacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Validacionpuntuacion])],
  controllers: [ValidacionpuntuacionController],
  providers: [ValidacionpuntuacionService],
})
export class ValidacionpuntuacionModule {}
