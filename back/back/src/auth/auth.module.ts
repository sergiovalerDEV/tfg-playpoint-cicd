import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            // La clave secreta debe guardarse en las variables de entorno (ej. JWT_SECRET)
            secret: configService.get<string>('JWT_SECRET') || 'clave-secreta-por-defecto',
            signOptions: { expiresIn: '1h' }, // configuración de expiración
          }),
        }),
      ],
      providers: [AuthService, JwtStrategy],
      exports: [AuthService],
})
export class AuthModule {}
