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


INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones)
VALUES ('Azul', true);

INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones)
VALUES ('Rojo', false);

INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones)
VALUES ('Verde', true);

INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones)
VALUES ('Amarillo', false);

INSERT INTO public."CONFIGURACION" (color_aplicacion, permitir_notificaciones)
VALUES ('Morado', true);



INSERT INTO public."DEPORTE" (nombre, numero_jugadores)
VALUES ('Fútbol', 11);

INSERT INTO public."DEPORTE" (nombre, numero_jugadores)
VALUES ('Baloncesto', 5);

INSERT INTO public."DEPORTE" (nombre, numero_jugadores)
VALUES ('Voleibol', 6);

INSERT INTO public."DEPORTE" (nombre, numero_jugadores)
VALUES ('Béisbol', 9);

INSERT INTO public."DEPORTE" (nombre, numero_jugadores)
VALUES ('Rugby', 15);



INSERT INTO public."GRUPO" DEFAULT VALUES;
INSERT INTO public."GRUPO" DEFAULT VALUES;
INSERT INTO public."GRUPO" DEFAULT VALUES;
INSERT INTO public."GRUPO" DEFAULT VALUES;
INSERT INTO public."GRUPO" DEFAULT VALUES;



INSERT INTO public."LOCAL" (nombre, direccion)
VALUES ('Local A', 'Calle 123');

INSERT INTO public."LOCAL" (nombre, direccion)
VALUES ('Local B', 'Avenida 456');

INSERT INTO public."LOCAL" (nombre, direccion)
VALUES ('Local C', 'Boulevard 789');

INSERT INTO public."LOCAL" (nombre, direccion)
VALUES ('Local D', 'Ruta 101');

INSERT INTO public."LOCAL" (nombre, direccion)
VALUES ('Local E', 'Camino 202');



INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, numero_telefono, puntuacion_competitiva, premium, configuracion, contrasena)
VALUES ('foto1.png', 'usuario1', 'usuario1@example.com', 111111111, 100, true, 1, 'claveSegura1');

INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, numero_telefono, puntuacion_competitiva, premium, configuracion, contrasena)
VALUES ('foto2.png', 'usuario2', 'usuario2@example.com', 222222222, 90, false, 2, 'claveSegura2');

INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, numero_telefono, puntuacion_competitiva, premium, configuracion, contrasena)
VALUES ('foto3.png', 'usuario3', 'usuario3@example.com', 333333333, 80, true, 3, 'claveSegura3');

INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, numero_telefono, puntuacion_competitiva, premium, configuracion, contrasena)
VALUES ('foto4.png', 'usuario4', 'usuario4@example.com', 444444444, 70, false, 4, 'claveSegura4');

INSERT INTO public."USUARIO" (foto_perfil, nombre, correo, numero_telefono, puntuacion_competitiva, premium, configuracion, contrasena)
VALUES ('foto5.png', 'usuario5', 'usuario5@example.com', 555555555, 60, true, 5, 'claveSegura5');



INSERT INTO public."QUEDADA" (localizacion, fecha, competitividad, creador, hora_inicio, hora_finalizacion, local, deporte)
VALUES ('Parque Central', '2025-04-10 15:00:00', true, 1, '15:00:00', '17:00:00', 1, 1);

INSERT INTO public."QUEDADA" (localizacion, fecha, competitividad, creador, hora_inicio, hora_finalizacion, local, deporte)
VALUES ('Estadio Municipal', '2025-04-12 18:00:00', false, 2, '18:00:00', '20:00:00', 2, 2);

INSERT INTO public."QUEDADA" (localizacion, fecha, competitividad, creador, hora_inicio, hora_finalizacion, local, deporte)
VALUES ('Cancha 1', '2025-04-14 12:00:00', true, 3, '12:00:00', '14:00:00', 3, 3);

INSERT INTO public."QUEDADA" (localizacion, fecha, competitividad, creador, hora_inicio, hora_finalizacion, local, deporte)
VALUES ('Campo Deportivo', '2025-04-16 16:00:00', false, 4, '16:00:00', '18:00:00', 4, 4);

INSERT INTO public."QUEDADA" (localizacion, fecha, competitividad, creador, hora_inicio, hora_finalizacion, local, deporte)
VALUES ('Plaza Deportiva', '2025-04-18 10:00:00', true, 5, '10:00:00', '12:00:00', 5, 5);



INSERT INTO public."MENSAJE" (texto, grupo, usuario)
VALUES ('Hola grupo, ¿cómo están?', 1, 1);

INSERT INTO public."MENSAJE" (texto, grupo, usuario)
VALUES ('Buenas tardes, aquí va un mensaje de prueba.', 2, 2);

INSERT INTO public."MENSAJE" (texto, grupo, usuario)
VALUES ('Recordemos la reunión de hoy.', 3, 3);

INSERT INTO public."MENSAJE" (texto, grupo, usuario)
VALUES ('Aviso importante para el grupo.', 4, 4);

INSERT INTO public."MENSAJE" (texto, grupo, usuario)
VALUES ('Mensaje de cierre para el grupo.', 5, 5);



INSERT INTO public."REPORTE" (razon, usuario, quedada)
VALUES ('Comportamiento inadecuado', 2, 1);

INSERT INTO public."REPORTE" (razon, usuario, quedada)
VALUES ('Incumplimiento de reglas', 3, 2);

INSERT INTO public."REPORTE" (razon, usuario, quedada)
VALUES ('Falta de puntualidad', 4, 3);

INSERT INTO public."REPORTE" (razon, usuario, quedada)
VALUES ('Uso de lenguaje inapropiado', 5, 4);

INSERT INTO public."REPORTE" (razon, usuario, quedada)
VALUES ('Otro reporte de prueba', 1, 5);



INSERT INTO public."USUARIOGRUPO" (usuario, grupo)
VALUES (1, 1);

INSERT INTO public."USUARIOGRUPO" (usuario, grupo)
VALUES (2, 2);

INSERT INTO public."USUARIOGRUPO" (usuario, grupo)
VALUES (3, 3);

INSERT INTO public."USUARIOGRUPO" (usuario, grupo)
VALUES (4, 4);

INSERT INTO public."USUARIOGRUPO" (usuario, grupo)
VALUES (5, 5);
