import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TipomensajeService } from './tipomensaje.service';
import { CreateTipomensajeDto } from './dto/create-tipomensaje.dto';
import { UpdateTipomensajeDto } from './dto/update-tipomensaje.dto';

@Controller('tipomensaje')
export class TipomensajeController {
  constructor(private readonly tipomensajeService: TipomensajeService) {}
  
}
