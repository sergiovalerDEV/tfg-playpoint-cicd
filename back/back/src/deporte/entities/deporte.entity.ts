import { Quedada } from "src/quedada/entities/quedada.entity";
import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('DEPORTE')
export class Deporte {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    nombre: string

    @Column({nullable: true})
    imagen: string

    @Column()
    numero_jugadores: number

    @Column()
    numero_equipos: number

    @Column({nullable: true})
    multiplicador_puntuacion_competitiva: number

    @OneToMany(
        () => Quedada,
        (quedada) => quedada.deporte
    )
    quedadas: Quedada[]
}