/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as crypto from 'crypto';

// npm i @nestjs/config @nestjs/typeorm crypto

if (typeof globalThis.crypto === 'undefined') {
    (globalThis as any).crypto = crypto;
}

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('config.postgres.host'),
                port: configService.get<number>('config.postgres.port'),
                username: configService.get<string>('config.postgres.user'),
                password: configService.get<string>('config.postgres.password'),
                database: configService.get<string>('config.postgres.dbName'),
                ssl: { rejectUnauthorized: false },
                autoLoadEntities: true,
                synchronize: true,
            }),
        }),
    ],
})
export class DatabaseModule {}
