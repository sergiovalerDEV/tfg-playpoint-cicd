import { API_URL } from "../../../config"
import Mensaje from "../../models/Message"
import UserService from "../User/UserService"
import io from "socket.io-client"

export interface MensajesResponse {
  mensajes: Mensaje[]
  hayMas: boolean
}

let socket: any = null
let isConnecting = false
let connectPromise: Promise<any> | null = null

const ChatService = {
  async getSocket() {
    if (isConnecting && connectPromise) {
      return connectPromise
    }

    if (socket && socket.connected) {
      return socket
    }

    isConnecting = true

    connectPromise = new Promise(async (resolve, reject) => {
      try {
        const token = await UserService.getAccessToken()

        if (socket) {
          socket.disconnect()
        }

        console.log("Conectando a WebSocket en:", API_URL)

        socket = io(API_URL, {
          extraHeaders: {
            Authorization: `Bearer ${token}`,
          },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })

        socket.on("connect", () => {
          console.log("Socket conectado con ID:", socket.id)
          isConnecting = false
          resolve(socket)
        })

        socket.on("connect_error", (error: any) => {
          console.error("Error de conexión WebSocket:", error)
          isConnecting = false
          reject(error)
        })

        socket.on("disconnect", (reason: string) => {
          console.log("Socket desconectado:", reason)
        })

        setTimeout(() => {
          if (!socket.connected) {
            console.error("Timeout de conexión WebSocket")
            isConnecting = false
            reject(new Error("Timeout de conexión WebSocket"))
          }
        }, 5000)
      } catch (error) {
        console.error("Error al inicializar WebSocket:", error)
        isConnecting = false
        reject(error)
      }
    })

    return connectPromise
  },

  async joinChatRoom(userId: number, groupId: number) {
    try {
      const socket = await this.getSocket()
      console.log(`Uniendo al usuario ${userId} a la sala del grupo ${groupId}`)
      socket.emit("joinRoom", { userId, groupId })
      return true
    } catch (error) {
      console.error("Error al unirse a la sala de chat:", error)
      return false
    }
  },

  async leaveChatRoom(userId: number, groupId: number) {
    try {
      const socket = await this.getSocket()
      socket.emit("leaveRoom", { userId, groupId })
      return true
    } catch (error) {
      console.error("Error al salir de la sala de chat:", error)
      return false
    }
  },

  async subscribeToNewMessages(callback: (mensaje: Mensaje) => void) {
    try {
      const socket = await this.getSocket()

      socket.off("newMessage")

      socket.on("newMessage", (mensaje: Mensaje) => {
        console.log("Nuevo mensaje recibido por WebSocket:", mensaje)
        callback(mensaje)
      })

      return () => {
        if (socket) {
          socket.off("newMessage")
        }
      }
    } catch (error) {
      console.error("Error al suscribirse a nuevos mensajes:", error)
      return () => {}
    }
  },

  async mensajes(grupo: any, skip = 0, take = 100): Promise<MensajesResponse> {
    console.log(grupo.id)

    try {
      const api = await UserService.getAuthenticatedAxios()
      const response = await api.get("/mensaje/por-grupo/" + grupo.id, { params: { skip, take } })
      console.log("mensajes", response.data)
      return response.data
    } catch (error) {
      console.error("Error al obtener quedadas:", error)
      return { mensajes: [], hayMas: false }
    }
  },

  async enviarMensaje(texto: string, usuario: any, grupo: any, imageUri?: string) {
    try {
      const now = new Date()
      const fecha = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`
      const hora = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`

      const formData = new FormData()
      formData.append("texto", texto)
      formData.append("usuario", usuario.id)
      formData.append("grupo", grupo.id)
      formData.append("fecha", fecha)
      formData.append("hora", hora)

      if (imageUri) {
        const uriParts = imageUri.split("/")
        const fileName = uriParts[uriParts.length - 1]

        const fileType =
          fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
            ? "image/jpeg"
            : fileName.endsWith(".png")
              ? "image/png"
              : "image/jpeg"

        formData.append("file", {
          uri: imageUri,
          name: fileName,
          type: fileType,
        } as any)
      }

      const api = await UserService.getAuthenticatedAxios()
      const response = await api.post("/mensaje/enviar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      return response.data
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      throw error
    }
  },
}
export default ChatService
