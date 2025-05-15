import { Mensaje } from "src/mensaje/entities/mensaje.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("TIPOMENSAJE")
export class Tipomensaje {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    tipo: string

    @OneToMany(
        () => Mensaje,
        (mensaje) => mensaje.tipomensaje
    )
    mensajes: Mensaje[]
}
