import { Quedada } from "src/quedada/entities/quedada.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("VALIDACIONPUNTUACION")
export class Validacionpuntuacion {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(
        () => Usuario,
        (usuario) => usuario.validacionespuntuacion,
        {eager: true}
    )
    @JoinColumn({name: "usuario"})
    usuario: Usuario

    @ManyToOne(
        () => Quedada,
        (quedada) => quedada.validacionespuntuacion,
        {eager: true}
    )
    @JoinColumn({name: "quedada"})
    quedada: Quedada
}
