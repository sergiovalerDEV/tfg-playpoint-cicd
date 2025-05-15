import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MensajeGateway } from './mensaje.gateway';
import { Multer } from 'multer';
import axios from 'axios';

@Injectable()
export class MensajeService {
  constructor(
    @InjectRepository(Mensaje)
    private mensajeRepository: Repository<Mensaje>,
    private mensajeGateway: MensajeGateway
  ){}

  async listarPorGrupo(grupo, skip = 0, take = 100){
    const total = await this.mensajeRepository.createQueryBuilder("m").where("m.grupo = :grupo", { grupo }).getCount()

    const offsetFromEnd = Math.max(0, total - skip - take);

    const mensajes = await this.mensajeRepository.createQueryBuilder('m')
    .leftJoinAndSelect('m.usuario', 'u')
    .leftJoinAndSelect('m.grupo', 'g')
    .leftJoinAndSelect('m.tipomensaje', 't')
    .where('g.id = :grupo', {grupo: grupo})
    .orderBy('m.fecha', 'ASC')
    .addOrderBy('m.hora', 'ASC')
    .skip(offsetFromEnd)
    .take(take)
    .getMany()

    return {mensajes, hayMas: total > skip + take}
  }

  async subirImagen(file: Multer.file){
    const bucketName = process.env.AWS_BUCKET_NAME;
    const fileName = `${Date.now()}-${file.originalname}`;
    const fileData = file.buffer;

    const s3Url = `https://${bucketName}.s3.amazonaws.com/uploaded/mensajes/${fileName}`;

    await axios.put(s3Url, fileData, {
        headers: {
            'Content-Type': file.mimetype,
        },
    });

    return s3Url
  }

  async enviar(parametros) {
    const mensaje = new Mensaje()
    mensaje.texto = parametros.texto
    mensaje.usuario = parametros.usuario
    mensaje.grupo = parametros.grupo
    mensaje.hora = parametros.hora
    mensaje.fecha = parametros.fecha
    mensaje.tipomensaje = parametros.tipo

    const partesFecha = parametros.fecha.split("/")

    const dia = Number.parseInt(partesFecha[0], 10)
    const mes = Number.parseInt(partesFecha[1], 10) - 1
    const anio = Number.parseInt(partesFecha[2], 10)

    const fechaObj = new Date(anio, mes, dia)

    mensaje.fecha = fechaObj

    const result = await this.mensajeRepository.insert(mensaje)

    const mensajeCompleto = await this.mensajeRepository.findOne({
      where: { id: result.identifiers[0].id },
      relations: ["usuario", "grupo", "tipomensaje"],
    })

    this.mensajeGateway.emitNewMessage(parametros.grupo, mensajeCompleto)

    return result
  }
}
