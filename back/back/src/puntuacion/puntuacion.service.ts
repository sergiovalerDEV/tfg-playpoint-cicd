import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Puntuacion } from './entities/puntuacion.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PuntuacionService {
  constructor(
    @InjectRepository(Puntuacion)
    private puntuacionRepository: Repository<Puntuacion>
  ){}

  async anadir(parametros){
    const puntuacionExistente = await this.puntuacionRepository.find({where: {equipo: parametros.equipo, quedada: {id: parametros.quedada}}})

    console.log(parametros)

    if(puntuacionExistente.length > 0){
      return this.puntuacionRepository.update(puntuacionExistente[0], {puntuacion: parametros.puntuacion})
    } else {
      const puntuacion: Puntuacion = new Puntuacion;
      puntuacion.puntuacion = parametros.puntuacion;
      puntuacion.equipo = parametros.equipo;
      puntuacion.quedada = parametros.quedada;
  
      return this.puntuacionRepository.insert(puntuacion);
    }
  }
}
