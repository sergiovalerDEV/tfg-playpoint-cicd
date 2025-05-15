import { Module } from '@nestjs/common';
import { UsuarioquedadaService } from './usuarioquedada.service';
import { UsuarioquedadaController } from './usuarioquedada.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuarioquedada } from './entities/usuarioquedada.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Usuarioquedada])],
  controllers: [UsuarioquedadaController],
  providers: [UsuarioquedadaService],
})
export class UsuarioquedadaModule {}
