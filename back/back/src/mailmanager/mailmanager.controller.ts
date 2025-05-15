import { Body, Controller, Post } from '@nestjs/common';
import { MailmanagerService } from './mailmanager.service';

@Controller('mailmanager')
export class MailmanagerController {
  constructor(private readonly mailmanagerService: MailmanagerService) {}

  @Post("/enviar/verificacion-correo")
  enviar(@Body() parametros){
    return this.mailmanagerService.enviar(parametros);
  }
}
