import { Injectable } from '@nestjs/common';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';
import { Repository } from 'typeorm';
import { Anuncio } from './entities/anuncio.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AnuncioService {
  constructor(
    @InjectRepository(Anuncio)
    private anuncioRepository: Repository<Anuncio>
  ) {}

  anadir(parametros) {
    const anuncio = new Anuncio;
    anuncio.nombre = parametros.nombre;
    anuncio.descripcion = parametros.descripcion;
    anuncio.imagenes = parametros.imagenes;
    anuncio.video = parametros.video;
    return this.anuncioRepository.insert(anuncio);
  }

  findAll(){
    return this.anuncioRepository.find();
  }
}
