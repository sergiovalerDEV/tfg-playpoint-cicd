DO $$ 
BEGIN 
    EXECUTE (
        SELECT string_agg('DROP SEQUENCE IF EXISTS public."' || sequence_name || '" CASCADE;', ' ') 
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    ); 
END $$;


DROP TABLE IF EXISTS public."PUNTUACION";
DROP TABLE IF EXISTS public."MENSAJE";
DROP TABLE IF EXISTS public."USUARIOGRUPO";
DROP TABLE IF EXISTS public."USUARIOQUEDADA";
DROP TABLE IF EXISTS public."REPORTE";
DROP TABLE IF EXISTS public."QUEDADA";
DROP TABLE IF EXISTS public."USUARIO";
DROP TABLE IF EXISTS public."GRUPO";
DROP TABLE IF EXISTS public."LOCAL";
DROP TABLE IF EXISTS public."DEPORTE";
DROP TABLE IF EXISTS public."CONFIGURACION";

INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones) VALUES ('Azul', true);
INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones) VALUES ('Rojo', false);
INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones) VALUES ('Verde', true);
INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones) VALUES ('Amarillo', false);
INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones) VALUES ('Morado', true);

INSERT INTO public."DEPORTE" (nombre, numero_jugadores, numero_equipos) VALUES ('Fútbol', 11, 2);
INSERT INTO public."DEPORTE" (nombre, numero_jugadores, numero_equipos) VALUES ('Baloncesto', 5, 2);
INSERT INTO public."DEPORTE" (nombre, numero_jugadores, numero_equipos) VALUES ('Voleibol', 6, 2);
INSERT INTO public."DEPORTE" (nombre, numero_jugadores, numero_equipos) VALUES ('Tenis', 1, 2);
INSERT INTO public."DEPORTE" (nombre, numero_jugadores, numero_equipos) VALUES ('Rugby', 15, 2);

INSERT INTO public."GRUPO" DEFAULT VALUES;
INSERT INTO public."GRUPO" DEFAULT VALUES;
INSERT INTO public."GRUPO" DEFAULT VALUES;
INSERT INTO public."GRUPO" DEFAULT VALUES;
INSERT INTO public."GRUPO" DEFAULT VALUES;

INSERT INTO public."LOCAL" (nombre, direccion) VALUES ('Centro Deportivo', 'Calle 123');
INSERT INTO public."LOCAL" (nombre, direccion) VALUES ('Polideportivo', 'Avenida 456');
INSERT INTO public."LOCAL" (nombre, direccion) VALUES ('Estadio Municipal', 'Plaza 789');
INSERT INTO public."LOCAL" (nombre, direccion) VALUES ('Club Deportivo', 'Calle 101');
INSERT INTO public."LOCAL" (nombre, direccion) VALUES ('Gimnasio Central', 'Avenida 202');

INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, contrasena, numero_telefono, puntuacion_competitiva, premium, configuracion)
VALUES ('perfil1.jpg', 'usuario1', 'usuario1@mail.com', 'clave1', 111111111, 10, true, 1);
INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, contrasena, numero_telefono, puntuacion_competitiva, premium, configuracion)
VALUES ('perfil2.jpg', 'usuario2', 'usuario2@mail.com', 'clave2', 222222222, 20, false, 2);
INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, contrasena, numero_telefono, puntuacion_competitiva, premium, configuracion)
VALUES ('perfil3.jpg', 'usuario3', 'usuario3@mail.com', 'clave3', 333333333, 30, true, 3);
INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, contrasena, numero_telefono, puntuacion_competitiva, premium, configuracion)
VALUES ('perfil4.jpg', 'usuario4', 'usuario4@mail.com', 'clave4', 444444444, 40, false, 4);
INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, contrasena, numero_telefono, puntuacion_competitiva, premium, configuracion)
VALUES ('perfil5.jpg', 'usuario5', 'usuario5@mail.com', 'clave5', 555555555, 50, true, 5);

INSERT INTO public."QUEDADA" (localizacion, fecha, hora_inicio, hora_finalizacion, competitividad, abierta, creador, local, deporte)
VALUES ('Parque Central', '2025-04-15 10:00:00', '10:00:00', '12:00:00', true, true, 1, 1, 1);
INSERT INTO public."QUEDADA" (localizacion, fecha, hora_inicio, hora_finalizacion, competitividad, abierta, creador, local, deporte)
VALUES ('Estadio Nuevo', '2025-04-16 14:00:00', '14:00:00', '16:00:00', false, true, 2, 2, 2);
INSERT INTO public."QUEDADA" (localizacion, fecha, hora_inicio, hora_finalizacion, competitividad, abierta, creador, local, deporte)
VALUES ('Cancha Principal', '2025-04-17 09:30:00', '09:30:00', '11:30:00', true, false, 3, 3, 3);
INSERT INTO public."QUEDADA" (localizacion, fecha, hora_inicio, hora_finalizacion, competitividad, abierta, creador, local, deporte)
VALUES ('Campo Abierto', '2025-04-18 17:00:00', '17:00:00', '19:00:00', false, true, 4, 4, 4);
INSERT INTO public."QUEDADA" (localizacion, fecha, hora_inicio, hora_finalizacion, competitividad, abierta, creador, local, deporte)
VALUES ('Zona Deportiva', '2025-04-19 08:00:00', '08:00:00', '10:00:00', true, false, 5, 5, 5);

INSERT INTO public."MENSAJE" (texto, usuario, grupo) VALUES ('Hola, ¿cómo están?', 1, 1);
INSERT INTO public."MENSAJE" (texto, usuario, grupo) VALUES ('¿Alguien para jugar mañana?', 2, 2);
INSERT INTO public."MENSAJE" (texto, usuario, grupo) VALUES ('Confirmen asistencia, por favor.', 3, 3);
INSERT INTO public."MENSAJE" (texto, usuario, grupo) VALUES ('Reunión post-partido en el bar.', 4, 4);
INSERT INTO public."MENSAJE" (texto, usuario, grupo) VALUES ('Partido reprogramado para el sábado.', 5, 5);

INSERT INTO public."REPORTE" (razon, usuario, quedada) VALUES ('Spam en el chat', 1, 1);
INSERT INTO public."REPORTE" (razon, usuario, quedada) VALUES ('Lenguaje ofensivo', 2, 2);
INSERT INTO public."REPORTE" (razon, usuario, quedada) VALUES ('Incumplimiento de normas', 3, 3);
INSERT INTO public."REPORTE" (razon, usuario, quedada) VALUES ('Publicidad no autorizada', 4, 4);
INSERT INTO public."REPORTE" (razon, usuario, quedada) VALUES ('Comportamiento inapropiado', 5, 5);

INSERT INTO public."PUNTUACION" (equipo, puntuacion, quedada) VALUES (1, 15, 1);
INSERT INTO public."PUNTUACION" (equipo, puntuacion, quedada) VALUES (2, 20, 2);
INSERT INTO public."PUNTUACION" (equipo, puntuacion, quedada) VALUES (1, 18, 3);
INSERT INTO public."PUNTUACION" (equipo, puntuacion, quedada) VALUES (2, 22, 4);
INSERT INTO public."PUNTUACION" (equipo, puntuacion, quedada) VALUES (1, 25, 5);

INSERT INTO public."USUARIOGRUPO" ("usuarioId", "grupoId") VALUES (1, 1);
INSERT INTO public."USUARIOGRUPO" ("usuarioId", "grupoId") VALUES (2, 2);
INSERT INTO public."USUARIOGRUPO" ("usuarioId", "grupoId") VALUES (3, 3);
INSERT INTO public."USUARIOGRUPO" ("usuarioId", "grupoId") VALUES (4, 4);
INSERT INTO public."USUARIOGRUPO" ("usuarioId", "grupoId") VALUES (5, 5);

INSERT INTO public."USUARIOQUEDADA" (equipo, usuario, quedada) VALUES (1, 1, 1);
INSERT INTO public."USUARIOQUEDADA" (equipo, usuario, quedada) VALUES (2, 2, 2);
INSERT INTO public."USUARIOQUEDADA" (equipo, usuario, quedada) VALUES (1, 3, 3);
INSERT INTO public."USUARIOQUEDADA" (equipo, usuario, quedada) VALUES (2, 4, 4);
INSERT INTO public."USUARIOQUEDADA" (equipo, usuario, quedada) VALUES (1, 5, 5);
