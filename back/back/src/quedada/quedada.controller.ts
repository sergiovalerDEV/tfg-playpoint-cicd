import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { QuedadaService } from './quedada.service';
import { AuthGuard } from '@nestjs/passport';
import { FiltrarQuedadaDto } from './dto/filtrar.dto';
import { CrearQuedadaDto } from './dto/crear.dto';

@Controller('quedada')
export class QuedadaController {
  constructor(private readonly quedadaService: QuedadaService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.quedadaService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post("/filtrar")
  filter(@Body() filtros: FiltrarQuedadaDto) {
    return this.quedadaService.filter(filtros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post("/crear")
  crear(@Body() parametros: CrearQuedadaDto){
    return this.quedadaService.crear(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/cerrar/:id')
  async cerrarQuedada(@Param('id') id: string) {
    return this.quedadaService.cerrarQuedada(+id);
  }
}
