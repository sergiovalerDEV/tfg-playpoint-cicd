export default interface Mensaje {
    id: string
    texto: string
    usuario: any
    grupo: any
    fecha: string
    hora: string
    tipomensaje?: {
      id: number
      nombre: string
    }
  }