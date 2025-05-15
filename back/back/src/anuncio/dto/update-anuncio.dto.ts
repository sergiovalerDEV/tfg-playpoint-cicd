import { PartialType } from '@nestjs/mapped-types';
import { CreateAnuncioDto } from './create-anuncio.dto';

export class UpdateAnuncioDto extends PartialType(CreateAnuncioDto) {}
