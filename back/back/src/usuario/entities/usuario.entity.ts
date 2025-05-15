import { number } from "joi";
import { title } from "process";
import { Configuracion } from "src/configuracion/entities/configuracion.entity";
import { Grupo } from "src/grupo/entities/grupo.entity";
import { Mensaje } from "src/mensaje/entities/mensaje.entity";
import { Quedada } from "src/quedada/entities/quedada.entity";
import { Reporte } from "src/reporte/entities/reporte.entity";
import { Usuariogrupo } from "src/usuariogrupo/entities/usuariogrupo.entity";
import { Usuarioquedada } from "src/usuarioquedada/entities/usuarioquedada.entity";
import { Validacionpuntuacion } from "src/validacionpuntuacion/entities/validacionpuntuacion.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('USUARIO')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  foto_perfil: string

  @Column({ unique: true })
  nombre: string

  @Column()
  correo: string

  @Column()
  contrasena: string;

  @Column()
  numero_telefono: number

  @Column()
  puntuacion_competitiva: number

  @Column()
  premium: boolean

  @ManyToOne(
    () => Configuracion,
    (configuracion) => configuracion.usuarios,
    { eager: true }
  )
  @JoinColumn({ name: 'configuracion' })
  configuracion: Configuracion

  @OneToMany(
    () => Usuariogrupo,
    (usuariogrupo) => usuariogrupo.usuario
  )
  usuariogrupo: Usuariogrupo[]

  @OneToMany(
    () => Usuarioquedada,
    (usuarioquedada) => usuarioquedada.usuario
  )
  usuarioquedada: Usuarioquedada[]

  @OneToMany(
    () => Quedada,
    (quedada) => quedada.creador
  )
  creador_quedadas: Quedada[]

  @OneToMany(
    () => Mensaje,
    (mensaje) => mensaje.usuario
  )
  mensajes: Mensaje[]

  @OneToMany(
    () => Reporte,
    (reporte) => reporte.usuario
  )
  reportes: Reporte[]

  @OneToMany(
    () => Validacionpuntuacion,
    (validacionpuntuacion) => validacionpuntuacion.usuario
  )
  validacionespuntuacion: Validacionpuntuacion[]
}