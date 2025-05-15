import { Mensaje } from "src/mensaje/entities/mensaje.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Usuariogrupo } from "src/usuariogrupo/entities/usuariogrupo.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('GRUPO')
export class Grupo {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    imagen: string

    @Column()
    nombre: string

    @Column()
    descripcion: string

    @OneToMany(
        () => Usuariogrupo,
        (usuariogrupo) => usuariogrupo.grupo
    )
    usuariogrupo: Usuariogrupo[]

    @OneToMany(
        () => Mensaje,
        (mensaje) => mensaje.grupo
    )
    mensajes: Mensaje[]
}