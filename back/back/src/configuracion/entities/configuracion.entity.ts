import { Usuario } from "src/usuario/entities/usuario.entity";
import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('CONFIGURACION')
export class Configuracion {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    color_aplicacion: string

    @Column()
    permitir_notificaciones: boolean

    @OneToMany(
        () => Usuario,
        (usuario) => usuario.configuracion
    )
    usuarios: Usuario[]
}