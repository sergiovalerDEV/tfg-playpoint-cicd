import { Module } from '@nestjs/common';
import { LocalService } from './local.service';
import { LocalController } from './local.controller';
import { Local } from './entities/local.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([Local])],
  controllers: [LocalController],
  providers: [LocalService],
})
export class LocalModule {}
