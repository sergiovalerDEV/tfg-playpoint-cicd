import axios from "axios"
import UserService from "../User/UserService"
import { API_URL } from "../../../config"

// Define tipos para mejor seguridad
export interface Deporte {
  id: number
  nombre: string
  imagen?: string
  numero_jugadores: number
  numero_equipos: number
}

export interface Local {
  id: number
  nombre: string
  direccion?: string
  imagen?: string
}

export interface Usuario {
  id: number
  nombre: string
  foto_perfil?: string
  configuracion?: any
  correo?: string
  numero_telefono?: number
  puntuacion_competitiva?: number
  premium?: boolean
}

export interface UsuarioQuedada {
  id: number
  usuario: Usuario
  quedada: number
  equipo?: number
}

export interface Puntuacion {
  id: number
  quedada: number
  equipo: number
  puntuacion: number
}

export interface Quedada {
  id: number
  nombre?: string
  creador: Usuario
  localizacion: string
  fecha: string
  hora_inicio: string
  hora_finalizacion: string
  competitividad: boolean
  puntuacion_competitiva_objetiva?: number
  local: Local
  deporte: Deporte
  abierta: boolean
  usuarioquedada?: UsuarioQuedada[]
  puntuaciones?: Puntuacion[]
}

// Interfaz para filtros
export interface FilterParams {
  nombre?: string
  creador?: number
  localizacion?: string
  fecha?: string
  fecha_desde?: string
  hora_inicio?: string
  hora_finalizacion?: string
  hora_actual?: string
  hora_desde_hoy?: string
  competitividad?: boolean
  puntuacion_competitiva_objetiva?: number
  local?: number | string
  deporte?: number | string
  usuarioquedada?: number[]
  abierta?: boolean
  id?: number
}

// DTOs para unirse y salirse de una quedada
export interface UnirseQuedadaDto {
  usuario: number
  equipo: number
  quedada: number
}

export interface SalirseQuedadaDto {
  usuario: number
  equipo: number
  quedada: number
}

// DTO para reportar una quedada
export interface ReportarQuedadaDto {
  razon: string
  usuario: Usuario | number
  quedada: { id: number } | number
}

// Interfaz para las razones de reporte
export interface ReportReason {
  id: string
  label: string
}

// Callback para notificar cambios en las quedadas
type OnMeetingsChangedCallback = () => void

/**
 * Servicio para buscar y filtrar quedadas
 */
class SearchMeetingsService {
  // Cache para deportes, establecimientos y quedadas
  _cachedSports: Deporte[] = []
  _cachedEstablishments: Local[] = []
  _cachedMeetings: Quedada[] = []
  _lastFetchTime = 0
  _cacheExpirationTime: number = 60 * 1000 // 1 minuto en milisegundos
  _lastReloadTime = 0
  _reloadThrottleTime = 5000 // 5 segundos entre recargas

  // Añadir estas propiedades al objeto SearchMeetingsService
  _lastMeetingsIds: Set<number> = new Set<number>()
  _checkInterval = 5000 // 5 segundos entre verificaciones

  // Callbacks para notificar cambios
  _onMeetingsChangedCallbacks: OnMeetingsChangedCallback[] = []

  // Sistema de bloqueo para operaciones concurrentes
  _activeOperations: Map<string, boolean> = new Map()
  _operationTimeouts: Map<string, NodeJS.Timeout> = new Map()
  _operationTimeout = 10000 // 10 segundos de timeout para operaciones

  // Flag para controlar si se deben mostrar todas las quedadas o solo las futuras
  _showAllMeetings = true // Cambiado a true para mostrar todas las quedadas

  // Razones de reporte estáticas
  private readonly STATIC_REPORT_REASONS: ReportReason[] = [
    { id: "comportamiento_inadecuado", label: "Comportamiento inadecuado" },
    { id: "no_asistencia", label: "No asistencia a la quedada" },
    { id: "informacion_falsa", label: "Información falsa en la descripción" },
    { id: "incumplimiento_normas", label: "Incumplimiento de las normas" },
    { id: "contenido_inapropiado", label: "Contenido inapropiado" },
  ]

  // Rango de puntuación competitiva para filtrado por similitud
  _competitivePointsRange = 100

  /**
   * Establece el rango de puntuación competitiva para filtrado por similitud
   * @param range Rango de puntos (por defecto 100)
   */
  setCompetitivePointsRange(range: number): void {
    this._competitivePointsRange = range
    console.log(`Rango de puntuación competitiva establecido a: ${range}`)
  }

  /**
   * Obtiene el rango de puntuación competitiva actual
   */
  getCompetitivePointsRange(): number {
    return this._competitivePointsRange
  }

  /**
   * SOLUCIÓN DEFINITIVA: Método para obtener una instancia autenticada de axios
   * Este método es público y puede ser llamado desde cualquier componente
   */
  async getAuthenticatedAxios() {
    try {
      console.log("🔐 Obteniendo instancia autenticada de axios...")
      const token = await UserService.getAccessToken()

      if (!token) {
        console.error("❌ No hay token de autenticación disponible")
        throw new Error("No hay token de autenticación disponible. Por favor inicia sesión nuevamente.")
      }

      console.log("✅ Token obtenido correctamente")

      return axios.create({
        baseURL: API_URL,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error("❌ Error al obtener instancia autenticada de axios:", error)
      throw new Error("Error de autenticación. Por favor inicia sesión nuevamente.")
    }
  }

  /**
   * Adquiere un bloqueo para una operación específica
   * @param operationKey Clave única para la operación (ej: "join_meeting_1_team_2")
   * @returns true si se pudo adquirir el bloqueo, false si ya está bloqueado
   */
  acquireLock(operationKey: string): boolean {
    // Si ya hay una operación activa con esta clave, no permitir otra
    if (this._activeOperations.get(operationKey)) {
      console.log(`🔒 Operación ${operationKey} ya está en progreso, bloqueando nueva solicitud`)
      return false
    }

    console.log(`🔓 Adquiriendo bloqueo para operación ${operationKey}`)
    this._activeOperations.set(operationKey, true)

    // Establecer un timeout para liberar el bloqueo automáticamente después de un tiempo
    const timeoutId = setTimeout(() => {
      console.log(`⏱️ Timeout para operación ${operationKey}, liberando bloqueo automáticamente`)
      this.releaseLock(operationKey)
    }, this._operationTimeout)

    this._operationTimeouts.set(operationKey, timeoutId)
    return true
  }

  /**
   * Libera un bloqueo para una operación específica
   * @param operationKey Clave única para la operación
   */
  releaseLock(operationKey: string): void {
    console.log(`🔓 Liberando bloqueo para operación ${operationKey}`)
    this._activeOperations.set(operationKey, false)

    // Limpiar el timeout si existe
    const timeoutId = this._operationTimeouts.get(operationKey)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this._operationTimeouts.delete(operationKey)
    }
  }

  /**
   * Registra un callback para ser notificado cuando cambian las quedadas
   */
  registerOnMeetingsChangedCallback(callback: OnMeetingsChangedCallback): void {
    this._onMeetingsChangedCallbacks.push(callback)
    console.log(`🔔 Callback registrado. Total: ${this._onMeetingsChangedCallbacks.length}`)
  }

  /**
   * Elimina un callback registrado
   */
  unregisterOnMeetingsChangedCallback(callback: OnMeetingsChangedCallback): void {
    const index = this._onMeetingsChangedCallbacks.indexOf(callback)
    if (index !== -1) {
      this._onMeetingsChangedCallbacks.splice(index, 1)
      console.log(`🔕 Callback eliminado. Quedan: ${this._onMeetingsChangedCallbacks.length}`)
    }
  }

  /**
   * Notifica a todos los callbacks registrados que las quedadas han cambiado
   */
  notifyMeetingsChanged(): void {
    console.log(`📢 Notificando a ${this._onMeetingsChangedCallbacks.length} callbacks sobre cambios en las quedadas`)
    this._onMeetingsChangedCallbacks.forEach((callback) => {
      try {
        callback()
      } catch (error) {
        console.error("❌ Error al ejecutar callback de cambio de quedadas:", error)
      }
    })
  }

  /**
   * Verifica si se puede realizar una recarga (throttle)
   */
  canReload(): boolean {
    const now = Date.now()
    return now - this._lastReloadTime >= this._reloadThrottleTime
  }

  /**
   * Limpia la caché de quedadas
   */
  clearCache(): void {
    this._cachedMeetings = []
    this._lastFetchTime = 0
    console.log("🧹 Caché de quedadas limpiada")
  }

  /**
   * Verifica si la caché ha expirado
   */
  isCacheExpired(): boolean {
    const now = Date.now()
    return now - this._lastFetchTime > this._cacheExpirationTime
  }

  /**
   * Obtiene todas las quedadas abiertas directamente de la base de datos
   * Fuerza una recarga completa ignorando la caché
   */
  async forceReloadAllMeetings(): Promise<Quedada[]> {
    try {
      // Verificar si se puede realizar una recarga (throttle)
      if (!this.canReload()) {
        console.log("⏱️ Recarga limitada por throttle. Usando datos en caché.")
        return this._cachedMeetings.length > 0 ? this._cachedMeetings : []
      }

      console.log("🔄 Forzando recarga de todas las quedadas desde la API...")

      // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
      const api = await this.getAuthenticatedAxios()

      // Usar el endpoint de filtrado sin parámetros para obtener todas las quedadas abiertas
      const response = await api.post("/quedada/filtrar", {})

      if (Array.isArray(response.data)) {
        console.log(`✅ Obtenidas ${response.data.length} quedadas desde la API (recarga forzada)`)

        // Actualizar la caché
        this._cachedMeetings = response.data
        this._lastFetchTime = Date.now()
        this._lastReloadTime = Date.now()

        // Notificar a los observadores que los datos han cambiado
        this.notifyMeetingsChanged()

        return response.data
      }

      console.error("❌ La respuesta de /quedada/filtrar no es un array")
      return []
    } catch (error) {
      console.error("❌ Error al obtener quedadas (recarga forzada):", error)
      return []
    }
  }

  /**
   * Obtiene todas las quedadas abiertas
   */
  async getAllMeetings(forceRefresh = false): Promise<Quedada[]> {
    try {
      // Si se solicita forzar la actualización, usar el método de recarga forzada
      if (forceRefresh) {
        return this.forceReloadAllMeetings()
      }

      // Si tenemos quedadas en caché y no ha expirado, devolverlas
      if (this._cachedMeetings.length > 0 && !this.isCacheExpired()) {
        console.log(`📋 Devolviendo ${this._cachedMeetings.length} quedadas desde caché`)
        return this._cachedMeetings
      }

      console.log("🔍 Obteniendo todas las quedadas desde la API...")

      // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
      const api = await this.getAuthenticatedAxios()

      // Usar el endpoint de filtrado sin parámetros para obtener todas las quedadas abiertas
      const response = await api.post("/quedada/filtrar", {})

      if (Array.isArray(response.data)) {
        console.log(`✅ Obtenidas ${response.data.length} quedadas desde la API`)

        // Actualizar la caché
        this._cachedMeetings = response.data
        this._lastFetchTime = Date.now()

        return response.data
      }

      console.error("❌ La respuesta de /quedada/filtrar no es un array")
      return []
    } catch (error) {
      console.error("❌ Error al obtener quedadas:", error)

      // Si hay un error pero tenemos quedadas en caché, devolverlas como fallback
      if (this._cachedMeetings.length > 0) {
        console.log("⚠️ Devolviendo quedadas desde caché como fallback debido a error")
        return this._cachedMeetings
      }

      return []
    }
  }

  /**
   * Obtiene todos los deportes disponibles
   */
  async getAllSports(): Promise<Deporte[]> {
    try {
      // Si tenemos deportes en caché, devolverlos
      if (this._cachedSports.length > 0) {
        console.log(`📋 Devolviendo ${this._cachedSports.length} deportes desde caché`)
        return this._cachedSports
      }

      console.log("🔍 Obteniendo todos los deportes desde la API...")

      // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
      const api = await this.getAuthenticatedAxios()

      // Modificado: Usar el endpoint correcto que existe en el controlador
      const response = await api.get("/deporte")

      if (Array.isArray(response.data)) {
        console.log(`✅ Obtenidos ${response.data.length} deportes desde la API`)

        // Actualizar la caché
        this._cachedSports = response.data
        return response.data
      }

      console.error("❌ La respuesta de /deporte no es un array")
      return []
    } catch (error) {
      console.error("❌ Error al obtener deportes:", error)
      return []
    }
  }

  /**
   * Obtiene todos los establecimientos disponibles
   */
  async getAllEstablishments(): Promise<Local[]> {
    try {
      // Si tenemos establecimientos en caché, devolverlos
      if (this._cachedEstablishments.length > 0) {
        console.log(`📋 Devolviendo ${this._cachedEstablishments.length} establecimientos desde caché`)
        return this._cachedEstablishments
      }

      console.log("🔍 Obteniendo todos los establecimientos desde la API...")

      // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
      const api = await this.getAuthenticatedAxios()

      // Modificado: Usar el endpoint correcto que existe en el controlador
      const response = await api.get("/local")

      if (Array.isArray(response.data)) {
        console.log(`✅ Obtenidos ${response.data.length} establecimientos desde la API`)

        // Actualizar la caché
        this._cachedEstablishments = response.data
        return response.data
      }

      console.error("❌ La respuesta de /local no es un array")
      return []
    } catch (error) {
      console.error("❌ Error al obtener establecimientos:", error)
      return []
    }
  }

  /**
   * Obtiene una quedada por su ID con opción de forzar recarga desde la base de datos
   */
  async getMeetingById(id: number, forceRefresh = false): Promise<Quedada | null> {
    try {
      // SOLUCIÓN: Verificar que el ID sea válido antes de continuar
      if (id === undefined || id === null || isNaN(Number(id))) {
        console.error(`❌ ID de quedada inválido: ${id}`)
        return null
      }

      // Convertir a número para asegurar que es un ID válido
      const idNum = Number(id)

      console.log(`🔍 Buscando quedada con ID ${idNum}${forceRefresh ? " (forzando recarga)" : ""}`)

      // Si no se solicita forzar la recarga, verificar primero en la caché
      if (!forceRefresh) {
        const cachedMeeting = this._cachedMeetings.find((m) => m.id === id)
        if (cachedMeeting) {
          console.log(`📋 Quedada con ID ${id} encontrada en caché`)
          return cachedMeeting
        }
      } else {
        console.log(`🔄 Forzando recarga desde base de datos para quedada ${id}`)
      }

      try {
        // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
        const api = await this.getAuthenticatedAxios()

        // IMPORTANTE: NUNCA usar el endpoint directo /quedada/{id} que causa error 404
        // Usar EXCLUSIVAMENTE el endpoint de filtrado que funciona correctamente
        console.log(`📡 Consultando API para quedada ${id} con filtro exacto`)

        // Intentar primero con filtro exacto
        const filterResponse = await api.post("/quedada/filtrar", { id: id })

        if (filterResponse.data && Array.isArray(filterResponse.data)) {
          console.log(`✅ API devolvió ${filterResponse.data.length} quedadas para filtro id=${id}`)

          // Buscar exactamente la quedada con el ID solicitado
          const exactMatch = filterResponse.data.find((m) => m.id === id)

          if (exactMatch) {
            console.log(`✅ Quedada ${id} encontrada exactamente en la respuesta`)

            // Actualizar caché solo si no se forzó la recarga
            if (!forceRefresh) {
              const existingIndex = this._cachedMeetings.findIndex((m) => m.id === id)
              if (existingIndex === -1) {
                this._cachedMeetings.push(exactMatch)
              } else {
                this._cachedMeetings[existingIndex] = exactMatch
              }
            }

            return exactMatch
          } else if (filterResponse.data.length > 0) {
            console.log(`⚠️ API devolvió quedadas pero ninguna coincide con ID ${id}`)
            console.log(`⚠️ IDs devueltos: ${filterResponse.data.map((m) => m.id).join(", ")}`)
          }
        }

        // Si no se encontró, intentar con todas las quedadas
        console.log(`🔄 Buscando quedada ${id} en todas las quedadas`)
        const allMeetingsResponse = await api.post("/quedada/filtrar", {})

        if (allMeetingsResponse.data && Array.isArray(allMeetingsResponse.data)) {
          console.log(`✅ API devolvió ${allMeetingsResponse.data.length} quedadas totales`)

          // Actualizar la caché con todas las quedadas
          this._cachedMeetings = allMeetingsResponse.data
          this._lastFetchTime = Date.now()

          // Buscar la quedada con el ID exacto
          const exactMatch = allMeetingsResponse.data.find((m) => m.id === id)

          if (exactMatch) {
            console.log(`✅ Quedada ${id} encontrada en la lista completa`)
            return exactMatch
          }

          // Si aún no se encuentra, intentar buscar por ID como string
          const stringMatch = allMeetingsResponse.data.find((m) => String(m.id) === String(id))
          if (stringMatch) {
            console.log(`✅ Quedada ${id} encontrada en la lista completa (comparando como string)`)
            return stringMatch
          }
        }

        // Último intento: buscar con un filtro más amplio
        console.log(`🔄 Último intento: buscando quedada ${id} con filtros más amplios`)
        const looseFilterResponse = await api.post("/quedada/filtrar", {
          // No incluir el ID para obtener todas las quedadas
        })

        if (looseFilterResponse.data && Array.isArray(looseFilterResponse.data)) {
          // Buscar la quedada con el ID exacto
          const looseMatch = looseFilterResponse.data.find((m) => m.id === id || String(m.id) === String(id))
          if (looseMatch) {
            console.log(`✅ Quedada ${id} encontrada con filtro amplio`)
            return looseMatch
          }
        }

        console.log(`❌ No se encontró la quedada ${id} después de intentar todas las estrategias`)
        return null
      } catch (error) {
        console.error(`❌ Error al consultar API para quedada ${id}:`, error)
        throw new Error(
          `Error al obtener datos de la quedada: ${error instanceof Error ? error.message : "Error desconocido"}`,
        )
      }
    } catch (error) {
      console.error(`❌ Error al obtener quedada ${id}:`, error)
      throw error
    }
  }

  /**
   * Verifica si un equipo está lleno consultando directamente la base de datos
   */
  async isTeamFull(meetingId: number, teamId: number): Promise<boolean> {
    try {
      console.log(`🔍 Verificando capacidad del equipo ${teamId} en quedada ${meetingId}`)

      // Obtener datos frescos de la base de datos, no usar caché
      console.log(`📡 Consultando base de datos para quedada ${meetingId}`)
      const meetingData = await this.getMeetingById(meetingId, true)

      if (!meetingData || !meetingData.deporte || !meetingData.usuarioquedada) {
        console.log(`❌ Datos incompletos para verificar equipo ${teamId}`)
        return true // Por seguridad, asumimos que está lleno
      }

      // Obtener el número máximo de jugadores por equipo
      const maxPlayersPerTeam = meetingData.deporte.numero_jugadores || 5

      // Contar jugadores en el equipo
      const playersInTeam = meetingData.usuarioquedada.filter((uq) => uq.equipo === teamId).length

      // Determinar si el equipo está lleno
      const isFull = playersInTeam >= maxPlayersPerTeam

      console.log(
        `📊 Equipo ${teamId}: ${playersInTeam}/${maxPlayersPerTeam} jugadores - ${isFull ? "❌ LLENO" : "✅ DISPONIBLE"}`,
      )

      return isFull
    } catch (error) {
      console.error(`❌ Error al verificar equipo ${teamId}:`, error)
      return true // Por seguridad, asumimos que está lleno
    }
  }

  /**
   * Formatea una fecha para mostrar en formato DD/MM/YYYY HH:MM:SS (formato 24 horas)
   */
  formatDateTimeForDisplay(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }

  /**
   * Añade un día a los componentes de fecha y muestra el resultado
   * @param year Año
   * @param month Mes (1-12)
   * @param day Día
   * @param hour Hora
   * @param minute Minuto
   */
  addOneDayAndLog(year: number, month: number, day: number, hour: number, minute: number): void {
    console.log(
      `📅 COMPONENTES ORIGINALES: Año: ${year}, Mes: ${month}, Día: ${day}, Hora: ${hour}, Minutos: ${minute}`,
    )

    // Crear fecha con los componentes
    const originalDate = new Date(year, month - 1, day, hour, minute)
    console.log(`📅 FECHA ORIGINAL: ${originalDate.toISOString()}`)

    // Añadir un día
    const adjustedDate = new Date(originalDate)
    adjustedDate.setDate(adjustedDate.getDate() + 1)

    // Extraer componentes de la fecha ajustada
    const adjustedYear = adjustedDate.getFullYear()
    const adjustedMonth = adjustedDate.getMonth() + 1 // Convertir de 0-11 a 1-12
    const adjustedDay = adjustedDate.getDate()
    const adjustedHour = adjustedDate.getHours()
    const adjustedMinute = adjustedDate.getMinutes()

    console.log(
      `📅 COMPONENTES AJUSTADOS (+1 día): Año: ${adjustedYear}, Mes: ${adjustedMonth}, Día: ${adjustedDay}, Hora: ${adjustedHour}, Minutos: ${adjustedMinute}`,
    )
    console.log(`📅 FECHA AJUSTADA: ${adjustedDate.toISOString()}`)

    // Crear fecha en formato ISO para comparación
    const isoDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour
      .toString()
      .padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00.000Z`
    console.log(`📅 FECHA ISO ORIGINAL: ${isoDate}`)

    // Crear fecha ajustada en formato ISO
    const adjustedIsoDate = `${adjustedYear}-${adjustedMonth.toString().padStart(2, "0")}-${adjustedDay
      .toString()
      .padStart(
        2,
        "0",
      )}T${adjustedHour.toString().padStart(2, "0")}:${adjustedMinute.toString().padStart(2, "0")}:00.000Z`
    console.log(`📅 FECHA ISO AJUSTADA (+1 día): ${adjustedIsoDate}`)
  }

  /**
   * Filtra quedadas para mostrar solo las que aún no han comenzado
   * Compara la fecha y hora de inicio de la quedada con la hora actual en Madrid (UTC+2)
   * NOTA: Esta función ahora devuelve todas las quedadas si _showAllMeetings es true
   */
  filterFutureMeetings(meetings: Quedada[]): Quedada[] {
    console.log("⚠️ ADVERTENCIA: filterFutureMeetings está obsoleto. Todo el filtrado debe hacerse en el servidor.")
    return meetings // Devolver las reuniones sin filtrar localmente
  }

  /**
   * Filtra quedadas según los criterios especificados
   */
  async filterMeetings(filters: FilterParams): Promise<Quedada[]> {
    try {
      // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
      const api = await this.getAuthenticatedAxios()

      // Si no hay filtros, devolver todas las quedadas abiertas
      if (Object.keys(filters).length === 0) {
        return this.getAllMeetings()
      }

      // Obtener la fecha actual para filtrar solo quedadas desde hoy
      const today = new Date()
      const formattedToday = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`

      // Asegurar que solo se muestran quedadas abiertas y con fecha desde hoy
      const enhancedFilters = {
        ...filters,
        abierta: true,
      }

      // Si no se especifica una fecha específica, filtrar desde hoy
      if (!filters.fecha) {
        enhancedFilters.fecha_desde = formattedToday
      }

      // Si tenemos la hora actual, usarla para filtrar quedadas cuya hora de inicio no ha pasado
      if (filters.hora_actual && !filters.fecha) {
        enhancedFilters.hora_desde_hoy = filters.hora_actual
        console.log(`🔍 FILTRADO: Aplicando filtro de hora desde: ${filters.hora_actual} para la fecha de hoy`)
      }

      console.log(`🔍 Filtrando quedadas con criterios: ${JSON.stringify(enhancedFilters)}`)

      // Intentar con el endpoint de filtrado
      const response = await api.post("/quedada/filtrar", enhancedFilters)

      // Verificar que la respuesta sea un array
      if (Array.isArray(response.data)) {
        console.log(`✅ Obtenidas ${response.data.length} quedadas filtradas`)

        // Devolver todas las quedadas sin filtrar por fecha
        return response.data
      }

      console.log("❌ La respuesta de filtrado no es un array")
      return []
    } catch (error) {
      console.error("❌ Error al filtrar quedadas:", error)
      return []
    }
  }

  /**
   * Filtra quedadas por cercanía en puntuación competitiva
   * @param userCompetitivePoints Puntuación competitiva del usuario
   * @returns Quedadas filtradas por cercanía en puntuación competitiva
   */
  async filterMeetingsByCompetitiveRange(userCompetitivePoints: number): Promise<Quedada[]> {
    try {
      console.log(
        `🔍 Filtrando quedadas por cercanía en puntuación competitiva: ${userCompetitivePoints} ± ${this._competitivePointsRange}`,
      )

      // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
      const api = await this.getAuthenticatedAxios()

      // Crear filtros para la API
      const filters = {
        abierta: true,
        competitividad: true, // Solo quedadas competitivas
        puntuacion_competitiva_objetiva: userCompetitivePoints,
        // El backend ya maneja el rango internamente (±100 por defecto)
      }

      console.log(`🔍 Enviando filtros al servidor: ${JSON.stringify(filters)}`)

      // Llamar al endpoint de filtrado
      const response = await api.post("/quedada/filtrar", filters)

      // Verificar que la respuesta sea un array
      if (Array.isArray(response.data)) {
        console.log(`✅ Obtenidas ${response.data.length} quedadas con puntuación competitiva similar`)

        // Filtrar solo quedadas dentro del rango de puntos
        const now = new Date()
        const filteredData = response.data.filter((meeting) => {
          // Verificar que la quedada sea futura
          const meetingDate = new Date(meeting.fecha)
          const [hours, minutes] = meeting.hora_inicio.split(":").map(Number)
          meetingDate.setHours(hours, minutes, 0, 0)

          // Solo devolver quedadas futuras
          return meetingDate >= now
        })

        console.log(`✅ Después de filtrar por fecha: ${filteredData.length} quedadas dentro del rango de puntos`)
        return filteredData
      }

      console.log("❌ La respuesta de filtrado por puntuación competitiva no es un array")
      return []
    } catch (error) {
      console.error("❌ Error al filtrar quedadas por puntuación competitiva:", error)
      return []
    }
  }

  /**
   * Verifica si el usuario actual está unido a una quedada
   */
  async isUserJoinedToMeeting(quedadaId: number): Promise<boolean> {
    try {
      // Obtener el usuario actual
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        console.error("❌ No hay usuario autenticado")
        return false
      }

      try {
        // Obtener la quedada completa con datos frescos
        const meeting = await this.getMeetingById(quedadaId, true)
        if (!meeting || !meeting.usuarioquedada) {
          return false
        }

        // Verificar si el usuario está en la lista de participantes
        const isJoined = meeting.usuarioquedada.some((uq) => uq.usuario.id === currentUser.id)
        console.log(`👤 Usuario ${isJoined ? "✅ UNIDO" : "❌ NO UNIDO"} a quedada ${quedadaId}`)
        return isJoined
      } catch (error) {
        console.error("❌ Error al verificar participación:", error)
        return false
      }
    } catch (error) {
      console.error("❌ Error al verificar si el usuario está unido a la quedada:", error)
      return false
    }
  }

  /**
   * Obtiene el equipo del usuario en una quedada
   */
  async getUserTeamInMeeting(quedadaId: number): Promise<number | null> {
    try {
      // Obtener el usuario actual
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        console.error("❌ No hay usuario autenticado")
        return null
      }

      // Obtener la quedada completa con datos frescos
      const meeting = await this.getMeetingById(quedadaId, true)
      if (!meeting || !meeting.usuarioquedada) {
        return null
      }

      // Buscar al usuario en la lista de participantes
      const userInMeeting = meeting.usuarioquedada.find((uq) => uq.usuario.id === currentUser.id)
      if (userInMeeting) {
        const teamId = userInMeeting.equipo || 1
        console.log(`👤 Usuario está en equipo ${teamId} en quedada ${quedadaId}`)
        return teamId
      }

      console.log(`👤 Usuario no está en ningún equipo en quedada ${quedadaId}`)
      return null
    } catch (error) {
      console.error("❌ Error al obtener el equipo del usuario:", error)
      return null
    }
  }

  /**
   * Unirse a una quedada
   */
  async joinMeeting(quedadaId: number): Promise<boolean> {
    try {
      // Obtener el usuario actual
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        console.error("❌ No hay usuario autenticado")
        return false
      }

      // Intentar adquirir el bloqueo para esta operación
      const operationKey = `join_meeting_${quedadaId}`
      if (!this.acquireLock(operationKey)) {
        console.error(`🔒 No se puede unir: operación bloqueada para quedada ${quedadaId}`)
        return false
      }

      try {
        console.log(`🔄 Usuario ${currentUser.id} intentando unirse a la quedada ${quedadaId}`)

        // Verificar si ya está unido
        const alreadyJoined = await this.isUserJoinedToMeeting(quedadaId)
        if (alreadyJoined) {
          console.log(`ℹ️ El usuario ${currentUser.id} ya está unido a la quedada ${quedadaId}`)
          return true
        }

        // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
        const api = await this.getAuthenticatedAxios()

        // Crear el DTO para unirse
        const unirseDto: UnirseQuedadaDto = {
          usuario: currentUser.id,
          equipo: 1, // Equipo por defecto
          quedada: quedadaId,
        }

        // Llamar al endpoint para unirse
        await api.post("/usuarioquedada/unirse", unirseDto)

        console.log(`✅ Usuario ${currentUser.id} se ha unido exitosamente a la quedada ${quedadaId}`)

        // Limpiar caché y forzar recarga de datos
        this.clearCache()
        await this.forceReloadAllMeetings()

        return true
      } finally {
        // Liberar el bloqueo al finalizar
        this.releaseLock(operationKey)
      }
    } catch (error) {
      console.error("❌ Error al unirse a la quedada:", error)

      // Verificar si el error es porque el usuario ya está unido
      if (
        axios.isAxiosError(error) &&
        (error.response?.data?.mensaje?.includes("ya está unido") || error.response?.status === 409)
      ) {
        console.log("ℹ️ El usuario ya está unido a esta quedada")
        return true
      }

      return false
    }
  }

  /**
   * Unirse a una quedada especificando el equipo
   */
  async joinMeetingWithTeam(quedadaId: number, equipoId: number): Promise<boolean> {
    try {
      // Obtener el usuario actual
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        console.error("❌ No hay usuario autenticado")
        return false
      }

      // Intentar adquirir el bloqueo para esta operación específica de equipo
      const operationKey = `join_meeting_${quedadaId}_team_${equipoId}`
      if (!this.acquireLock(operationKey)) {
        console.error(`🔒 No se puede unir: operación bloqueada para quedada ${quedadaId} equipo ${equipoId}`)
        throw new Error("equipo completo")
      }

      try {
        console.log(`🔄 Usuario ${currentUser.id} intentando unirse a la quedada ${quedadaId} en el equipo ${equipoId}`)

        // IMPORTANTE: Obtener datos frescos de la quedada para verificar capacidad
        const meetingData = await this.getMeetingById(quedadaId, true)
        if (!meetingData || !meetingData.deporte || !meetingData.usuarioquedada) {
          console.error("❌ No se pudo obtener datos actualizados de la quedada")
          return false
        }

        // Verificar capacidad total del equipo
        const playersPerTeam = meetingData.deporte.numero_jugadores || 5
        const playersInTeam = meetingData.usuarioquedada.filter((uq) => uq.equipo === equipoId).length

        // Verificar si el equipo está lleno con datos frescos
        if (playersInTeam >= playersPerTeam) {
          console.log(`🚫 No se puede unir: equipo ${equipoId} está lleno (${playersInTeam}/${playersPerTeam})`)
          throw new Error("equipo completo")
        }

        console.log(`✅ Equipo ${equipoId} tiene espacio: ${playersInTeam}/${playersPerTeam} jugadores`)

        // Verificar si ya está unido
        const alreadyJoined = await this.isUserJoinedToMeeting(quedadaId)
        if (alreadyJoined) {
          console.log(
            `ℹ️ El usuario ${currentUser.id} ya está unido a la quedada ${quedadaId}. Intentando cambiar de equipo.`,
          )

          // Si ya está unido, primero salir de la quedada
          await this.leaveMeeting(quedadaId)
        }

        // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
        const api = await this.getAuthenticatedAxios()

        // Crear el DTO para unirse
        const unirseDto: UnirseQuedadaDto = {
          usuario: currentUser.id,
          equipo: equipoId,
          quedada: quedadaId,
        }

        try {
          // Llamar al endpoint para unirse
          const response = await api.post("/usuarioquedada/unirse", unirseDto)

          // Verificar si la respuesta indica éxito
          if (response.status >= 200 && response.status < 300) {
            console.log(
              `✅ Usuario ${currentUser.id} se ha unido exitosamente a la quedada ${quedadaId} en el equipo ${equipoId}`,
            )

            // Limpiar caché y forzar recarga de datos
            this.clearCache()
            await this.forceReloadAllMeetings()

            return true
          } else {
            console.error(`❌ Error al unirse: respuesta con código ${response.status}`)
            return false
          }
        } catch (error) {
          // Verificar si el error es porque el equipo está lleno
          if (axios.isAxiosError(error) && error.response?.data?.mensaje?.includes("equipo completo")) {
            console.log(`🚫 El servidor rechazó la unión porque el equipo ${equipoId} está lleno`)
            throw new Error("equipo completo")
          }

          // Verificar si el error es porque el usuario ya está unido
          if (
            axios.isAxiosError(error) &&
            (error.response?.data?.mensaje?.includes("ya está unido") || error.response?.status === 409)
          ) {
            console.log("ℹ️ El usuario ya está unido a esta quedada")
            return true
          }

          console.error("❌ Error al unirse a la quedada con equipo específico:", error)
          return false
        }
      } finally {
        // Liberar el bloqueo al finalizar
        this.releaseLock(operationKey)
      }
    } catch (error) {
      console.error("❌ Error al unirse a la quedada con equipo específico:", error)

      // Reenviar el error específico de equipo completo
      if (error instanceof Error && error.message === "equipo completo") {
        throw error
      }

      return false
    }
  }

  /**
   * Salirse de una quedada
   */
  async leaveMeeting(quedadaId: number): Promise<boolean> {
    try {
      // Obtener el usuario actual
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        console.error("❌ No hay usuario autenticado")
        return false
      }

      // Intentar adquirir el bloqueo para esta operación
      const operationKey = `leave_meeting_${quedadaId}`
      if (!this.acquireLock(operationKey)) {
        console.error(`🔒 No se puede salir: operación bloqueada para quedada ${quedadaId}`)
        return false
      }

      try {
        console.log(`🔄 Usuario ${currentUser.id} intentando salirse de la quedada ${quedadaId}`)

        // Verificar si el usuario está unido
        const isJoined = await this.isUserJoinedToMeeting(quedadaId)
        if (!isJoined) {
          console.log(`ℹ️ El usuario ${currentUser.id} no está unido a la quedada ${quedadaId}`)
          return true
        }

        // Obtener el equipo actual del usuario
        const currentTeamId = await this.getUserTeamInMeeting(quedadaId)
        if (currentTeamId === null) {
          console.error(
            `❌ No se pudo determinar el equipo actual del usuario ${currentUser.id} en la quedada ${quedadaId}`,
          )
          return false
        }

        console.log(`👤 Usuario ${currentUser.id} está en el equipo ${currentTeamId} de la quedada ${quedadaId}`)

        // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
        const api = await this.getAuthenticatedAxios()

        // Crear el DTO para salir con el equipo correcto
        const salirseDto: SalirseQuedadaDto = {
          usuario: currentUser.id,
          equipo: currentTeamId, // Usar el equipo actual del usuario
          quedada: quedadaId,
        }

        // Llamar al endpoint para salir
        await api.post("/usuarioquedada/salirse", salirseDto)

        console.log(
          `✅ Usuario ${currentUser.id} se ha salido exitosamente de la quedada ${quedadaId} (equipo ${currentTeamId})`,
        )

        // Limpiar caché y forzar recarga de datos
        this.clearCache()
        await this.forceReloadAllMeetings()

        return true
      } finally {
        // Liberar el bloqueo al finalizar
        this.releaseLock(operationKey)
      }
    } catch (error) {
      console.error("❌ Error al salirse de la quedada:", error)

      // Verificar si el error es porque el usuario no está unido
      if (
        axios.isAxiosError(error) &&
        (error.response?.data?.mensaje?.includes("no está unido") || error.response?.status === 404)
      ) {
        console.log("ℹ️ El usuario no está unido a esta quedada")
        return true
      }

      return false
    }
  }

  /**
   * Cambia el equipo de un usuario en una quedada
   */
  async changeTeam(quedadaId: number, newTeamId: number): Promise<boolean> {
    try {
      // Obtener el usuario actual
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        console.error("❌ No hay usuario autenticado")
        return false
      }

      // Intentar adquirir el bloqueo para esta operación específica de cambio de equipo
      const operationKey = `change_team_${quedadaId}_to_${newTeamId}`
      if (!this.acquireLock(operationKey)) {
        console.error(`🔒 No se puede cambiar: operación bloqueada para quedada ${quedadaId} equipo ${newTeamId}`)
        throw new Error("equipo completo")
      }

      try {
        // Verificar si el usuario está unido a la quedada
        const isJoined = await this.isUserJoinedToMeeting(quedadaId)
        if (!isJoined) {
          console.error(`❌ El usuario ${currentUser.id} no está unido a la quedada ${quedadaId}`)
          return false
        }

        // Verificar si el equipo está lleno
        const isTeamFullFromDB = await this.isTeamFull(quedadaId, newTeamId)
        if (isTeamFullFromDB) {
          console.log(`🚫 No se puede cambiar: equipo ${newTeamId} está lleno según base de datos`)
          throw new Error("equipo completo")
        }

        // Obtener el equipo actual del usuario
        const currentTeamId = await this.getUserTeamInMeeting(quedadaId)
        if (currentTeamId === null) {
          console.error(
            `❌ No se pudo determinar el equipo actual del usuario ${currentUser.id} en la quedada ${quedadaId}`,
          )
          return false
        }

        // Si el usuario ya está en el equipo solicitado, no es necesario cambiar
        if (currentTeamId === newTeamId) {
          console.log(`ℹ️ El usuario ${currentUser.id} ya está en el equipo ${newTeamId} de la quedada ${quedadaId}`)
          return true
        }

        console.log(
          `🔄 Cambiando al usuario ${currentUser.id} del equipo ${currentTeamId} al equipo ${newTeamId} en la quedada ${quedadaId}`,
        )

        // Implementar el cambio como una salida y una nueva unión
        try {
          // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
          const api = await this.getAuthenticatedAxios()

          // 1. Crear el DTO para salir con el equipo correcto
          const salirseDto: SalirseQuedadaDto = {
            usuario: currentUser.id,
            equipo: currentTeamId, // Usar el equipo actual
            quedada: quedadaId,
          }

          // Llamar al endpoint para salir
          await api.post("/usuarioquedada/salirse", salirseDto)
          console.log(
            `✅ Usuario ${currentUser.id} se ha salido temporalmente del equipo ${currentTeamId} en la quedada ${quedadaId}`,
          )

          // Verificar nuevamente si el equipo está lleno antes de unirse
          const isStillAvailable = !(await this.isTeamFull(quedadaId, newTeamId))
          if (!isStillAvailable) {
            console.log(`🚫 El equipo ${newTeamId} se ha llenado mientras se procesaba el cambio`)

            // Intentar volver al equipo original
            try {
              const rejoinDto: UnirseQuedadaDto = {
                usuario: currentUser.id,
                equipo: currentTeamId,
                quedada: quedadaId,
              }
              await api.post("/usuarioquedada/unirse", rejoinDto)
              console.log(`⚠️ Usuario ${currentUser.id} ha vuelto al equipo ${currentTeamId}`)
            } catch (rejoinError) {
              console.error("❌ Error al intentar volver al equipo original:", rejoinError)
            }

            throw new Error("equipo completo")
          }

          // 2. Unirse de nuevo con el nuevo equipo
          const unirseDto: UnirseQuedadaDto = {
            usuario: currentUser.id,
            equipo: newTeamId,
            quedada: quedadaId,
          }

          // Llamar al endpoint para unirse
          await api.post("/usuarioquedada/unirse", unirseDto)
          console.log(`✅ Usuario ${currentUser.id} se ha unido al equipo ${newTeamId} en la quedada ${quedadaId}`)

          // Limpiar caché y forzar recarga de datos
          this.clearCache()
          await this.forceReloadAllMeetings()

          return true
        } catch (error) {
          console.error("❌ Error durante el proceso de cambio de equipo:", error)

          // Verificar si el error es porque el equipo está lleno
          if (axios.isAxiosError(error) && error.response?.data?.mensaje?.includes("equipo completo")) {
            throw new Error("equipo completo")
          }

          // Intentar volver a unirse al equipo original si hubo un error
          try {
            // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
            const api = await this.getAuthenticatedAxios()

            const rejoinDto: UnirseQuedadaDto = {
              usuario: currentUser.id,
              equipo: currentTeamId,
              quedada: quedadaId,
            }
            await api.post("/usuarioquedada/unirse", rejoinDto)
            console.log(
              `⚠️ Usuario ${currentUser.id} ha vuelto al equipo ${currentTeamId} después de un error al cambiar de equipo`,
            )
          } catch (rejoinError) {
            console.error("❌ Error al intentar volver al equipo original:", rejoinError)
          }

          return false
        }
      } finally {
        // Liberar el bloqueo al finalizar
        this.releaseLock(operationKey)
      }
    } catch (error) {
      console.error("❌ Error al cambiar de equipo:", error)

      // Reenviar el error específico de equipo completo
      if (error instanceof Error && error.message === "equipo completo") {
        throw error
      }

      return false
    }
  }

  /**
   * Reporta una quedada
   */
  async reportMeeting(quedadaId: number, razon: string): Promise<boolean> {
    try {
      // Obtener el usuario actual
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        console.error("❌ No hay usuario autenticado")
        return false
      }

      // Verificar que el usuario esté unido a la quedada antes de reportar
      console.log(
        `🔍 Verificando si el usuario ${currentUser.id} está unido a la quedada ${quedadaId} antes de reportar`,
      )
      const isJoined = await this.isUserJoinedToMeeting(quedadaId)

      if (!isJoined) {
        console.error(`❌ Error: El usuario ${currentUser.id} intentó reportar la quedada ${quedadaId} sin estar unido`)
        throw new Error("Debes unirte a la quedada antes de poder reportarla")
      }

      console.log(`🔄 Usuario ${currentUser.id} reportando la quedada ${quedadaId} por: ${razon}`)

      // Usar el método getAuthenticatedAxios para obtener una instancia autenticada
      const api = await this.getAuthenticatedAxios()

      // Preparar los datos del reporte
      const reportData: ReportarQuedadaDto = {
        razon,
        usuario: currentUser,
        quedada: { id: quedadaId },
      }

      // Enviar el reporte al backend
      const response = await api.post("/reporte/crear", reportData)

      console.log("✅ Reporte enviado exitosamente:", response.data)
      return true
    } catch (error) {
      console.error("❌ Error al reportar quedada:", error)

      // Reenviar el error específico
      if (error instanceof Error) {
        throw error
      }

      return false
    }
  }

  /**
   * Obtiene las razones de reporte estáticas
   * @returns Array de razones de reporte
   */
  async getReportReasons(): Promise<ReportReason[]> {
    try {
      console.log("🔍 Obteniendo razones de reporte estáticas")

      // Devolver razones estáticas en lugar de consultar la base de datos
      return this.STATIC_REPORT_REASONS
    } catch (error) {
      console.error("❌ Error al obtener razones de reporte:", error)

      // En caso de error, devolver un conjunto básico de razones
      return [
        { id: "comportamiento_inadecuado", label: "Comportamiento inadecuado" },
        { id: "otro", label: "Otro motivo" },
      ]
    }
  }

  /**
   * Formatea fecha para mostrar (DD/MM/YYYY)
   */
  formatDateForDisplay(date: string): string {
    if (!date) return ""

    try {
      // Parse the date string
      const dateStr = date.includes("T") ? date : `${date}T00:00:00`
      const dateObj = new Date(dateStr)

      // Don't add one day - this was causing the display to be off by one day
      // dateObj.setDate(dateObj.getDate() + 1)

      const day = dateObj.getDate().toString().padStart(2, "0")
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0")
      const year = dateObj.getFullYear()

      return `${day}/${month}/${year}`
    } catch (error) {
      console.error("❌ Error al formatear fecha:", error)
      return date
    }
  }

  /**
   * Formatea hora para mostrar (HH:MM)
   */
  formatTimeForDisplay(time: string): string {
    if (!time) return ""

    try {
      // Asumiendo que la hora está en formato 24 horas (HH:MM:SS)
      const timeParts = time.split(":")
      if (timeParts.length < 2) return time

      return `${timeParts[0]}:${timeParts[1]}`
    } catch (error) {
      console.error("❌ Error al formatear hora:", error)
      return time
    }
  }

  /**
   * Formatea fecha para API (YYYY-MM-DD)
   */
  formatDateForApi(day: number, month: number, year: number): string {
    // Log the input values to debug
    console.log(`DEBUG formatDateForApi - Input values: day=${day}, month=${month}, year=${year}`)

    // month is already 0-based (0-11) from the date picker, so we need to add 1
    const formattedDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
    console.log(`DEBUG formatDateForApi - Formatted date: ${formattedDate}`)

    return formattedDate
  }

  /**
   * Compara dos fechas en formato YYYY-MM-DD para verificar si son el mismo día
   * Esta función es más robusta para comparar fechas independientemente de la zona horaria
   */
  areSameDates(date1: string, date2: string): boolean {
    if (!date1 || !date2) return false

    try {
      // Extraer solo la parte de la fecha (YYYY-MM-DD)
      const dateOnly1 = date1.split("T")[0]
      const dateOnly2 = date2.split("T")[0]

      console.log(`DEBUG areSameDates - Comparing: "${dateOnly1}" with "${dateOnly2}"`)

      // Comparación directa de las fechas sin añadir un día
      const result = dateOnly1 === dateOnly2
      console.log(`DEBUG areSameDates - Result: ${result}`)

      return result
    } catch (error) {
      console.error("❌ Error comparing dates:", error)
      // Fall back to simple string comparison if there's an error
      const date1Parts = date1.split("T")[0].split("-")
      const date2Parts = date2.split("T")[0].split("-")

      if (date1Parts.length === 3 && date2Parts.length === 3) {
        // Comparar directamente los componentes de la fecha sin añadir un día
        return date1Parts[0] === date2Parts[0] && date1Parts[1] === date2Parts[1] && date1Parts[2] === date2Parts[2]
      }

      return false
    }
  }

  /**
   * Formatea hora para API (HH:MM:SS)
   */
  formatTimeForApi(hour: number, minute: number, ampm: string): string {
    // Convertir a formato 24 horas
    let hours24 = hour
    if (ampm.toUpperCase() === "PM" && hour < 12) {
      hours24 = hour + 12
    } else if (ampm.toUpperCase() === "AM" && hour === 12) {
      hours24 = 0
    }

    return `${hours24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`
  }

  /**
   * Obtiene icono según el deporte
   */
  getSportIcon(sportName: string): string {
    if (!sportName) return "fitness-outline"

    const sportName_lower = sportName.toLowerCase()

    if (sportName_lower.includes("tennis") || sportName_lower.includes("tenis") || sportName_lower.includes("padel")) {
      return "tennisball-outline"
    } else if (
      sportName_lower.includes("futbol") ||
      sportName_lower.includes("fútbol") ||
      sportName_lower.includes("soccer")
    ) {
      return "football-outline"
    } else if (sportName_lower.includes("basket") || sportName_lower.includes("baloncesto")) {
      return "basketball-outline"
    } else if (sportName_lower.includes("volley") || sportName_lower.includes("voleibol")) {
      return "baseball-outline"
    } else if (sportName_lower.includes("swim") || sportName_lower.includes("natación")) {
      return "water-outline"
    } else if (sportName_lower.includes("run") || sportName_lower.includes("correr")) {
      return "walk-outline"
    } else if (
      sportName_lower.includes("cycling") ||
      sportName_lower.includes("ciclismo") ||
      sportName_lower.includes("bici")
    ) {
      return "bicycle-outline"
    }

    return "fitness-outline" // Icono de deporte por defecto
  }

  /**
   * Obtiene la URL de la imagen del deporte
   */
  getSportImageUrl(deporte: Deporte | undefined | null): string {
    // Si el deporte tiene una imagen definida en la base de datos, usarla
    if (deporte && deporte.imagen) {
      return deporte.imagen
    }

    // Seleccionar imagen según el deporte
    if (deporte && deporte.nombre) {
      const sportName = deporte.nombre.toLowerCase()

      if (sportName.includes("tenis") || sportName.includes("padel")) {
        return "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1000"
      } else if (sportName.includes("baloncesto") || sportName.includes("basket")) {
        return "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000"
      } else if (sportName.includes("fútbol") || sportName.includes("futbol")) {
        return "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=1000"
      } else if (sportName.includes("voleibol") || sportName.includes("voley")) {
        return "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=1000"
      } else if (sportName.includes("natación") || sportName.includes("swim")) {
        return "https://images.unsplash.com/photo-1560090995-01632a28895b?q=80&w=1000"
      }
    }

    // Imagen genérica para deportes
    return "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000"
  }

  /**
   * Verifica silenciosamente si hay quedadas que ya no deben mostrarse (pasadas)
   * y las elimina de la vista sin necesidad de recargar completamente
   * NOTA: Esta función ahora no elimina quedadas pasadas si _showAllMeetings es true
   */
  async checkAndRemovePastMeetings(): Promise<{ hasRemovedMeetings: boolean; currentMeetings: Quedada[] }> {
    try {
      // Si se deben mostrar todas las quedadas, no eliminar ninguna
      if (this._showAllMeetings) {
        console.log("🔍 Mostrando todas las quedadas, no se eliminarán quedadas pasadas")
        return { hasRemovedMeetings: false, currentMeetings: this._cachedMeetings }
      }

      console.log("🔍 Verificando silenciosamente si hay quedadas pasadas que deben eliminarse...")

      // Si no hay quedadas en caché, no hay nada que verificar
      if (this._cachedMeetings.length === 0) {
        console.log("ℹ️ No hay quedadas en caché para verificar")
        return { hasRemovedMeetings: false, currentMeetings: [] }
      }

      // Guardar la cantidad original de quedadas
      const originalCount = this._cachedMeetings.length
      console.log(`📊 Quedadas antes de filtrar: ${originalCount}`)

      // Ya no filtramos localmente, simplemente usamos las quedadas en caché
      const filteredMeetings = this._cachedMeetings

      // Verificar si se eliminó alguna quedada
      const hasRemovedMeetings = filteredMeetings.length < originalCount

      if (hasRemovedMeetings) {
        console.log(`🧹 Se eliminaron ${originalCount - filteredMeetings.length} quedadas pasadas`)

        // Actualizar la caché con las quedadas filtradas
        this._cachedMeetings = filteredMeetings

        // Notificar a los observadores que los datos han cambiado
        this.notifyMeetingsChanged()
      } else {
        console.log("✅ No se encontraron quedadas pasadas para eliminar")
      }

      return { hasRemovedMeetings, currentMeetings: filteredMeetings }
    } catch (error) {
      console.error("❌ Error al verificar quedadas pasadas:", error)
      return { hasRemovedMeetings: false, currentMeetings: this._cachedMeetings }
    }
  }

  /**
   * Configura si se deben mostrar todas las quedadas o solo las futuras
   * @param showAll true para mostrar todas las quedadas, false para mostrar solo las futuras
   */
  setShowAllMeetings(showAll: boolean): void {
    this._showAllMeetings = showAll
    console.log(
      `🔄 Configuración actualizada: ${showAll ? "Mostrando todas las quedadas" : "Mostrando solo quedadas futuras"}`,
    )
  }

  /**
   * Método auxiliar para encontrar el primer equipo disponible en una quedada
   */
  async findFirstAvailableTeam(meetingId: number): Promise<number | null> {
    try {
      console.log(`🔍 Buscando primer equipo disponible en quedada ${meetingId}`)

      // Obtener la quedada con todos sus usuarios
      const meeting = await this.getMeetingById(meetingId, true)

      if (!meeting || !meeting.deporte) {
        console.log(`❌ No se encontró la quedada ${meetingId} o no tiene información del deporte`)
        return null
      }

      const numberOfTeams = meeting.deporte.numero_equipos || 2

      // Verificar cada equipo en orden
      for (let teamId = 1; teamId <= numberOfTeams; teamId++) {
        const isTeamFull = await this.isTeamFull(meetingId, teamId)

        if (!isTeamFull) {
          console.log(`✅ Equipo ${teamId} disponible en quedada ${meetingId}`)
          return teamId
        }
      }

      console.log(`❌ No hay equipos disponibles en quedada ${meetingId}`)
      return null
    } catch (error) {
      console.error(`❌ Error al buscar equipo disponible:`, error)
      return null
    }
  }
}

// Exportar una instancia única del servicio
const searchMeetingsServiceInstance = new SearchMeetingsService()
export default searchMeetingsServiceInstance
