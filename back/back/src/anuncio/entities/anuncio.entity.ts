import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("ANUNCIO")
export class Anuncio {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    nombre: string

    @Column()
    descripcion: string

    @Column('text', { array: true })
    imagenes: string[];

    @Column()
    video: string
}
