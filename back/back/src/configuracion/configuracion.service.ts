import { Injectable } from '@nestjs/common';
import { CreateConfiguracionDto } from './dto/create-configuracion.dto';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { Repository } from 'typeorm';
import { Configuracion } from './entities/configuracion.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(Configuracion)
    public configuracionRepository: Repository<Configuracion>
  ){}

  async insert() {
    const configuracion: Configuracion = new Configuracion;
    configuracion.color_aplicacion = "blanco";
    configuracion.permitir_notificaciones = false;

    return (await this.configuracionRepository.insert(configuracion)).raw[0];
  }

  cambiarTema(parametros){
    console.log(parametros)
    return this.configuracionRepository.update({id: parametros.id}, {color_aplicacion: parametros.color_aplicacion});
  }

  cambiarNotificaciones(parametros){
    return this.configuracionRepository.update({id: parametros.configuracion}, {permitir_notificaciones: parametros.permitir_notificaciones});
  }

  findOne(id: number) {
    return this.configuracionRepository.findOne({ where: { id } });
  }
}
