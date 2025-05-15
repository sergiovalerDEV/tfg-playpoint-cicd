import { Grupo } from "src/grupo/entities/grupo.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("USUARIOGRUPO")
@Unique("UQ_USUARIO_GRUPO", ["usuario", "grupo"])
export class Usuariogrupo {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(
        () => Usuario,
        (usuario) => usuario.usuariogrupo,
        {eager: true}
    )
    @JoinColumn({name: "usuario"})
    usuario: Usuario

    @ManyToOne(
        () => Grupo,
        (grupo) => grupo.usuariogrupo,
        {eager: true}
    )
    @JoinColumn({name: "grupo"})
    grupo: Grupo
}
