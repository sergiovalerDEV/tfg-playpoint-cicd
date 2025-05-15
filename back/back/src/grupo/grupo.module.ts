import { Module } from '@nestjs/common';
import { GrupoService } from './grupo.service';
import { GrupoController } from './grupo.controller';
import { Grupo } from './entities/grupo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariogrupoModule } from 'src/usuariogrupo/usuariogrupo.module';
import { GrupoGateway } from './grupo.gateway';

@Module({
  imports:[TypeOrmModule.forFeature([Grupo]), UsuariogrupoModule],
  controllers: [GrupoController],
  providers: [GrupoService, GrupoGateway],
  exports: [GrupoService]
})
export class GrupoModule {}
