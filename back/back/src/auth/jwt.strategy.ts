import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Extrae el token del header "Authorization" como "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      // Se recomienda obtener la clave secreta desde la configuración
      secretOrKey: configService.get<string>('JWT_SECRET') || 'clave-secreta-por-defecto',
    });
  }

  async validate(payload: any) {
    // El método "validate" determina la información que se añadirá a "req.user"
    // Puedes añadir validaciones adicionales, por ejemplo, consultar el usuario en BD.
    console.log("jwt.strategy.ts, payload: ", payload)
    return { userId: payload.sub, nombre: payload.nombre };
  }
}
