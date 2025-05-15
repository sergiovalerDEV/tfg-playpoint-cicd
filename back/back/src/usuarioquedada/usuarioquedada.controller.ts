import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsuarioquedadaService } from './usuarioquedada.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('usuarioquedada')
export class UsuarioquedadaController {
  constructor(private readonly usuarioquedadaService: UsuarioquedadaService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post("/unirse")
  unirse(@Body() parametros){
    return this.usuarioquedadaService.unirse(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post("/salirse")
  salirse(@Body() parametros){
    return this.usuarioquedadaService.salirse(parametros);
  }
}
