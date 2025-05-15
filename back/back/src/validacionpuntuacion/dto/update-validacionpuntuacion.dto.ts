import { PartialType } from '@nestjs/mapped-types';
import { CreateValidacionpuntuacionDto } from './create-validacionpuntuacion.dto';

export class UpdateValidacionpuntuacionDto extends PartialType(CreateValidacionpuntuacionDto) {}
