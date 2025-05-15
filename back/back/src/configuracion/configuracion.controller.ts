import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { CreateConfiguracionDto } from './dto/create-configuracion.dto';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post("/cambiartema")
  cambiarTema(@Body() parametros) {
    return this.configuracionService.cambiarTema(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post("/cambiarnotificaciones")
  cambiarNotificaciones(@Body() parametros) {
    return this.configuracionService.cambiarNotificaciones(parametros);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.configuracionService.findOne(+id);
  }
}
