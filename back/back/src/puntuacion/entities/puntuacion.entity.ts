import { Quedada } from "src/quedada/entities/quedada.entity";
import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("PUNTUACION")
@Unique("UQ_QUEDADA_EQUIPO_PUNTUACION_PUNTUACION", ["quedada", "equipo"])
export class Puntuacion {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(
        () => Quedada,
        (quedada) => quedada.puntuaciones,
        {eager: true}
    )
    @JoinColumn({name: "quedada"})
    quedada: Quedada

    @Column()
    equipo: number

    @Column()
    puntuacion: number
}
