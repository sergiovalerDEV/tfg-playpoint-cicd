import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PuntuacionService } from './puntuacion.service';
import { AuthGuard } from '@nestjs/passport';
import { AnadirPuntuacionDto } from './dto/anadir.dto';

@Controller('puntuacion')
export class PuntuacionController {
  constructor(private readonly puntuacionService: PuntuacionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post("/anadir")
  anadir(@Body() parametros: AnadirPuntuacionDto){
    return this.puntuacionService.anadir(parametros);
  }
}
