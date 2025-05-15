import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Usuarioquedada } from './entities/usuarioquedada.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsuarioquedadaService {
  constructor(
    @InjectRepository(Usuarioquedada)
    private usuarioquedadaRepository: Repository<Usuarioquedada>
  ){}

  async unirse(parametros){
    const usuarioquedada = new Usuarioquedada;
    usuarioquedada.usuario = parametros.usuario;
    usuarioquedada.equipo = parametros.equipo;
    usuarioquedada.quedada = parametros.quedada;

    return (await this.usuarioquedadaRepository.insert(usuarioquedada)).raw;
  }

  async salirse(parametros){
    const usuarioquedada = await this.usuarioquedadaRepository.find({ where: { usuario: parametros.usuario, equipo: parametros.equipo, quedada: parametros.quedada } });

    return this.usuarioquedadaRepository.remove(usuarioquedada);
  }
}
