import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reporte } from './entities/reporte.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReporteService {
  constructor(
    @InjectRepository(Reporte)
    private reporteRepository: Repository<Reporte>
  ){}

  crear(parametros){
    const reporte: Reporte = new Reporte
    reporte.razon = parametros.razon;
    reporte.usuario = parametros.usuario;
    reporte.quedada = parametros.quedada;
    
    return this.reporteRepository.insert(reporte)
  }
}
