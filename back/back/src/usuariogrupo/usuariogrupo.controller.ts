import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsuariogrupoService } from './usuariogrupo.service';
import { AuthGuard } from '@nestjs/passport';
import { AnadirUsuarioGrupoDto } from './dto/anadir.dto';
import { EliminarUsuarioGrupoDto } from './dto/eliminar.dto';

@Controller('usuariogrupo')
export class UsuariogrupoController {
  constructor(private readonly usuariogrupoService: UsuariogrupoService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post("/anadir")
  anadir(@Body() parametros: AnadirUsuarioGrupoDto){
    return this.usuariogrupoService.anadir(parametros);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post("/eliminar")
  eliminar(@Body() parametros: EliminarUsuarioGrupoDto){
    return this.usuariogrupoService.eliminar(parametros);
  }
}
