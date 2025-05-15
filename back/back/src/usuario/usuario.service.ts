import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Repository } from 'typeorm';
import { ConfiguracionService } from 'src/configuracion/configuracion.service';
import { Multer } from 'multer'; 
import axios from 'axios';
import { AuthService } from 'src/auth/auth.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private readonly configuracionService: ConfiguracionService,
    private authService: AuthService
  ){}

  buscar(texto){
    return this.usuarioRepository.createQueryBuilder('u')
    .where('u.nombre ILIKE :texto', {texto: `%${texto}%`})
    .orWhere('u.correo ILIKE :texto', {texto: `%${texto}%`})
    .getMany()
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });
    
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    
    return usuario;
  }

  async login(parametros){
    const usuario = await this.usuarioRepository.find({ where: { nombre: parametros.nombre } });

    if(usuario.length === 0){
      return { mensaje: "Usuario incorrecto" };
    }

    if(!await bcrypt.compareSync(parametros.contrasena, usuario[0].contrasena)){
      return { mensaje: "Contraseña incorrecta" };
    }

    const access_token = await this.authService.login({nombre: parametros.nombre, userId: parametros.contrasena});

    return { usuario, access_token };
  }

  async registro(parametros){
    const usuario: Usuario = new Usuario;
    usuario.foto_perfil = "";
    usuario.nombre = parametros.nombre;
    usuario.correo = parametros.correo;
    usuario.contrasena = parametros.contrasena;
    usuario.numero_telefono = parametros.numero_telefono;
    usuario.puntuacion_competitiva = 0;
    usuario.premium = false;

    const configuracion = await this.configuracionService.insert();
    usuario.configuracion = configuracion.id;

    return (await this.usuarioRepository.insert(usuario)).raw;
  }

  async subirFotoPerfil(usuario: number, file: Multer.file){
    const bucketName = process.env.AWS_BUCKET_NAME;
    const fileName = `${Date.now()}-${file.originalname}`;
    const fileData = file.buffer;

    const s3Url = `https://${bucketName}.s3.amazonaws.com/uploaded/fotos-usuario/${fileName}`;

    await axios.put(s3Url, fileData, {
        headers: {
            'Content-Type': file.mimetype,
        },
    });

    await this.usuarioRepository.update({id: usuario}, { foto_perfil: s3Url });

    console.log(s3Url);

    return { message: "File uploaded correctly", url: s3Url };
  }

  cambiarNombre(parametros){
    return this.usuarioRepository.update({id: parametros.id}, {nombre: parametros.nombre})
  }

  cambiarCorreo(parametros){
    return this.usuarioRepository.update({id: parametros.id}, {correo: parametros.correo})
  }

  cambiarNumeroTelefono(parametros){
    return this.usuarioRepository.update({id: parametros.id}, {numero_telefono: parametros.numero_telefono})
  }

  suscribirPremium(parametros){
    return this.usuarioRepository.update({id: parametros.id}, {premium: true})
  }

  cancelarPremium(parametros){
    return this.usuarioRepository.update({id: parametros.id}, {premium: false})
  }

  async sumarPuntosCompetitivos(parametros) {
    try {
      // Primero obtenemos el usuario para verificar que existe y obtener su puntuación actual
      const usuario = await this.usuarioRepository.findOne({ where: { id: parametros.id } });
      
      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${parametros.id} no encontrado`);
      }
      
      // Calculamos la nueva puntuación
      const puntuacionActual = usuario.puntuacion_competitiva || 0;
      const nuevaPuntuacion = puntuacionActual + parametros.puntos;
      
      // Actualizamos la puntuación en la base de datos
      await this.usuarioRepository.update(
        { id: parametros.id }, 
        { puntuacion_competitiva: nuevaPuntuacion }
      );
      
      // Obtenemos el usuario actualizado para devolver la información completa
      const usuarioActualizado = await this.usuarioRepository.findOne({ where: { id: parametros.id } });
      
      // Verificamos que el usuario existe antes de acceder a sus propiedades
      if (!usuarioActualizado) {
        throw new NotFoundException(`No se pudo encontrar el usuario con ID ${parametros.id} después de la actualización`);
      }
      
      return {
        mensaje: `Se han sumado ${parametros.puntos} puntos competitivos al usuario ${parametros.id}`,
        puntuacion_anterior: puntuacionActual,
        puntuacion_actual: usuarioActualizado.puntuacion_competitiva,
        usuario: usuarioActualizado
      };
    } catch (error) {
      // Si es un error conocido (como NotFoundException), lo relanzamos
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Para otros errores, lanzamos un mensaje genérico
      throw new Error(`Error al sumar puntos competitivos: ${error.message}`);
    }
  }

  async restarPuntosCompetitivos(parametros) {
    try {
      // Primero obtenemos el usuario para verificar que existe y obtener su puntuación actual
      const usuario = await this.usuarioRepository.findOne({ where: { id: parametros.id } });
      
      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${parametros.id} no encontrado`);
      }
      
      // Calculamos la nueva puntuación (nunca menor que 0)
      const puntuacionActual = usuario.puntuacion_competitiva || 0;
      const nuevaPuntuacion = Math.max(0, puntuacionActual - parametros.puntos);
      
      // Actualizamos la puntuación en la base de datos
      await this.usuarioRepository.update(
        { id: parametros.id }, 
        { puntuacion_competitiva: nuevaPuntuacion }
      );
      
      // Obtenemos el usuario actualizado para devolver la información completa
      const usuarioActualizado = await this.usuarioRepository.findOne({ where: { id: parametros.id } });
      
      // Verificamos que el usuario existe antes de acceder a sus propiedades
      if (!usuarioActualizado) {
        throw new NotFoundException(`No se pudo encontrar el usuario con ID ${parametros.id} después de la actualización`);
      }
      
      return {
        mensaje: `Se han restado ${parametros.puntos} puntos competitivos al usuario ${parametros.id}`,
        puntuacion_anterior: puntuacionActual,
        puntuacion_actual: usuarioActualizado.puntuacion_competitiva,
        usuario: usuarioActualizado
      };
    } catch (error) {
      // Si es un error conocido (como NotFoundException), lo relanzamos
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Para otros errores, lanzamos un mensaje genérico
      throw new Error(`Error al restar puntos competitivos: ${error.message}`);
    }
  }
}
