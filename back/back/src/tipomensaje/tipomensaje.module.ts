import { Module } from '@nestjs/common';
import { TipomensajeService } from './tipomensaje.service';
import { TipomensajeController } from './tipomensaje.controller';
import { Tipomensaje } from './entities/tipomensaje.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([Tipomensaje])],
  controllers: [TipomensajeController],
  providers: [TipomensajeService],
})
export class TipomensajeModule {}
