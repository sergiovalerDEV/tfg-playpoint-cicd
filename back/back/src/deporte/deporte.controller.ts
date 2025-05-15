import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DeporteService } from './deporte.service';
import { CreateDeporteDto } from './dto/create-deporte.dto';
import { UpdateDeporteDto } from './dto/update-deporte.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('deporte')
export class DeporteController {
  constructor(private readonly deporteService: DeporteService) {}

  @Get()
  findAll() {
    return this.deporteService.findAll();
  }
}
