import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
      ) {}
    
      // Método para realizar el login y generar el token
      async login(usuario: any) {
        // La "payload" puede contener la información que desees incluir, como identificador y roles.
        const payload = { sub: usuario.id, nombre: usuario.nombre };
        return this.jwtService.sign(payload);
      }
}
