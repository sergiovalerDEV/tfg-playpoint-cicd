import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailmanagerService } from './mailmanager.service';
import { MailmanagerController } from './mailmanager.controller';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'playpoint.notificaciones@gmail.com',
          pass: 'sbewvtheejnouazr',
        },
      },
      defaults: {
        from: '"No Reply" <no-reply@example.com>',
      },
      template: {
        dir: process.cwd() + '\\src\\templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [MailmanagerController],
  providers: [MailmanagerService],
})
export class MailmanagerModule {}
