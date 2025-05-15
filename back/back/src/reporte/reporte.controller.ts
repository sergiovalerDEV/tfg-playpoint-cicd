import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ReporteService } from './reporte.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('reporte')
export class ReporteController {
  constructor(private readonly reporteService: ReporteService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post("/crear")
  crear(@Body() parametros) {
    return this.reporteService.crear(parametros);
  }
}
