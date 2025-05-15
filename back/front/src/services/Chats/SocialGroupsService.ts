import { API_URL } from "../../../config"
import { Grupo } from "../../models/Group"
import UserService from "../User/UserService"
import io from "socket.io-client"

let socket: any = null
let isConnecting = false
let connectPromise: Promise<any> | null = null

const SocialGroupsService = {
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
          console.log("Socket de grupos conectado con ID:", socket.id)
          isConnecting = false
          resolve(socket)
        })

        socket.on("connect_error", (error: any) => {
          console.error("Error de conexión WebSocket de grupos:", error)
          isConnecting = false
          reject(error)
        })

        socket.on("disconnect", (reason: string) => {
          console.log("Socket de grupos desconectado:", reason)
        })

        setTimeout(() => {
          if (!socket.connected) {
            console.error("Timeout de conexión WebSocket de grupos")
            isConnecting = false
            reject(new Error("Timeout de conexión WebSocket de grupos"))
          }
        }, 5000)
      } catch (error) {
        console.error("Error al inicializar WebSocket de grupos:", error)
        isConnecting = false
        reject(error)
      }
    })

    return connectPromise
  },

  async registerForGroupUpdates(userId: string) {
    try {
      console.log(`Intentando registrar al usuario ${userId} para actualizaciones de grupos...`)
      const socket = await this.getSocket()

      if (!socket.connected) {
        console.error("Socket no conectado al intentar registrar para actualizaciones de grupos")
        return false
      }

      console.log(`Emitiendo evento registerForGroupUpdates para usuario ${userId}`)
      socket.emit("registerForGroupUpdates", { userId })

      return true
    } catch (error) {
      console.error("Error al registrarse para actualizaciones de grupos:", error)
      return false
    }
  },

  async unregisterFromGroupUpdates() {
    try {
      if (!socket) return true

      const currentSocket = await this.getSocket()
      currentSocket.emit("unregisterFromGroupUpdates")
      return true
    } catch (error) {
      console.error("Error al cancelar el registro de actualizaciones de grupos:", error)
      return false
    }
  },

  async subscribeToGroupUpdates(
    onNewGroup: (grupo: Grupo) => void,
    onUpdatedGroup: (grupo: Grupo) => void,
    onDeletedGroup: (grupoId: string) => void,
  ) {
    try {
      console.log("Suscribiéndose a eventos de grupos...")
      const socket = await this.getSocket()

      socket.off("newGroup")
      socket.off("updatedGroup")
      socket.off("deletedGroup")

      socket.on("newGroup", (grupo: any) => {
        console.log("Nuevo grupo recibido por WebSocket:", JSON.stringify(grupo))
        try {
          if (grupo && grupo.id) {
            onNewGroup(grupo)
          } else {
            console.error("Grupo recibido sin ID:", grupo)
          }
        } catch (error) {
          console.error("Error al procesar nuevo grupo:", error)
        }
      })

      socket.on("updatedGroup", (grupo: any) => {
        console.log("Grupo actualizado recibido por WebSocket:", JSON.stringify(grupo))
        try {
          if (grupo && grupo.id) {
            onUpdatedGroup(grupo)
          } else {
            console.error("Grupo actualizado recibido sin ID:", grupo)
          }
        } catch (error) {
          console.error("Error al procesar grupo actualizado:", error)
        }
      })

      socket.on("deletedGroup", (data: any) => {
        console.log("Eliminación de grupo recibida por WebSocket:", data)
        try {
          if (data && data.id) {
            onDeletedGroup(data.id)
          } else {
            console.error("Eliminación de grupo recibida sin ID:", data)
          }
        } catch (error) {
          console.error("Error al procesar eliminación de grupo:", error)
        }
      })

      socket.onAny((eventName: string, ...args: any[]) => {
        console.log(`Evento WebSocket recibido: ${eventName}`, args)
      })

      console.log("Suscripción a eventos de grupos completada")

      return () => {
        if (socket) {
          socket.off("newGroup")
          socket.off("updatedGroup")
          socket.off("deletedGroup")
          socket.offAny()
        }
      }
    } catch (error) {
      console.error("Error al suscribirse a actualizaciones de grupos:", error)
      return () => {}
    }
  },

  async groups(usuario: any) {
    console.log("Obteniendo grupos para usuario:", usuario.id)

    try {
      const api = await UserService.getAuthenticatedAxios()
      const response = await api.get("/grupo/por-usuario/" + usuario.id)
      console.log("Grupos obtenidos:", response.data.length)
      return response.data
    } catch (error) {
      console.error("Error al obtener grupos:", error)
      return []
    }
  },

  async crearGrupo(nombre: string, descripcion: string, usuarios: string[]): Promise<any> {
    try {
      console.log("Creando grupo:", nombre, "con usuarios:", usuarios)
      const api = await UserService.getAuthenticatedAxios()
      const response = await api.post("/grupo/crear", {
        nombre,
        descripcion,
        usuarios,
      })
      console.log("Grupo creado:", response.data)

      return response.data
    } catch (error) {
      console.error("Error al crear grupo:", error)
      throw error
    }
  },

  async cambiarNombreGrupo(grupoId: string, nuevoNombre: string): Promise<boolean> {
    try {
      console.log(`Cambiando nombre del grupo ${grupoId} a: ${nuevoNombre}`)
      const api = await UserService.getAuthenticatedAxios()
      await api.post("/grupo/modificar/nombre", {
        grupo: grupoId,
        nombre: nuevoNombre,
      })
      return true
    } catch (error) {
      console.error("Error al cambiar nombre del grupo:", error)
      throw error
    }
  },

  async cambiarDescripcionGrupo(grupoId: string, nuevaDescripcion: string): Promise<boolean> {
    try {
      console.log(`Cambiando descripción del grupo ${grupoId} a: ${nuevaDescripcion}`)
      const api = await UserService.getAuthenticatedAxios()
      await api.post("/grupo/modificar/descripcion", {
        grupo: grupoId,
        descripcion: nuevaDescripcion,
      })
      return true
    } catch (error) {
      console.error("Error al cambiar descripción del grupo:", error)
      throw error
    }
  },

  async cambiarFotoGrupo(grupoId: string, imageUri: string): Promise<boolean> {
    try {
      console.log(`Cambiando foto del grupo ${grupoId}`)

      const formData = new FormData()
      formData.append("grupo", grupoId)

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

      const api = await UserService.getAuthenticatedAxios()
      await api.post("/grupo/modificar/foto", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      return true
    } catch (error) {
      console.error("Error al cambiar foto del grupo:", error)
      throw error
    }
  },
}

export default SocialGroupsService
