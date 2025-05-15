import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Grupo } from './entities/grupo.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuariogrupoService } from 'src/usuariogrupo/usuariogrupo.service';
import { GrupoGateway } from './grupo.gateway';
import axios from 'axios';

@Injectable()
export class GrupoService {
  constructor(
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
    private usuariogrupoService: UsuariogrupoService,
    private readonly grupoGateway: GrupoGateway
  ){}

  listarPorUsuario(usuario){
    return this.grupoRepository.createQueryBuilder('g')
    .leftJoinAndSelect('g.usuariogrupo', 'ug')
    .leftJoinAndSelect('ug.usuario', 'u')
    .where('g.id IN (SELECT grupo FROM "USUARIOGRUPO" WHERE usuario = :usuario)', {usuario: usuario})
    .getMany()
  }

  async crear(parametros){
    const grupo: Grupo = new Grupo;
    grupo.nombre = parametros.nombre;
    grupo.descripcion = parametros.descripcion;

    const result = await this.grupoRepository.insert(grupo)
    const grupoId = result.raw[0].id || result.identifiers[0].id;

    for(const usuario of parametros.usuarios){
      await this.usuariogrupoService.anadir({usuario: usuario, grupo: grupoId})
    }

    const grupoCompleto = await this.grupoRepository
      .createQueryBuilder("g")
      .leftJoinAndSelect("g.usuariogrupo", "ug")
      .leftJoinAndSelect("ug.usuario", "u")
      .where("g.id = :id", { id: grupoId })
      .getOne()

    if (grupoCompleto) {
      this.grupoGateway.emitNewGroup(grupoCompleto)
    }

    return grupoCompleto
  }

  async cambiarFoto(parametros, file){
    const bucketName = process.env.AWS_BUCKET_NAME;
    const fileName = `${Date.now()}-${file.originalname}`;
    const fileData = file.buffer;

    const s3Url = `https://${bucketName}.s3.amazonaws.com/uploaded/fotos-usuario/${fileName}`;

    await axios.put(s3Url, fileData, {
        headers: {
            'Content-Type': file.mimetype,
        },
    });

    const grupoCambiado = await this.grupoRepository.update({id: parametros.grupo}, {imagen: s3Url});

    const grupoCambiadoCompleto = await this.grupoRepository
      .createQueryBuilder("g")
      .leftJoinAndSelect("g.usuariogrupo", "ug")
      .leftJoinAndSelect("ug.usuario", "u")
      .where("g.id = :id", { id: parametros.grupo })
      .getOne()

    this.grupoGateway.emitUpdatedGroup(grupoCambiadoCompleto)

    return grupoCambiado;
  }
  async cambiarNombre(parametros){
    const grupoCambiado = await this.grupoRepository.update({id: parametros.grupo}, {nombre: parametros.nombre});

    const grupoCambiadoCompleto = await this.grupoRepository
      .createQueryBuilder("g")
      .leftJoinAndSelect("g.usuariogrupo", "ug")
      .leftJoinAndSelect("ug.usuario", "u")
      .where("g.id = :id", { id: parametros.grupo })
      .getOne()

    this.grupoGateway.emitUpdatedGroup(grupoCambiadoCompleto)

    return grupoCambiado;
  }
  
  async cambiarDescripcion(parametros){
    const grupoCambiado = await this.grupoRepository.update({id: parametros.grupo}, {descripcion: parametros.descripcion});

    const grupoCambiadoCompleto = await this.grupoRepository
      .createQueryBuilder("g")
      .leftJoinAndSelect("g.usuariogrupo", "ug")
      .leftJoinAndSelect("ug.usuario", "u")
      .where("g.id = :id", { id: parametros.grupo })
      .getOne()

    this.grupoGateway.emitUpdatedGroup(grupoCambiadoCompleto)

    return grupoCambiado;
  }
}
