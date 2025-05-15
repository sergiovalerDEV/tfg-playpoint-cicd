import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ParseIntPipe, UploadedFile, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { BuscarUsuarioDto } from './dto/buscar.dto';
import { LoginUsuarioDto } from './dto/login.dto';
import { RegistroUsuarioDto } from './dto/registro.dto';
import { CambiarNombreDto } from './dto/cambiar_nombre.dto';
import { CambiarCorreoDto } from './dto/cambiar_correo.dto';
import { CambiarNumeroTelefonoDto } from './dto/cambiar_numero_telefono.dto';
import { SuscribirPremiumDto } from './dto/suscribir_premium.dto';
import { CancelarPremiumDto } from './dto/cancelar_premium.dto';
import { SumarPuntosDto } from './dto/sumar_puntos.dto';
import { RestarPuntosDto } from './dto/restar_puntos.dto';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post("/buscar")
  buscar(@Body("texto") texto: BuscarUsuarioDto){
    return this.usuarioService.buscar(texto)
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findOne(id);
  }

  @Post("/login")
  login(@Body() parametros: LoginUsuarioDto){
    console.log(parametros)
    return this.usuarioService.login(parametros);
  }

  @Post("/registro")
  registro(@Body() parametros: RegistroUsuarioDto){
    return this.usuarioService.registro(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/actualizarfoto/:usuario')
  @UseInterceptors(FileInterceptor('file'))
  async subirImagen(@Param("usuario", ParseIntPipe) usuario: number, @UploadedFile() file: Multer.File) {
      return this.usuarioService.subirFotoPerfil(usuario, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/editar-perfil/nombre')
  cambiarNombre(@Body() parametros: CambiarNombreDto){
    return this.usuarioService.cambiarNombre(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/editar-perfil/correo')
  cambiarEmail(@Body() parametros: CambiarCorreoDto){
    return this.usuarioService.cambiarCorreo(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/editar-perfil/numero-telefono')
  cambiarNumeroTelefono(@Body() parametros: CambiarNumeroTelefonoDto){
    return this.usuarioService.cambiarNumeroTelefono(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/premium/suscribir')
  suscribirPremium(@Body() parametros: SuscribirPremiumDto){
    return this.usuarioService.suscribirPremium(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/premium/cancelar')
  cancelarPremium(@Body() parametros: CancelarPremiumDto){
    return this.usuarioService.cancelarPremium(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/puntos/sumar')
  sumarPuntos(@Body() parametros: SumarPuntosDto) {
    return this.usuarioService.sumarPuntosCompetitivos(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/puntos/restar')
  restarPuntos(@Body() parametros: RestarPuntosDto) {
    return this.usuarioService.restarPuntosCompetitivos(parametros);
  }
}
