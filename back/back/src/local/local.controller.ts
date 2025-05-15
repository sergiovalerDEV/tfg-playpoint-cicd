import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LocalService } from './local.service';
import { CreateLocalDto } from './dto/create-local.dto';
import { UpdateLocalDto } from './dto/update-local.dto';

@Controller('local')
export class LocalController {
  constructor(private readonly localService: LocalService) {}

  @Get()
  findAll() {
    return this.localService.findAll();
  }
}
