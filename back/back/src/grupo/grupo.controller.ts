import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { GrupoService } from './grupo.service';
import { Multer } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { CrearGrupoDto } from './dto/crear.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('grupo')
export class GrupoController {
  constructor(private readonly grupoService: GrupoService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get("/por-usuario/:usuario")
  listarPorUsuario(@Param('usuario') usuario){
    return this.grupoService.listarPorUsuario(usuario);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post("/crear")
  crear(@Body() parametros: CrearGrupoDto){
    return this.grupoService.crear(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post("/modificar/foto")
  @UseInterceptors(FileInterceptor('file'))
  async cambiarFoto(@Body() parametros, @UploadedFile() file: Multer.File){
    return this.grupoService.cambiarFoto(parametros, file);
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Post("/modificar/nombre")
  cambiarNombre(@Body() parametros){
    console.log(parametros)
    return this.grupoService.cambiarNombre(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post("/modificar/descripcion")
  cambiarDescripcion(@Body() parametros){
    return this.grupoService.cambiarDescripcion(parametros);
  }
}
