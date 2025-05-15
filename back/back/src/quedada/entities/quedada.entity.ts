import { Deporte } from "src/deporte/entities/deporte.entity";
import { Local } from "src/local/entities/local.entity";
import { Puntuacion } from "src/puntuacion/entities/puntuacion.entity";
import { Reporte } from "src/reporte/entities/reporte.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Usuarioquedada } from "src/usuarioquedada/entities/usuarioquedada.entity";
import { Validacionpuntuacion } from "src/validacionpuntuacion/entities/validacionpuntuacion.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('QUEDADA')
export class Quedada {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    nombre: string

    @ManyToOne(
        () => Usuario,
        (usuario) => usuario.creador_quedadas,
        {eager: true}
    )
    @JoinColumn({name: "creador"})
    creador: Usuario
    
    @Column()
    localizacion: string

    @Column()
    fecha: Date

    @Column({type: 'time'})
    hora_inicio: Date

    @Column({type: 'time'})
    hora_finalizacion: Date

    @Column()
    competitividad: boolean

    @Column({nullable: true})
    puntuacion_competitiva_objetiva: number

    @ManyToOne(
        () => Local,
        (local) => local.quedadas,
        {eager: true}
    )
    @JoinColumn({name: "local"})
    local: Local

    @ManyToOne(
        () => Deporte,
        (deporte) => deporte.quedadas,
        {eager: true}
    )
    @JoinColumn({name: "deporte"})
    deporte: Deporte

    @OneToMany(
        () => Reporte,
        (reporte) => reporte.quedada
    )
    reportes: Reporte[]

    @OneToMany(
        () => Usuarioquedada,
        (usuarioquedada) => usuarioquedada.quedada,
        {eager: true}
    )
    usuarioquedada: Usuarioquedada[]

    @OneToMany(
        () => Puntuacion,
        (puntuacion) => puntuacion.quedada
    )
    puntuaciones: Puntuacion[]

    @Column()
    abierta: boolean

    @OneToMany(
        () => Validacionpuntuacion,
        (validacionpuntuacion) => validacionpuntuacion.quedada
    )
    validacionespuntuacion: Validacionpuntuacion
}