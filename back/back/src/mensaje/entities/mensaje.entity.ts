import { Grupo } from "src/grupo/entities/grupo.entity";
import { Tipomensaje } from "src/tipomensaje/entities/tipomensaje.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('MENSAJE')
export class Mensaje {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    texto: string

    @ManyToOne(
        () => Tipomensaje,
        (tipomensaje) => tipomensaje.mensajes,
        {eager: true}
    )
    @JoinColumn({name: "tipo"})
    tipomensaje: Tipomensaje

    @ManyToOne(
        () => Usuario,
        (usuario) => usuario.mensajes,
        {eager: true}
    )
    @JoinColumn({name: "usuario"})
    usuario: Usuario

    @ManyToOne(
        () => Grupo,
        (grupo) => grupo.mensajes,
        {eager: true}
    )
    @JoinColumn({name: 'grupo'})
    grupo: Grupo
    
    @Column({ type: 'date' })
    fecha: Date

    @Column({type: 'time'})
    hora: Date
}