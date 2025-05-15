import { Module } from '@nestjs/common';
import { UsuariogrupoService } from './usuariogrupo.service';
import { UsuariogrupoController } from './usuariogrupo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuariogrupo } from './entities/usuariogrupo.entity';
import { GrupoGateway } from 'src/grupo/grupo.gateway';
import { Grupo } from 'src/grupo/entities/grupo.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Usuariogrupo]), TypeOrmModule.forFeature([Grupo])],
  controllers: [UsuariogrupoController],
  providers: [UsuariogrupoService, GrupoGateway],
  exports: [UsuariogrupoService]
})
export class UsuariogrupoModule {}
