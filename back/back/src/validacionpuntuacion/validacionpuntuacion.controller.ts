import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ValidacionpuntuacionService } from './validacionpuntuacion.service';

@Controller('validacionpuntuacion')
export class ValidacionpuntuacionController {
  constructor(private readonly validacionpuntuacionService: ValidacionpuntuacionService) {}

  @Post()
  insertar(@Body() parametros){
    return this.validacionpuntuacionService.insertar(parametros)
  }

  @Post()
  eliminar(@Body() parametros){
    return this.validacionpuntuacionService.eliminar(parametros)
  }
}
