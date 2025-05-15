import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnuncioService } from './anuncio.service';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';

@Controller('anuncio')
export class AnuncioController {
  constructor(private readonly anuncioService: AnuncioService) {}

  @Post("/anadir")
  create(@Body() parametros: CreateAnuncioDto) {
    return this.anuncioService.anadir(parametros);
  }

  @Get()
  findAll(){
    return this.anuncioService.findAll();
  }
}
