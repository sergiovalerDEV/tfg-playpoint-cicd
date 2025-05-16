import UserService from "../User/UserService"
import PuntuacionService from "./PuntuacionService"

// Definición de tipos actualizada para reflejar la estructura real de la base de datos
export interface Quedada {
  id: number
  nombre: string
  deporte: {
    id: number
    nombre: string
    imagen?: string
  }
  competitividad: boolean // Cambiado a boolean según la entidad
  local: {
    id: number
    nombre: string
  }
  localizacion: string
  fecha: string | Date // Puede venir como string o como Date
  hora_inicio: string
  hora_finalizacion: string
  creador: {
    id: number
    nombre: string
    foto_perfil: string
  }
  abierta: boolean
  usuarioquedada?: any[]
}

export interface UsuarioQuedada {
  id: number
  usuario: number
  quedada: Quedada
  equipo: number
}

/**
 * Servicio para gestionar las quedadas del usuario
 */
class MyMeetingsService {
  // Cache para quedadas
  private static _cachedMeetings: Map<number, Quedada> = new Map()

  /**
   * Obtiene las quedadas en las que el usuario está inscrito
   * Filtra las quedadas para mostrar solo las que tienen fecha igual o posterior al día actual
   */
  static async getJoinedMeetings(): Promise<Quedada[]> {
    try {
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await UserService.getAuthenticatedAxios()

      // Usar el endpoint de filtrado con el parámetro usuarioquedada
      const response = await api.post(`/quedada/filtrar`, {
        usuarioquedada: [currentUser.id],
      })

      if (response.data && Array.isArray(response.data)) {
        // Guardar en caché
        response.data.forEach((quedada: Quedada) => {
          this._cachedMeetings.set(quedada.id, quedada)
        })

        // Obtener la fecha actual sin hora
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        console.log("Fecha actual para filtrado:", today)

        // Filtrar quedadas para mostrar solo las que tienen fecha igual o posterior al día actual
        const filteredMeetings = response.data.filter((quedada: Quedada) => {
          // Convertir la fecha de la quedada a un objeto Date si no lo es ya
          let meetingDate: Date

          if (quedada.fecha instanceof Date) {
            meetingDate = new Date(quedada.fecha)
          } else {
            // Si es un string, convertirlo a Date
            meetingDate = new Date(quedada.fecha)
          }

          // Resetear la hora a 00:00:00 para comparar solo la fecha
          meetingDate.setHours(0, 0, 0, 0)

          // Depuración
          console.log(`Quedada ${quedada.id} - ${quedada.nombre}: Fecha original:`, quedada.fecha)
          console.log(`Quedada ${quedada.id} - ${quedada.nombre}: Fecha convertida:`, meetingDate)
          console.log(`Quedada ${quedada.id} - ${quedada.nombre}: ¿Es futura?`, meetingDate >= today)

          // Comparar si la fecha de la quedada es igual o posterior a hoy
          return meetingDate >= today
        })

        console.log(`Filtrado: ${filteredMeetings.length} de ${response.data.length} quedadas`)

        return filteredMeetings
      }

      return []
    } catch (error) {
      console.error("Error al obtener quedadas inscritas:", error)
      return []
    }
  }

  /**
   * Obtiene las quedadas creadas por el usuario
   * Incluye todas las quedadas, independientemente de si están abiertas o cerradas
   */
  static async getCreatedMeetings(): Promise<Quedada[]> {
    try {
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      console.log(`Obteniendo quedadas creadas por el usuario ID: ${currentUser.id}`)

      const api = await UserService.getAuthenticatedAxios()

      // IMPORTANTE: Usar el endpoint correcto para obtener todas las quedadas creadas por el usuario
      // NO incluir el filtro 'abierta' para obtener tanto abiertas como cerradas
      const response = await api.get(`/quedada`)

      if (response.data && Array.isArray(response.data)) {
        // Filtrar las quedadas para mostrar solo las creadas por el usuario actual
        const meetings = response.data.filter(
          (quedada: Quedada) => quedada.creador && quedada.creador.id === currentUser.id,
        )

        console.log(`Obtenidas ${meetings.length} quedadas creadas por el usuario (abiertas y cerradas)`)

        // Contar quedadas abiertas y cerradas para depuración
        const abiertas = meetings.filter((q) => q.abierta === true).length
        const cerradas = meetings.filter((q) => q.abierta === false).length
        console.log(`Desglose: ${abiertas} abiertas, ${cerradas} cerradas`)

        // Verificar que cada quedada tenga el campo 'abierta' correctamente definido
        const processedMeetings = meetings.map((quedada: Quedada) => {
          // Asegurarse de que el campo 'abierta' esté definido correctamente
          if (quedada.abierta === undefined || quedada.abierta === null) {
            console.warn(`Quedada ${quedada.id} no tiene el campo 'abierta' definido. Asumiendo que está abierta.`)
            return { ...quedada, abierta: true }
          }

          console.log(`Quedada ${quedada.id} - ${quedada.nombre}: Estado abierta = ${quedada.abierta}`)
          return quedada
        })

        // Guardar en caché
        processedMeetings.forEach((quedada: Quedada) => {
          this._cachedMeetings.set(quedada.id, quedada)
        })

        return processedMeetings // Devolver todas las quedadas creadas, tanto abiertas como cerradas
      }

      console.log("No se encontraron quedadas creadas por el usuario")
      return []
    } catch (error) {
      console.error("Error al obtener quedadas creadas:", error)
      return []
    }
  }

  /**
   * Cierra una quedada específica
   * @param meetingId ID de la quedada a cerrar
   * @returns Objeto con el resultado de la operación
   */
  static async closeMeeting(meetingId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Intentando cerrar la quedada con ID: ${meetingId}`)

      // Verificar que el usuario está autenticado
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      // Obtener el cliente axios autenticado
      const api = await UserService.getAuthenticatedAxios()

      // Verificar si el usuario es el creador de la quedada
      const isCreator = await this.isUserCreator(meetingId)
      if (!isCreator) {
        return {
          success: false,
          message: "Solo el creador puede cerrar la quedada",
        }
      }

      // Verificar si la quedada ya ha comenzado
      const meeting = await this.getMeetingDetails(meetingId)
      if (!meeting) {
        return {
          success: false,
          message: "No se encontró la quedada",
        }
      }

      if (!this.hasMeetingStarted(meeting)) {
        return {
          success: false,
          message: "No puedes cerrar una quedada que aún no ha comenzado",
        }
      }

      // Realizar la petición para cerrar la quedada
      console.log(`Enviando petición PATCH a /quedada/cerrar/${meetingId}`)
      const response = await api.patch(`/quedada/cerrar/${meetingId}`)

      console.log("Respuesta del servidor:", response.data)

      // Actualizar la caché
      if (this._cachedMeetings.has(meetingId)) {
        const cachedMeeting = this._cachedMeetings.get(meetingId)
        if (cachedMeeting) {
          cachedMeeting.abierta = false
          this._cachedMeetings.set(meetingId, cachedMeeting)
        }
      }

      // Limpiar la caché para forzar una recarga completa
      this._cachedMeetings.clear()

      return {
        success: true,
        message: "Quedada cerrada correctamente",
      }
    } catch (error) {
      console.error(`Error al cerrar la quedada ${meetingId}:`, error)

      // Intentar extraer mensaje de error si existe
      let errorMessage = "Error al cerrar la quedada"
      // if (error.response && error.response.data && error.response.data.message) {
      //   errorMessage = error.response.data.message
      // }

      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  /**
   * Verifica si una quedada ya ha comenzado
   * @param meeting Objeto de la quedada
   * @returns true si la quedada ya ha comenzado, false en caso contrario
   */
  static hasMeetingStarted(meeting: Quedada): boolean {
    try {
      if (!meeting || !meeting.fecha || !meeting.hora_inicio) {
        return false
      }

      // Obtener la fecha y hora actual
      const now = new Date()

      // Crear la fecha y hora de la quedada
      let meetingDate: Date

      // Extraer componentes de la fecha
      let year, month, day

      // Procesar la fecha según su formato
      if (typeof meeting.fecha === "string") {
        if (meeting.fecha.includes("T")) {
          // Formato ISO
          const dateParts = meeting.fecha.split("T")[0].split("-")
          year = Number.parseInt(dateParts[0], 10)
          month = Number.parseInt(dateParts[1], 10) - 1 // Meses en JS son 0-11
          day = Number.parseInt(dateParts[2], 10)
        } else {
          // Formato YYYY-MM-DD
          const dateParts = meeting.fecha.split("-")
          year = Number.parseInt(dateParts[0], 10)
          month = Number.parseInt(dateParts[1], 10) - 1 // Meses en JS son 0-11
          day = Number.parseInt(dateParts[2], 10)
        }
      } else if (meeting.fecha instanceof Date) {
        year = meeting.fecha.getFullYear()
        month = meeting.fecha.getMonth()
        day = meeting.fecha.getDate()
      } else {
        return false
      }

      // Extraer componentes de la hora de inicio
      let hours = 0,
        minutes = 0,
        seconds = 0

      if (typeof meeting.hora_inicio === "string") {
        const timeParts = meeting.hora_inicio.split(":")
        hours = Number.parseInt(timeParts[0], 10)
        minutes = Number.parseInt(timeParts[1], 10)
        seconds = timeParts.length > 2 ? Number.parseInt(timeParts[2], 10) : 0
      } else if (meeting.hora_inicio instanceof Date) {
        hours = meeting.hora_inicio.getHours()
        minutes = meeting.hora_inicio.getMinutes()
        seconds = meeting.hora_inicio.getSeconds()
      }

      // Crear fecha y hora de la quedada
      meetingDate = new Date(year, month, day, hours, minutes, seconds)

      // Comparar: la quedada ha comenzado si la hora actual es posterior a la hora de inicio
      return now >= meetingDate
    } catch (error) {
      console.error("Error al verificar estado de la quedada:", error)
      return false
    }
  }

  /**
   * Obtiene los detalles de una quedada específica
   */
  static async getMeetingDetails(meetingId: number): Promise<Quedada | null> {
    try {
      // Verificar si la quedada está en caché
      if (this._cachedMeetings.has(meetingId)) {
        return this._cachedMeetings.get(meetingId) || null
      }

      const api = await UserService.getAuthenticatedAxios()

      try {
        // Intento 1: Usar el endpoint de filtrado
        const filterResponse = await api.post("/quedada/filtrar", { id: meetingId })

        if (filterResponse.data && Array.isArray(filterResponse.data) && filterResponse.data.length > 0) {
          const meeting = filterResponse.data[0]
          this._cachedMeetings.set(meetingId, meeting)
          return meeting
        }
      } catch (filterError) {
        console.error("Error al filtrar quedada por ID:", filterError)

        // Intento 2: Obtener todas las quedadas y buscar por ID
        try {
          const allMeetings = await api.get("/quedada")
          if (allMeetings.data && Array.isArray(allMeetings.data)) {
            const meeting = allMeetings.data.find((m: Quedada) => m.id === meetingId)
            if (meeting) {
              this._cachedMeetings.set(meetingId, meeting)
              return meeting
            }
          }
        } catch (allError) {
          console.error("Error al obtener todas las quedadas:", allError)
        }
      }

      console.error(`No se pudo encontrar la quedada con ID ${meetingId}`)
      return null
    } catch (error) {
      console.error(`Error al obtener detalles de la quedada ${meetingId}:`, error)
      return null
    }
  }

  /**
   * Verifica si el usuario está inscrito en una quedada específica
   */
  static async isUserJoined(meetingId: number): Promise<boolean> {
    try {
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        return false
      }

      const meeting = await this.getMeetingDetails(meetingId)

      if (!meeting) {
        return false
      }

      // Verificar si el usuario está en la lista de usuarioquedada
      if (meeting.usuarioquedada && meeting.usuarioquedada.length > 0) {
        return meeting.usuarioquedada.some((uq: { usuario: { id: number } }) => uq.usuario.id === currentUser.id)
      }

      return false
    } catch (error) {
      console.error(`Error al verificar inscripción en quedada ${meetingId}:`, error)
      return false
    }
  }

  /**
   * Verifica si el usuario es el creador de una quedada específica
   */
  static async isUserCreator(meetingId: number): Promise<boolean> {
    try {
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        return false
      }

      const meeting = await this.getMeetingDetails(meetingId)

      if (!meeting) {
        return false
      }

      return meeting.creador.id === currentUser.id
    } catch (error) {
      console.error(`Error al verificar si es creador de la quedada ${meetingId}:`, error)
      return false
    }
  }

  /**
   * Unirse a una quedada
   */
  static async joinMeeting(meetingId: number, teamNumber = 1): Promise<boolean> {
    try {
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await UserService.getAuthenticatedAxios()
      await api.post("/usuarioquedada/unirse", {
        usuario: currentUser.id,
        quedada: meetingId,
        equipo: teamNumber,
      })

      // Eliminar de la caché para forzar una recarga
      this._cachedMeetings.delete(meetingId)

      return true
    } catch (error) {
      console.error(`Error al unirse a la quedada ${meetingId}:`, error)
      return false
    }
  }

  /**
   * Salirse de una quedada
   */
  static async leaveMeeting(meetingId: number, teamNumber = 1): Promise<boolean> {
    try {
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await UserService.getAuthenticatedAxios()
      await api.post("/usuarioquedada/salirse", {
        usuario: currentUser.id,
        quedada: meetingId,
        equipo: teamNumber,
      })

      // Eliminar de la caché para forzar una recarga
      this._cachedMeetings.delete(meetingId)

      return true
    } catch (error) {
      console.error(`Error al salirse de la quedada ${meetingId}:`, error)
      return false
    }
  }

  /**
   * Formatea la fecha para mostrar
   */
  static formatDate(dateString: string | Date): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      return String(dateString)
    }
  }

  /**
   * Formatea la hora para mostrar
   */
  static formatTime(timeString: string): string {
    try {
      // Si es una hora en formato HH:MM:SS
      if (timeString.includes(":")) {
        const [hours, minutes] = timeString.split(":")
        const hour = Number.parseInt(hours)
        const ampm = hour >= 12 ? "pm" : "am"
        const formattedHour = hour % 12 || 12
        return `${formattedHour}:${minutes}${ampm}`
      }
      return timeString
    } catch (error) {
      return timeString
    }
  }

  /**
   * Obtiene un icono basado en el deporte
   */
  static getSportIcon(sport: string): string {
    if (!sport) return "fitness-outline"

    const sportLower = sport.toLowerCase()

    if (sportLower.includes("tenis")) return "tennisball-outline"
    if (sportLower.includes("baloncesto")) return "basketball-outline"
    if (sportLower.includes("futbol")) return "football-outline"
    if (sportLower.includes("voleibol")) return "volleyball-outline"
    if (sportLower.includes("natacion")) return "water-outline"
    if (sportLower.includes("ciclismo")) return "bicycle-outline"
    if (sportLower.includes("correr")) return "walk-outline"

    return "fitness-outline"
  }

  /**
   * Determina si una quedada es competitiva
   */
  static isCompetitive(competitivity: boolean | number): boolean {
    if (typeof competitivity === "boolean") {
      return competitivity
    }
    return competitivity > 0
  }

  /**
   * Verifica si una quedada es del pasado
   */
  static isPastMeeting(dateValue: string | Date): boolean {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const meetingDate = new Date(dateValue)
      meetingDate.setHours(0, 0, 0, 0)

      return meetingDate < today
    } catch (error) {
      console.error("Error al verificar si la quedada es del pasado:", error)
      return false
    }
  }

  /**
   * Refresca el estado de una quedada específica
   * @param meetingId ID de la quedada a refrescar
   * @returns La quedada actualizada o null si no se pudo obtener
   */
  static async refreshMeetingStatus(meetingId: number): Promise<Quedada | null> {
    try {
      console.log(`Refrescando estado de la quedada ${meetingId}`)

      // Eliminar de la caché para forzar una recarga
      this._cachedMeetings.delete(meetingId)

      // Obtener los detalles actualizados
      return await this.getMeetingDetails(meetingId)
    } catch (error) {
      console.error(`Error al refrescar estado de la quedada ${meetingId}:`, error)
      return null
    }
  }
  
  /**
   * Verifica si una quedada ya tiene puntuaciones asignadas
   * @param meetingId ID de la quedada
   * @returns true si la quedada ya tiene puntuaciones, false en caso contrario
   */
  static async checkMeetingRatings(meetingId: number): Promise<boolean> {
    try {
      console.log(`🔍 Verificando si la quedada ${meetingId} ya tiene puntuaciones`);
      
      // Usar el servicio de puntuaciones para verificar
      const puntuaciones = await PuntuacionService.getPuntuacionesByQuedadaId(meetingId);
      
      const tienePuntuaciones = puntuaciones.length > 0;
      console.log(`ℹ️ Quedada ${meetingId}: ${tienePuntuaciones ? 'Ya tiene puntuaciones' : 'No tiene puntuaciones'}`);
      
      return tienePuntuaciones;
    } catch (error) {
      console.error(`❌ Error al verificar puntuaciones para quedada ${meetingId}:`, error);
      return false;
    }
  }
}

export default MyMeetingsService