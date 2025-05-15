import { Module } from '@nestjs/common';
import { AnuncioService } from './anuncio.service';
import { AnuncioController } from './anuncio.controller';
import { Anuncio } from './entities/anuncio.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([Anuncio])],
  controllers: [AnuncioController],
  providers: [AnuncioService],
})
export class AnuncioModule {}
