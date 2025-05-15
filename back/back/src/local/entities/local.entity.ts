import { Quedada } from "src/quedada/entities/quedada.entity";
import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('LOCAL')
export class Local {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    nombre: string

    @Column()
    direccion: string

    @OneToMany(
        () => Quedada,
        (quedada) => quedada.local
    )
    quedadas: Quedada[]
}