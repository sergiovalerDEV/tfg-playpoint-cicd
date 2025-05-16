import UserService from "../User/UserService"
import axios from "axios"

// Define tipos para mejor seguridad
export interface CreateMeetingParams {
  nombre?: string
  creador?: number // ID del usuario se obtendrá del token si no se proporciona
  localizacion: string
  fecha: string // Formato YYYY-MM-DD
  hora_inicio: string // Formato HH:MM:SS
  hora_finalizacion: string // Formato HH:MM:SS
  competitividad: boolean // Cambiado de number a boolean para enviar el valor correcto
  puntuacion_competitiva_objetiva?: number // Nuevo campo para puntuación competitiva objetiva
  local: number // ID del establecimiento
  deporte: number // ID del deporte
}

export interface Establishment {
  id: number
  nombre: string
  direccion?: string
  imagen?: string
}

export interface Sport {
  id: number
  nombre: string
  imagen?: string
  numero_jugadores?: number
  numero_equipos?: number
}

/**
 * Servicio para crear quedadas
 */
const CreateMeetingService = {
  /**
   * Obtiene todos los establecimientos
   */
  async getEstablishments(): Promise<Establishment[]> {
    try {
      // Verificar si el usuario está autenticado
      const isLoggedIn = await UserService.isLoggedIn()
      if (!isLoggedIn) {
        console.log("Usuario no autenticado")
      }

      try {
        const api = await UserService.getAuthenticatedAxios()
        const response = await api.get("/local")

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data
        } else {
          console.log("Respuesta vacía de la API para establecimientos, usando datos estáticos")
        }
      } catch (apiError) {
        console.error("Error al obtener establecimientos de la API:", apiError)
        console.log("Usando datos estáticos para establecimientos")
      }
    } catch (error) {
      console.error("Error general al obtener establecimientos:", error)
    }
  },

  /**
   * Obtiene todos los deportes
   */
  async getSports(): Promise<Sport[]> {
    try {
      // Verificar si el usuario está autenticado
      const isLoggedIn = await UserService.isLoggedIn()
      if (!isLoggedIn) {
        console.log("Usuario no autenticado, usando datos estáticos para deportes")
      }

      try {
        const api = await UserService.getAuthenticatedAxios()
        const response = await api.get("/deporte")

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data
        } else {
          console.log("Respuesta vacía de la API para deportes, usando datos estáticos")
        }
      } catch (apiError) {
        console.error("Error al obtener deportes de la API:", apiError)
        console.log("Usando datos estáticos para deportes")
      }
    } catch (error) {
      console.error("Error general al obtener deportes:", error)
    }
  },

  /**
   * Inscribe automáticamente al usuario en una quedada
   * Utiliza el endpoint /usuarioquedada/unirse
   */
  async joinMeetingAutomatically(userId: number, quedadaId: number): Promise<boolean> {
    try {
      console.log(`Inscribiendo automáticamente al usuario ${userId} en la quedada ${quedadaId}`)

      const api = await UserService.getAuthenticatedAxios()

      // Parámetros para unirse a la quedada
      // Por defecto, asignamos al equipo 1
      const joinParams = {
        usuario: userId,
        quedada: quedadaId,
        equipo: 1,
      }

      console.log("Parámetros para unirse:", joinParams)

      // Llamar al endpoint /usuarioquedada/unirse
      const response = await api.post("/usuarioquedada/unirse", joinParams)

      console.log("Respuesta de unirse a quedada:", response.data)

      return true
    } catch (error) {
      console.error("Error al inscribir automáticamente al usuario:", error)
      return false
    }
  },

  /**
   * Crea una nueva quedada y automáticamente inscribe al usuario creador
   */
  async createMeeting(params: CreateMeetingParams): Promise<any> {
    try {
      // Verificar si el usuario está autenticado
      const isLoggedIn = await UserService.isLoggedIn()
      if (!isLoggedIn) {
        throw new Error("No hay sesión activa. Por favor inicia sesión.")
      }

      // Si no se proporciona el creador, obtener el ID del usuario actual
      if (!params.creador) {
        const currentUser = await UserService.getCurrentUser()
        if (!currentUser) {
          throw new Error("No se pudo obtener la información del usuario.")
        }
        params.creador = currentUser.id
      }

      // Ya no convertimos competitividad, enviamos el booleano directamente
      console.log("Enviando parámetros para crear quedada:", params)

      const api = await UserService.getAuthenticatedAxios()
      const response = await api.post("/quedada/crear", params)

      console.log("Respuesta de crear quedada:", response.data)

      // Verificar si la quedada se creó correctamente
      if (response.data && response.data.id) {
        // Inscribir automáticamente al usuario en la quedada creada
        try {
          // Guardar el ID del usuario y de la quedada para la inscripción
          const userId = params.creador
          const quedadaId = response.data.id

          console.log(`Inscribiendo automáticamente al usuario ${userId} en la quedada ${quedadaId}`)

          // Intentar unirse a la quedada usando el nuevo método
          const joined = await this.joinMeetingAutomatically(userId, quedadaId)

          if (joined) {
            console.log("Usuario inscrito automáticamente con éxito")
          } else {
            console.warn("No se pudo inscribir automáticamente al usuario, intentando de nuevo...")

            // Esperar un momento y volver a intentar
            await new Promise((resolve) => setTimeout(resolve, 1000))
            const retryJoined = await this.joinMeetingAutomatically(userId, quedadaId)

            if (retryJoined) {
              console.log("Usuario inscrito automáticamente con éxito en el segundo intento")
            } else {
              console.error("No se pudo inscribir automáticamente al usuario después de reintentar")
            }
          }
        } catch (joinError) {
          console.error("Error al inscribir automáticamente al usuario:", joinError)
          // No lanzamos error aquí para no interrumpir el flujo principal
        }
      }

      return response.data
    } catch (error) {
      console.error("Error al crear quedada:", error)

      // Manejar errores específicos
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.")
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message)
        }
      }

      throw error
    }
  },

  /**
   * Formatea fecha para la API (YYYY-MM-DD)
   */
  formatDateForApi(day: number, month: number, year: number): string {
    // Crear una fecha con la zona horaria local
    const date = new Date(year, month, day)

    // Extraer los componentes de la fecha
    const adjustedYear = date.getFullYear()
    const adjustedMonth = date.getMonth() + 1 // getMonth() devuelve 0-11
    const adjustedDay = date.getDate()

    // Formatear como YYYY-MM-DD
    return `${adjustedYear}-${String(adjustedMonth).padStart(2, "0")}-${String(adjustedDay).padStart(2, "0")}`
  },

  /**
   * Formatea hora para la API (HH:MM:SS)
   */
  formatTimeForApi(hour: number, minute: number, ampm: string): string {
    let hours = hour

    // Convertir a formato 24 horas
    if (ampm.toLowerCase() === "pm" && hour < 12) {
      hours += 12
    } else if (ampm.toLowerCase() === "am" && hour === 12) {
      hours = 0
    }

    return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
  },
}

export default CreateMeetingService