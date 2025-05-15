import { Quedada } from "src/quedada/entities/quedada.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('USUARIOQUEDADA')
@Unique("UQ_uUSUARIO_QUEDADA_USUARIOQUEDADA", ["usuario", "quedada"])
export class Usuarioquedada {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(
        () => Usuario,
        (usuario) => usuario.usuarioquedada,
        { eager: true }
    )
    @JoinColumn({ name: "usuario" })
    usuario: Usuario

    @ManyToOne(
        () => Quedada,
        (quedada) => quedada.usuarioquedada
    )
    @JoinColumn({ name: "quedada" })
    quedada: Quedada


    @Column()
    equipo: number
}
