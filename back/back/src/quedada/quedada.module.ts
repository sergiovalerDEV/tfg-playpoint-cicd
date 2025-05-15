import { Module } from '@nestjs/common';
import { QuedadaService } from './quedada.service';
import { QuedadaController } from './quedada.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quedada } from './entities/quedada.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Quedada])],
  controllers: [QuedadaController],
  providers: [QuedadaService],
})
export class QuedadaModule {}
