import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuariogrupo } from './entities/usuariogrupo.entity';
import { Repository } from 'typeorm';
import { GrupoGateway } from 'src/grupo/grupo.gateway';
import { Grupo } from 'src/grupo/entities/grupo.entity';

@Injectable()
export class UsuariogrupoService {
  constructor(
    @InjectRepository(Usuariogrupo)
    private usuariogrupoRepository: Repository<Usuariogrupo>,
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
    private grupoGateway: GrupoGateway
  ){}

  async anadir(parametros){
    const usuariogrupo: Usuariogrupo = new Usuariogrupo;
    usuariogrupo.usuario = parametros.usuario;
    usuariogrupo.grupo = parametros.grupo;

    console.log(usuariogrupo)

    const usuariogrupoAfectado = await this.usuariogrupoRepository.insert(usuariogrupo)

    const grupoAfectadoCompleto = await this.grupoRepository
      .createQueryBuilder("g")
      .leftJoinAndSelect("g.usuariogrupo", "ug")
      .leftJoinAndSelect("ug.grupo", "ugg")
      .leftJoinAndSelect("ug.usuario", "u")
      .where("g.id = :id", { id: parametros.grupo })
      .getOne()
      console.log(grupoAfectadoCompleto)
    this.grupoGateway.emitUpdatedGroup(grupoAfectadoCompleto)

    return usuariogrupoAfectado;
  }

  async eliminar(parametros){
    const usuariogrupo = await this.usuariogrupoRepository.find({where: {usuario: {id: parametros.usuario}, grupo: {id: parametros.grupo}}})

    const usuariogrupoAfectado = await this.usuariogrupoRepository.remove(usuariogrupo);

    const grupoAfectadoCompleto = await this.grupoRepository
      .createQueryBuilder("g")
      .leftJoinAndSelect("g.usuariogrupo", "ug")
      .leftJoinAndSelect("ug.grupo", "ugg")
      .leftJoinAndSelect("ug.usuario", "u")
      .where("g.id = :id", { id: parametros.grupo })
      .getOne()
      console.log(grupoAfectadoCompleto)
    this.grupoGateway.emitUpdatedGroup(grupoAfectadoCompleto)

    return usuariogrupoAfectado;
  }
}
