import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MensajeService } from './mensaje.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';

@Controller('mensaje')
export class MensajeController {
  constructor(private readonly mensajeService: MensajeService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get("/por-grupo/:grupo")
  listarPorGrupo(@Param('grupo') grupo, @Query('skip') skip = '0', @Query('take') take = '100'){
    return this.mensajeService.listarPorGrupo(grupo, Number.parseInt(skip, 10), Number.parseInt(take, 10));
  }

  @UseGuards(AuthGuard('jwt'))
  @Post("/enviar")
  @UseInterceptors(FileInterceptor('file'))
  async enviar(@Body() parametros, @UploadedFile() file: Multer.File){
    console.log(parametros)
    if(file){
      console.log("si")
      const url =  await this.mensajeService.subirImagen(file)
      parametros.texto = url
      parametros.tipo = 2
    } else {
      console.log("no")
      parametros.tipo = 1
    }

    return this.mensajeService.enviar(parametros);
  }
}
