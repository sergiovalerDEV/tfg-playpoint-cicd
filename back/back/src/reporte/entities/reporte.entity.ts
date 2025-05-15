import { Quedada } from "src/quedada/entities/quedada.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('REPORTE')
export class Reporte {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    razon: string

    @ManyToOne(
        () => Usuario,
        (usuario) => usuario.reportes,
        {eager: true}
    )
    @JoinColumn({name: "usuario"})
    usuario: Usuario

    @ManyToOne(
        () => Quedada,
        (quedada) => quedada.reportes,
        {eager: true}
    )
    @JoinColumn({name: "quedada"})
    quedada: Quedada
}