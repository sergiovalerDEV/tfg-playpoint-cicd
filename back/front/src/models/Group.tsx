import { Usuario } from "./User"

export interface Grupo {
    id: number
    imagen: any
    nombre: string
    descripcion: string
    usuariogrupo: [
        {
            id: number
            usuario: Usuario
        }
    ]
}