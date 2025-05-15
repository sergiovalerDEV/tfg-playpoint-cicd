import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './config/config';
import { validationSchema } from './config/validate';
import { ConfigModule } from '@nestjs/config';
import { UsuarioModule } from './usuario/usuario.module';
import { GrupoModule } from './grupo/grupo.module';
import { MensajeModule } from './mensaje/mensaje.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { QuedadaModule } from './quedada/quedada.module';
import { ReporteModule } from './reporte/reporte.module';
import { LocalModule } from './local/local.module';
import { DeporteModule } from './deporte/deporte.module';
import { DatabaseModule } from './database/database.module';
import { UsuariogrupoModule } from './usuariogrupo/usuariogrupo.module';
import { UsuarioquedadaModule } from './usuarioquedada/usuarioquedada.module';
import { PuntuacionModule } from './puntuacion/puntuacion.module';
import { AuthModule } from './auth/auth.module';
import { TipomensajeModule } from './tipomensaje/tipomensaje.module';
import { AnuncioModule } from './anuncio/anuncio.module';
import { MailmanagerModule } from './mailmanager/mailmanager.module';
import { ValidacionpuntuacionModule } from './validacionpuntuacion/validacionpuntuacion.module';

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: '.env',
    load: [config],
    isGlobal: true,
    validationSchema,
  }), DatabaseModule, UsuarioModule, GrupoModule, MensajeModule, ConfiguracionModule, QuedadaModule, ReporteModule, LocalModule, DeporteModule, UsuariogrupoModule, UsuarioquedadaModule, PuntuacionModule, AuthModule, TipomensajeModule, AnuncioModule, MailmanagerModule, ValidacionpuntuacionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}