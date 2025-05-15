import { Module } from '@nestjs/common';
import { MensajeService } from './mensaje.service';
import { MensajeController } from './mensaje.controller';
import { Mensaje } from './entities/mensaje.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeGateway } from './mensaje.gateway';

@Module({
  imports:[TypeOrmModule.forFeature([Mensaje])],
  controllers: [MensajeController],
  providers: [MensajeService, MensajeGateway],
  exports: [MensajeService]
})
export class MensajeModule {}
