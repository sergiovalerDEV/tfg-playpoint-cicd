import { PartialType } from '@nestjs/mapped-types';
import { CreateTipomensajeDto } from './create-tipomensaje.dto';

export class UpdateTipomensajeDto extends PartialType(CreateTipomensajeDto) {}
