import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Validacionpuntuacion } from './entities/validacionpuntuacion.entity';
import { Repository } from 'typeorm';
import { valid } from 'joi';

@Injectable()
export class ValidacionpuntuacionService {
  constructor(
    @InjectRepository(Validacionpuntuacion)
    private validacionPuntuacionRepository: Repository<Validacionpuntuacion>
  ){}

  insertar(parametros){
    const validacionpuntuacion = new Validacionpuntuacion
    validacionpuntuacion.usuario = parametros.usuario
    validacionpuntuacion.quedada = parametros.quedada

    return this.validacionPuntuacionRepository.insert(validacionpuntuacion)
  }
  
  async eliminar(parametros){
    const validacionpuntuacion = await this.validacionPuntuacionRepository.find({where: {usuario: parametros.usuario, quedada: parametros.quedada}})

    return this.validacionPuntuacionRepository.remove(validacionpuntuacion)
  }
}
