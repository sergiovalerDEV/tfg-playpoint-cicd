import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailmanagerService {
    private transporter: nodemailer.Transporter;

    constructor(private readonly mailerService: MailerService) {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'playpoint.notificaciones@gmail.com',
                pass: 'sbewvtheejnouazr',
            },
        });
    }

    async enviar(parametros){
        const mailOptions = {
          from: '"PlayPoint Team" <playpoint.notificaciones@gmail.com>',
          to: parametros.destinatario,
          subject: 'Verification Code - PlayPoint',
          html: `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verification Code</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      line-height: 1.6;
                      color: #333333;
                      margin: 0;
                      padding: 0;
                  }
                  .container {
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 20px;
                  }
                  .header {
                      background-color: #4F46E5;
                      padding: 20px;
                      text-align: center;
                      color: white;
                      border-radius: 5px 5px 0 0;
                  }
                  .content {
                      padding: 20px;
                      background-color: #ffffff;
                      border: 1px solid #e0e0e0;
                      border-top: none;
                      border-radius: 0 0 5px 5px;
                  }
                  .code {
                      font-size: 24px;
                      font-weight: bold;
                      text-align: center;
                      padding: 15px;
                      margin: 20px 0;
                      background-color: #f5f5f5;
                      border-radius: 5px;
                      letter-spacing: 5px;
                  }
                  .footer {
                      text-align: center;
                      margin-top: 20px;
                      font-size: 12px;
                      color: #777777;
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>PlayPoint</h1>
                  </div>
                  <div class="content">
                      <h2>Verification Code</h2>
                      <p>Hello,</p>
                      <p>Thank you for using PlayPoint. Please use the following verification code to complete your request:</p>
                      
                      <div class="code">${parametros.codigo}</div>
                      
                      <p>This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
                      
                      <p>Best regards,<br>The PlayPoint Team</p>
                  </div>
                  <div class="footer">
                      <p>This is an automated message, please do not reply to this email.</p>
                      <p>&copy; ${new Date().getFullYear()} PlayPoint. All rights reserved.</p>
                  </div>
              </div>
          </body>
          </html>
          `,
          context: {
              name: parametros.destinatario.split('@')[0],
          },
      };

      try {
        await this.transporter.sendMail(mailOptions);
        return 'Correo enviado con éxito';
      } catch (error) {
        console.error('Error al enviar el correo:', error);
        throw error;
      }
    }
}
