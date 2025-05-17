import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Quedada } from './entities/quedada.entity';
import { ILike, Repository } from 'typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';

@Injectable()
export class QuedadaService {
  constructor(
    @InjectRepository(Quedada)
    private quedadaRepository: Repository<Quedada>
  ){}

  findAll() {
    return this.quedadaRepository.find();
  }

  buscarParticipando(id) {
    return this.quedadaRepository.createQueryBuilder('q')
    .innerJoinAndSelect('q.usuarioquedada', 'uq')
    .innerJoinAndSelect('uq.usuario', 'u')
    .innerJoinAndSelect('q.local', 'l')
    .innerJoinAndSelect('q.deporte', 'd')
    .innerJoinAndSelect('q.creador', 'c')
    .where('q.id IN (SELECT quedada FROM "USUARIOQUEDADA" WHERE usuario = :usuario)', {usuario: id})
    .orderBy('q.fecha', 'DESC')
    .getMany();
  }

  filter(filtros) {
    const rango_puntuacion_objetiva = 100

    return this.quedadaRepository.createQueryBuilder('q')
    .leftJoinAndSelect('q.creador', 'c')
    .leftJoinAndSelect('c.configuracion', 'cc')
    .leftJoinAndSelect('q.local', 'l')
    .leftJoinAndSelect('q.deporte', 'd')
    .leftJoinAndSelect('q.usuarioquedada', 'uq')
    .leftJoinAndSelect('uq.usuario', 'u')
    .leftJoinAndSelect('q.puntuaciones', 'p')
    .leftJoinAndSelect('u.configuracion', 'uc')
    .where(filtros.id ? 'q.id = :id' : '1 = 1', {id: filtros.id})
    .andWhere(filtros.nombre ? 'q.nombre ILIKE :nombre' : '1 = 1', {nombre: `%${filtros.nombre}%`})
    .andWhere(filtros.creador ? 'c.id = :creador' : '1 = 1', {creador: filtros.creador})
    .andWhere(filtros.localizacion ? 'q.localizacion ILIKE :localizacion' : '1 = 1', {localizacion: `%${filtros.localizacion}%`})
    .andWhere(filtros.fecha ? 'DATE(q.fecha) = :fecha' : '1 = 1', {fecha: filtros.fecha})
    .andWhere(filtros.hora_inicio ? 'q.hora_inicio = :hora_inicio' : '1 = 1', {hora_inicio: filtros.hora_inicio})
    .andWhere(filtros.hora_finalizacion ? 'q.hora_finalizacion = :hora_finalizacion' : '1 = 1', {hora_finalizacion: filtros.hora_finalizacion})
    .andWhere(filtros.competitividad !== undefined ? 'q.competitividad = :competitividad' : '1 = 1', {competitividad: filtros.competitividad})
    .andWhere(filtros.puntuacion_competitiva_objetiva ? 'q.puntuacion_competitiva_objetiva BETWEEN :puntuacion_competitiva_objetiva_minima AND :puntuacion_competitiva_objetiva_maxima' : '1 = 1', {puntuacion_competitiva_objetiva_minima: filtros.puntuacion_competitiva_objetiva - rango_puntuacion_objetiva, puntuacion_competitiva_objetiva_maxima: filtros.puntuacion_competitiva_objetiva + rango_puntuacion_objetiva})
    .andWhere(filtros.local ? 'l.id = :local' : '1 = 1', {local: filtros.local})
    .andWhere(filtros.deporte ? 'd.id = :deporte' : '1 = 1', {deporte: filtros.deporte})
    .andWhere(filtros.usuarioquedada ? `q.id IN (SELECT uq2."quedada" FROM "USUARIOQUEDADA" uq2 WHERE uq2."usuario" IN (:...usuarioquedada))` : '1 = 1', { usuarioquedada: filtros.usuarioquedada })
    .andWhere(filtros.abierta !== undefined ? 'q.abierta = :abierta' : '1 = 1', {abierta: filtros.abierta})
    .orderBy('q.fecha', 'DESC')
    .getMany()
  }

  async crear(parametros) {
    const quedada =  new Quedada;
    quedada.creador = parametros.creador;
    quedada.nombre = parametros.nombre;
    quedada.localizacion = parametros.localizacion;
    quedada.fecha = parametros.fecha;
    quedada.hora_inicio = parametros.hora_inicio;
    quedada.hora_finalizacion = parametros.hora_finalizacion;
    quedada.competitividad = parametros.competitividad;
    quedada.local =parametros.local;
    quedada.deporte = parametros.deporte;
    quedada.abierta = true

    return (await this.quedadaRepository.insert(quedada)).raw[0];
  }

  async cerrarQuedada(id: number) {
    const quedada = await this.quedadaRepository.findOne({ where: { id } });
    if (!quedada) {
      return { success: false, message: 'Quedada no encontrada' };
    }
    
    quedada.abierta = false;
    await this.quedadaRepository.save(quedada);
    return { success: true, message: 'Quedada cerrada correctamente' };
  }
}
