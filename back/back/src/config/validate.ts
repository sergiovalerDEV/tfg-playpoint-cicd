import * as Joi from 'joi';

// npm install joi @types/joi

export const validationSchema = Joi.object({
        POSTGRES_HOST: Joi.string().required(),       // Host de la base de datos
        POSTGRES_PORT: Joi.number().required(),       // Puerto
        POSTGRES_USER: Joi.string().required(),       // Usuario
        POSTGRES_PASSWORD: Joi.string().required(),   // Contraseña
        POSTGRES_DB: Joi.string().required(),         // Nombre de la base de datos
});