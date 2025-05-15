import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import * as ImagePicker from "expo-image-picker"
import { Platform } from "react-native"
import { API_URL } from "../../../config"

// Definición de tipos basados en la respuesta del backend
export interface UserType {
  id: number
  foto_perfil: string
  nombre: string
  correo: string
  numero_telefono: number
  puntuacion_competitiva: number
  premium: boolean
  configuracion: Configuracion | number
}

// Interfaz para la configuración del usuario
export interface Configuracion {
  id: number
  color_aplicacion: string
  permitir_notificaciones: boolean
}

// Definición del tipo Puntuacion
export interface Puntuacion {
  id: number
  equipo: number
  puntuacion: number
  usuario?: number
  quedada: {
    id: number
    nombre: string
    deporte: {
      id: number
      nombre: string
    }
    fecha: string
    hora_inicio: string
  }
}

export interface AuthResponse {
  usuario: UserType[]
  access_token: string
  mensaje?: string
}

export interface UsuarioQuedada {
  id: number
  usuario: {
    id: number
    nombre: string
  }
  quedada: number
  equipo: number
}

export interface MatchStats {
  id: string
  sport: string
  result: string
  isWin: boolean
  isDraw?: boolean // Añadido para indicar empate
  date: string
  time: string
  quedadaId: number
}

export interface UserStats {
  victories: number
  losses: number
  draws: number // Añadido para contar empates
  winRate: number
  matchesPlayed: number
  competitivePoints: number
  matchHistory: MatchStats[]
}

/**
 * Servicio para gestionar la autenticación y datos del usuario
 */
class UserService {
  // Claves para AsyncStorage
  static readonly USER_KEY = "user_data"
  static readonly TOKEN_KEY = "access_token"
  private static readonly USER_DATA_KEY = "user_data"
  static readonly THEME_STORAGE_KEY = "app_theme"
  private static readonly THEME_STORAGE_KEY_OLD = "theme"
  // Flag para forzar la actualización desde la base de datos
  private static readonly FORCE_DB_REFRESH = "force_db_refresh"

  /**
   * Función para depurar estadísticas de usuario
   * Muestra información detallada sobre las quedadas y puntuaciones
   */
  static async debugUserStats(): Promise<void> {
    try {
      console.log("=== DEBUG USER STATS ===")

      // 1. Check if user is authenticated
      const currentUser = await this.getCurrentUser()
      console.log("Current user:", currentUser ? `ID: ${currentUser.id}` : "No user found")

      // 2. Get user quedadas with team
      const userQuedadasTeamMap = await this.getUserQuedadasWithTeam()
      console.log(
        "User quedadas with team:",
        userQuedadasTeamMap.size > 0 ? `Found ${userQuedadasTeamMap.size} quedadas` : "No quedadas found",
      )

      // Log the first few quedadas if any exist
      if (userQuedadasTeamMap.size > 0) {
        console.log("Sample quedadas:")
        let count = 0
        for (const [quedadaId, equipoId] of userQuedadasTeamMap.entries()) {
          if (count < 3) {
            console.log(`  Quedada ID: ${quedadaId}, Equipo ID: ${equipoId}`)
            count++
          } else {
            break
          }
        }
      }

      // 3. Get quedadas puntuaciones
      const quedadasPuntuacionesMap = await this.getQuedadasPuntuaciones()
      console.log(
        "Quedadas puntuaciones:",
        quedadasPuntuacionesMap.size > 0
          ? `Found ${quedadasPuntuacionesMap.size} quedadas with puntuaciones`
          : "No puntuaciones found",
      )

      // Log the first few puntuaciones if any exist
      if (quedadasPuntuacionesMap.size > 0) {
        console.log("Sample puntuaciones:")
        let count = 0
        for (const [quedadaId, puntuaciones] of quedadasPuntuacionesMap.entries()) {
          if (count < 3) {
            console.log(`  Quedada ID: ${quedadaId}, Puntuaciones: ${puntuaciones.length}`)
            if (puntuaciones.length > 0) {
              console.log(
                `    First puntuacion: Equipo ${puntuaciones[0].equipo}, Puntos: ${puntuaciones[0].puntuacion}`,
              )
            }
            count++
          } else {
            break
          }
        }
      }

      console.log("=== END DEBUG ===")
    } catch (error) {
      console.error("Error in debugUserStats:", error)
    }
  }

  /**
   * Almacena los datos del usuario y token
   */
  static async storeUserData(authResponse: AuthResponse): Promise<void> {
    try {
      if (authResponse.usuario && authResponse.usuario.length > 0) {
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.usuario[0]))
      }

      if (authResponse.access_token) {
        await AsyncStorage.setItem(this.TOKEN_KEY, authResponse.access_token)
        // Configurar token para futuras peticiones
        axios.defaults.headers.common["Authorization"] = `Bearer ${authResponse.access_token}`
      }

      // Establecer flag para forzar actualización desde la base de datos
      await AsyncStorage.setItem(this.FORCE_DB_REFRESH, "true")

      // NUEVO: Verificar y aplicar el tema inmediatamente después de almacenar los datos
      await this.applyUserThemeFromDatabase(authResponse)
    } catch (error) {
      console.error("Error al almacenar datos:", error)
      throw error
    }
  }

  /**
   * NUEVO: Verifica y aplica el tema del usuario desde la base de datos
   * Se llama automáticamente después de almacenar los datos del usuario
   */
  static async applyUserThemeFromDatabase(authResponse: AuthResponse): Promise<void> {
    try {
      console.log("===== VERIFICANDO TEMA DEL USUARIO DESDE BD =====")

      if (!authResponse.usuario || authResponse.usuario.length === 0) {
        console.log("No hay datos de usuario para verificar tema")
        return
      }

      const user = authResponse.usuario[0]
      console.log(`Usuario autenticado: ID=${user.id}, Nombre=${user.nombre}`)

      // Verificar si el usuario tiene configuración
      if (!user.configuracion) {
        console.log("El usuario no tiene configuración asignada, usando tema por defecto (light)")
        await AsyncStorage.setItem(this.THEME_STORAGE_KEY, "light")
        return
      }

      // Obtener el ID de configuración
      const configId = typeof user.configuracion === "object" ? user.configuracion.id : user.configuracion
      console.log(`ID de configuración detectado: ${configId}`)

      // Obtener token para la petición
      const token = authResponse.access_token

      // Realizar petición directa a la API para obtener la configuración actualizada
      console.log(`Consultando configuración en BD para ID: ${configId}`)
      const configResponse = await axios.get(`${API_URL}/configuracion/${configId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log(`RESPUESTA COMPLETA DE CONFIGURACIÓN:`, JSON.stringify(configResponse.data, null, 2))

      if (!configResponse.data) {
        console.log("No se recibió respuesta de configuración, usando tema por defecto (light)")
        await AsyncStorage.setItem(this.THEME_STORAGE_KEY, "light")
        return
      }

      // Verificar si tiene color_aplicacion
      if (!configResponse.data.color_aplicacion) {
        console.log("La configuración no tiene color_aplicacion, usando tema por defecto (light)")
        await AsyncStorage.setItem(this.THEME_STORAGE_KEY, "light")
        return
      }

      // Determinar el tema basado en color_aplicacion
      const colorApp = configResponse.data.color_aplicacion
      console.log(`Valor de color_aplicacion en BD: "${colorApp}"`)

      const theme = colorApp === "negro" ? "dark" : "light"
      console.log(`Tema determinado: ${theme}`)

      // Guardar en almacenamiento local
      await AsyncStorage.setItem(this.THEME_STORAGE_KEY, theme)
      console.log(`Tema guardado en AsyncStorage: ${theme}`)

      // Actualizar la configuración en el objeto de usuario
      if (typeof user.configuracion === "object") {
        user.configuracion.color_aplicacion = colorApp
      } else {
        user.configuracion = configResponse.data
      }

      // Actualizar el usuario en AsyncStorage
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user))
      console.log("Datos de usuario actualizados con la configuración")

      console.log("===== VERIFICACIÓN DE TEMA COMPLETADA =====")
    } catch (error) {
      console.error("Error al verificar tema desde BD:", error)
      console.log("Usando tema por defecto (light) debido al error")
      await AsyncStorage.setItem(this.THEME_STORAGE_KEY, "light")
    }
  }

  /**
   * Obtiene los datos del usuario actual
   */
  static async getCurrentUser(): Promise<UserType | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error("Error al obtener usuario:", error)
      return null
    }
  }

  /**
   * Obtiene el token de acceso
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY)
    } catch (error) {
      console.error("Error al obtener token:", error)
      return null
    }
  }

  /**
   * Verifica si el usuario ha iniciado sesión
   */
  static async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getAccessToken()
      return !!token
    } catch (error) {
      return false
    }
  }

  /**
   * Actualiza los datos del usuario
   */
  static async updateUserData(updatedUser: Partial<UserType>): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser()
      if (currentUser) {
        const newUserData = { ...currentUser, ...updatedUser }
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(newUserData))
      }
    } catch (error) {
      console.error("Error al actualizar datos:", error)
      throw error
    }
  }

  /**
   * Actualiza la foto de perfil
   */
  static async updateProfilePicture(photoUrl: string): Promise<void> {
    return this.updateUserData({ foto_perfil: photoUrl })
  }

  /**
   * Actualiza el estado premium
   */
  static async updatePremiumStatus(isPremium: boolean): Promise<void> {
    return this.updateUserData({ premium: isPremium })
  }

  /**
   * Cierra la sesión eliminando los datos
   */
  static async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.USER_KEY, this.TOKEN_KEY, this.THEME_STORAGE_KEY, this.FORCE_DB_REFRESH])
      // Eliminar encabezado de autorización
      delete axios.defaults.headers.common["Authorization"]
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      throw error
    }
  }

  /**
   * Obtiene una instancia de axios con autorización
   */
  static async getAuthenticatedAxios() {
    const token = await this.getAccessToken()

    if (!token) {
      throw new Error("Token de autenticación no encontrado. Por favor inicia sesión nuevamente.")
    }

    return axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  }

  /**
   * Obtiene la puntuación competitiva del usuario directamente de la base de datos
   * Utiliza el endpoint de búsqueda y filtra los resultados para encontrar el usuario correcto
   */
  static async getCompetitivePointsFromDB(): Promise<number> {
    try {
      console.log("Obteniendo puntuación competitiva directamente de la base de datos...")

      // Obtener el usuario actual
      const currentUser = await this.getCurrentUser()
      if (!currentUser || !currentUser.id) {
        throw new Error("No se pudo obtener el ID del usuario")
      }

      const userId = currentUser.id
      console.log(`ID del usuario: ${userId}`)

      // Obtener instancia autenticada de axios
      const api = await this.getAuthenticatedAxios()

      // Intentar obtener el usuario directamente por su ID usando el nuevo endpoint
      try {
        console.log(`Consultando usuario por ID: ${userId}`)
        const response = await api.get(`/usuario/${userId}`)

        console.log("Respuesta de la consulta por ID:", JSON.stringify(response.data))

        if (response.data && response.data.puntuacion_competitiva !== undefined) {
          console.log(`Puntuación competitiva obtenida de la BD: ${response.data.puntuacion_competitiva}`)

          // Actualizar datos en almacenamiento local
          await this.updateUserData({ puntuacion_competitiva: response.data.puntuacion_competitiva })

          return response.data.puntuacion_competitiva || 0
        }
      } catch (directError) {
        console.log("Error al obtener usuario por ID:")
        // Si falla, intentamos con el método de búsqueda mejorado
      }

      // Método alternativo: usar el endpoint de búsqueda mejorado
      console.log(`Buscando usuario con ID: ${userId} usando el endpoint de búsqueda`)
      const searchResponse = await api.post("/usuario/buscar", { texto: userId.toString() })

      console.log("Respuesta de la búsqueda:", JSON.stringify(searchResponse.data))

      if (searchResponse.data && Array.isArray(searchResponse.data)) {
        // Buscar el usuario con el ID exacto
        const exactUser = searchResponse.data.find((user) => user.id === userId)

        if (exactUser) {
          console.log(
            `Usuario encontrado con ID exacto: ${exactUser.id}, puntuación: ${exactUser.puntuacion_competitiva}`,
          )

          // Actualizar datos en almacenamiento local
          await this.updateUserData({ puntuacion_competitiva: exactUser.puntuacion_competitiva })

          return exactUser.puntuacion_competitiva || 0
        }
      }

      // Si no se encontró el usuario, usar los datos en caché
      console.log("No se encontró el usuario en la base de datos, usando datos en caché")
      return currentUser.puntuacion_competitiva || 0
    } catch (error) {
      console.error("Error al obtener puntuación competitiva de la BD:", error)

      // En caso de error, devolver la puntuación actual en caché
      const currentUser = await this.getCurrentUser()
      return currentUser?.puntuacion_competitiva || 0
    }
  }

  // NUEVOS MÉTODOS PARA GESTIÓN DE PERFIL

  /**
   * Solicita permisos para acceder a la galería
   */
  static async requestGalleryPermissions(): Promise<boolean> {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        console.log("Se necesitan permisos para acceder a la galería")
        return false
      }
      return true
    }
    return true
  }

  /**
   * Solicita permisos para acceder a la cámara
   */
  static async requestCameraPermissions(): Promise<boolean> {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== "granted") {
        console.log("Se necesitan permisos para acceder a la cámara")
        return false
      }
      return true
    }
    return true
  }

  /**
   * Selecciona una imagen de la galería
   */
  static async pickImage(): Promise<{ uri: string; type: string; name: string } | null> {
    try {
      const hasPermission = await this.requestGalleryPermissions()
      if (!hasPermission) return null

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0]
        const uri = selectedImage.uri

        // Obtener extensión del archivo
        const uriParts = uri.split(".")
        const fileType = uriParts[uriParts.length - 1]

        // Crear nombre de archivo único
        const fileName = `profile_${Date.now()}.${fileType}`

        return {
          uri,
          type: `image/${fileType}`,
          name: fileName,
        }
      }
      return null
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      return null
    }
  }

  /**
   * Toma una foto con la cámara
   */
  static async takePhoto(): Promise<{ uri: string; type: string; name: string } | null> {
    try {
      console.log("Iniciando proceso de toma de foto con la cámara...")
      const hasPermission = await this.requestCameraPermissions()
      if (!hasPermission) return null

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedImage = result.assets[0]
        const uri = capturedImage.uri

        // Obtener extensión del archivo
        const uriParts = uri.split(".")
        const fileType = uriParts[uriParts.length - 1] || "jpg"

        // Crear nombre de archivo único
        const fileName = `profile_camera_${Date.now()}.${fileType}`

        return {
          uri,
          type: `image/${fileType}`,
          name: fileName,
        }
      }
      return null
    } catch (error) {
      console.error("Error al tomar foto con la cámara:", error)
      return null
    }
  }

  /**
   * Sube una imagen de perfil al servidor
   */
  static async uploadProfilePicture(imageFile: { uri: string; type: string; name: string }): Promise<string | null> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      // Crear FormData para enviar el archivo
      const formData = new FormData()
      formData.append("file", {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name,
      } as any)

      // Obtener instancia autenticada de axios
      const api = await this.getAuthenticatedAxios()

      // Configurar headers específicos para FormData
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }

      // Enviar la imagen al servidor
      const response = await api.post(`/usuario/actualizarfoto/${currentUser.id}`, formData, config)

      if (response.data && response.data.url) {
        // Actualizar la URL de la foto en el almacenamiento local
        await this.updateProfilePicture(response.data.url)
        return response.data.url
      }

      return null
    } catch (error) {
      console.error("Error al subir imagen de perfil:", error)
      return null
    }
  }

  /**
   * Actualiza el nombre del usuario
   */
  static async updateUsername(newName: string): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await this.getAuthenticatedAxios()
      await api.post("/usuario/editar-perfil/nombre", {
        id: currentUser.id,
        nombre: newName,
      })

      // Actualizar datos locales
      await this.updateUserData({ nombre: newName })
      return true
    } catch (error) {
      console.error("Error al actualizar nombre:", error)
      return false
    }
  }

  /**
   * Actualiza el correo del usuario
   */
  static async updateEmail(newEmail: string): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await this.getAuthenticatedAxios()
      await api.post("/usuario/editar-perfil/correo", {
        id: currentUser.id,
        correo: newEmail,
      })

      // Actualizar datos locales
      await this.updateUserData({ correo: newEmail })
      return true
    } catch (error) {
      console.error("Error al actualizar correo:", error)
      return false
    }
  }

  /**
   * Actualiza el número de teléfono del usuario
   */
  static async updatePhoneNumber(newPhoneNumber: number): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await this.getAuthenticatedAxios()
      await api.post("/usuario/editar-perfil/numero-telefono", {
        id: currentUser.id,
        numero_telefono: newPhoneNumber,
      })

      // Actualizar datos locales
      await this.updateUserData({ numero_telefono: newPhoneNumber })
      return true
    } catch (error) {
      console.error("Error al actualizar número de teléfono:", error)
      return false
    }
  }

  /**
   * Suscribe al usuario a premium
   */
  static async subscribeToPremium(): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await this.getAuthenticatedAxios()
      await api.post("/usuario/premium/suscribir", {
        id: currentUser.id,
      })

      // Actualizar datos locales
      await this.updatePremiumStatus(true)
      return true
    } catch (error) {
      console.error("Error al suscribir a premium:", error)
      return false
    }
  }

  /**
   * Cancela la suscripción premium del usuario
   */
  static async cancelPremium(): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await this.getAuthenticatedAxios()
      await api.post("/usuario/premium/cancelar", {
        id: currentUser.id,
      })

      // Actualizar datos locales
      await this.updatePremiumStatus(false)
      return true
    } catch (error) {
      console.error("Error al cancelar premium:", error)
      return false
    }
  }

  /**
   * Formatea el número de teléfono para mostrar
   */
  static formatPhoneNumber(phoneNumber: number | undefined): string {
    if (!phoneNumber) return "No disponible"

    const phoneStr = phoneNumber.toString()
    if (phoneStr.length !== 9) return phoneStr

    // Formatear como: XXX-XXX-XXX
    return `${phoneStr.substring(0, 3)}-${phoneStr.substring(3, 6)}-${phoneStr.substring(6)}`
  }

  /**
   * Obtiene las quedadas en las que el usuario ha participado con su equipo asignado
   * Basado en el endpoint /quedada/filtrar con el filtro usuarioquedada
   */
  static async getUserQuedadasWithTeam(): Promise<Map<number, number>> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await this.getAuthenticatedAxios()

      // Obtener todas las quedadas en las que el usuario ha participado
      // Usando el endpoint /quedada/filtrar con el filtro usuarioquedada
      const response = await api
        .post(`/quedada/filtrar`, {
          usuarioquedada: [currentUser.id],
          abierta: false, // Solo quedadas cerradas
        })
        .catch((error) => {
          console.log("Error al obtener quedadas del usuario:", error.message)
          return { data: [] }
        })

      console.log(
        "Respuesta de quedadas filtradas (solo cerradas):",
        JSON.stringify(response.data).substring(0, 200) + "...",
      )

      if (!response.data || !Array.isArray(response.data)) {
        console.log("La respuesta no es un array o está vacía")
        return new Map()
      }

      // Crear un mapa de quedadaId -> equipoId
      const quedadaEquipoMap = new Map<number, number>()

      // Recorrer las quedadas y extraer la información de usuarioquedada
      for (const quedada of response.data) {
        if (quedada.usuarioquedada && Array.isArray(quedada.usuarioquedada)) {
          // Buscar la entrada de usuarioquedada que corresponde al usuario actual
          const userEntry = quedada.usuarioquedada.find((uq: any) => uq.usuario && uq.usuario.id === currentUser.id)

          if (userEntry) {
            quedadaEquipoMap.set(quedada.id, userEntry.equipo)
            console.log(
              `Encontrada quedada ${quedada.id} con equipo ${userEntry.equipo} para usuario ${currentUser.id}`,
            )
          }
        }
      }

      console.log(`Total de quedadas cerradas encontradas: ${quedadaEquipoMap.size}`)
      return quedadaEquipoMap
    } catch (error) {
      console.error("Error al obtener quedadas del usuario con equipo:", error)
      return new Map()
    }
  }

  /**
   * Obtiene todas las puntuaciones de las quedadas en las que ha participado el usuario
   */
  static async getQuedadasPuntuaciones(): Promise<Map<number, Puntuacion[]>> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        throw new Error("No hay usuario autenticado")
      }

      const api = await this.getAuthenticatedAxios()

      // Obtener todas las quedadas en las que el usuario ha participado
      const quedadasResponse = await api.post(`/quedada/filtrar`, {
        usuarioquedada: [currentUser.id],
        abierta: false, // Solo quedadas cerradas
      })

      console.log(
        "Respuesta de quedadas para puntuaciones (solo cerradas):",
        JSON.stringify(quedadasResponse.data).substring(0, 200) + "...",
      )

      if (!quedadasResponse.data || !Array.isArray(quedadasResponse.data)) {
        console.log("La respuesta de puntuaciones no es un array o está vacía")
        return new Map()
      }

      const quedadas = quedadasResponse.data
      const quedadasPuntuacionesMap = new Map<number, Puntuacion[]>()

      // Para cada quedada, extraer las puntuaciones que ya vienen incluidas en la respuesta
      for (const quedada of quedadas) {
        // Verificar si la quedada es competitiva antes de procesar sus puntuaciones
        if (quedada.competitividad === true) {
          if (quedada.puntuaciones && Array.isArray(quedada.puntuaciones) && quedada.puntuaciones.length > 0) {
            console.log(`Quedada ${quedada.id} tiene ${quedada.puntuaciones.length} puntuaciones`)

            // Formatear las puntuaciones con la información de la quedada
            const puntuacionesFormateadas = quedada.puntuaciones.map((p: any) => ({
              ...p,
              quedada: {
                id: quedada.id,
                nombre: quedada.nombre,
                deporte: quedada.deporte,
                fecha: quedada.fecha,
                hora_inicio: quedada.hora_inicio,
              },
            }))

            quedadasPuntuacionesMap.set(quedada.id, puntuacionesFormateadas)
          } else {
            // Si no hay puntuaciones, establecer un array vacío
            console.log(`Quedada ${quedada.id} no tiene puntuaciones`)
            quedadasPuntuacionesMap.set(quedada.id, [])
          }
        } else {
          console.log(`Quedada ${quedada.id} no es competitiva, se omite para estadísticas`)
        }
      }

      console.log(`Total de quedadas cerradas con puntuaciones: ${quedadasPuntuacionesMap.size}`)
      return quedadasPuntuacionesMap
    } catch (error) {
      console.error("Error al obtener puntuaciones de quedadas:", error)
      return new Map()
    }
  }

  /**
   * Verifica si todas las puntuaciones son iguales (empate)
   * @param puntuaciones Lista de puntuaciones de la quedada
   * @returns true si todas las puntuaciones son iguales, false en caso contrario
   */
  static esEmpate(puntuaciones: Puntuacion[]): boolean {
    if (!puntuaciones || puntuaciones.length <= 1) {
      return false
    }

    // Obtener la primera puntuación como referencia
    const primeraPuntuacion = puntuaciones[0].puntuacion

    // Verificar si todas las puntuaciones son iguales
    return puntuaciones.every((p) => p.puntuacion === primeraPuntuacion)
  }

  /**
   * Determina el equipo ganador de una quedada basado en las puntuaciones
   * @param puntuaciones Lista de puntuaciones de la quedada
   * @returns El ID del equipo ganador, null si hay empate o no hay puntuaciones
   */
  static determinarEquipoGanador(puntuaciones: Puntuacion[]): number | null {
    if (!puntuaciones || puntuaciones.length === 0) {
      return null
    }

    // Si solo hay un equipo, es el ganador por defecto
    if (puntuaciones.length === 1) {
      return puntuaciones[0].equipo
    }

    // Verificar si hay empate (todas las puntuaciones son iguales)
    if (this.esEmpate(puntuaciones)) {
      console.log("Todas las puntuaciones son iguales, se considera empate")
      return null
    }

    // Encontrar la puntuación más alta
    let maxPuntuacion = -1
    let equipoGanador: number | null = null
    let hayEmpate = false

    for (const puntuacion of puntuaciones) {
      if (puntuacion.puntuacion > maxPuntuacion) {
        maxPuntuacion = puntuacion.puntuacion
        equipoGanador = puntuacion.equipo
        hayEmpate = false
      } else if (puntuacion.puntuacion === maxPuntuacion) {
        hayEmpate = true
      }
    }

    // Si hay empate en la puntuación más alta, no hay ganador
    if (hayEmpate) {
      return null
    }

    return equipoGanador
  }

  /**
   * Añadir un método para depurar la estructura de las quedadas
   */
  static async debugQuedadaStructure(): Promise<void> {
    try {
      console.log("=== DEBUG QUEDADA STRUCTURE ===")
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        console.log("No hay usuario autenticado")
        return
      }

      const api = await this.getAuthenticatedAxios()
      const response = await api.post(`/quedada/filtrar`, {
        usuarioquedada: [currentUser.id],
        abierta: false, // Solo quedadas cerradas
      })

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        console.log("No se encontraron quedadas cerradas para el usuario")
        return
      }

      // Mostrar la primera quedada como ejemplo
      const primeraQuedada = response.data[0]
      console.log("Estructura de la primera quedada cerrada:")
      console.log("ID:", primeraQuedada.id)
      console.log("Nombre:", primeraQuedada.nombre)
      console.log("Es competitiva:", primeraQuedada.competitividad)
      console.log("Está abierta:", primeraQuedada.abierta)
      console.log("Tiene puntuaciones:", primeraQuedada.puntuaciones ? "Sí" : "No")

      if (primeraQuedada.puntuaciones && primeraQuedada.puntuaciones.length > 0) {
        console.log("Ejemplo de puntuación:", JSON.stringify(primeraQuedada.puntuaciones[0]))
      }

      console.log("Tiene usuarioquedada:", primeraQuedada.usuarioquedada ? "Sí" : "No")

      if (primeraQuedada.usuarioquedada && primeraQuedada.usuarioquedada.length > 0) {
        console.log("Ejemplo de usuarioquedada:", JSON.stringify(primeraQuedada.usuarioquedada[0]))
      }

      console.log("=== END DEBUG QUEDADA STRUCTURE ===")
    } catch (error) {
      console.error("Error en debugQuedadaStructure:", error)
    }
  }

  /**
   * Calcula las estadísticas del usuario basadas en sus puntuaciones
   * @returns Estadísticas del usuario incluyendo puntos competitivos
   */
  static async calculateUserStats(): Promise<UserStats> {
    try {
      console.log("Calculando estadísticas de usuario...")

      // Obtener usuario actual
      const user = await this.getCurrentUser()
      if (!user) {
        console.error("No hay usuario autenticado")
        return {
          victories: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          matchesPlayed: 0,
          competitivePoints: 0,
          matchHistory: [],
        }
      }

      // Ejecutar debug para ayudar a identificar problemas
      await this.debugUserStats()

      // Obtener el mapa de quedadas y equipos del usuario
      const userQuedadasTeamMap = await this.getUserQuedadasWithTeam()
      console.log(`Quedadas cerradas del usuario: ${userQuedadasTeamMap.size}`)

      // Obtener todas las puntuaciones de las quedadas
      const quedadasPuntuacionesMap = await this.getQuedadasPuntuaciones()
      console.log(`Quedadas cerradas con puntuaciones: ${quedadasPuntuacionesMap.size}`)

      // Inicializar estadísticas
      let victories = 0
      let losses = 0
      let draws = 0
      let totalPoints = 0
      const matchHistory: MatchStats[] = []

      // Procesar cada quedada y sus puntuaciones
      for (const [quedadaId, puntuaciones] of quedadasPuntuacionesMap.entries()) {
        // Obtener el equipo del usuario en esta quedada
        const userTeam = userQuedadasTeamMap.get(quedadaId)

        if (!userTeam) {
          console.log(`No se encontró el equipo del usuario para la quedada ${quedadaId}`)
          continue
        }

        if (puntuaciones.length === 0) {
          console.log(`No hay puntuaciones para la quedada ${quedadaId}`)
          continue
        }

        console.log(
          `Procesando quedada cerrada ${quedadaId}, equipo del usuario: ${userTeam}, puntuaciones: ${puntuaciones.length}`,
        )

        // Encontrar la puntuación del equipo del usuario
        const userTeamScore = puntuaciones.find((p) => p.equipo === userTeam)

        if (!userTeamScore) {
          console.log(`No se encontró puntuación para el equipo ${userTeam} en la quedada ${quedadaId}`)
          continue
        }

        console.log(`Puntuación del equipo del usuario: ${userTeamScore.puntuacion}`)

        // Sumar a los puntos totales
        totalPoints += userTeamScore.puntuacion

        // Verificar si hay empate (todas las puntuaciones son iguales)
        const esEmpate = this.esEmpate(puntuaciones)

        // Determinar el equipo ganador si no hay empate
        const equipoGanador = esEmpate ? null : this.determinarEquipoGanador(puntuaciones)

        // Determinar si el equipo del usuario ganó, perdió o empató
        let isWin = false
        let isDraw = false

        if (esEmpate) {
          isDraw = true
          draws++
          console.log(`Empate en quedada cerrada ${quedadaId}`)
        } else if (equipoGanador === userTeam) {
          isWin = true
          victories++
          console.log(`Victoria en quedada cerrada ${quedadaId}`)
        } else {
          losses++
          console.log(`Derrota en quedada cerrada ${quedadaId}`)
        }

        // Encontrar la puntuación del equipo contrario (para mostrar en el resultado)
        // Si hay más de dos equipos, mostrar la puntuación más alta de los otros equipos
        let otherTeamScore = 0
        for (const puntuacion of puntuaciones) {
          if (puntuacion.equipo !== userTeam && puntuacion.puntuacion > otherTeamScore) {
            otherTeamScore = puntuacion.puntuacion
          }
        }

        // Formatear fecha y hora
        let formattedDate = "01-01-2023" // Fecha por defecto
        try {
          const date = new Date(userTeamScore.quedada.fecha)
          formattedDate = `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getFullYear()}`
        } catch (e) {
          console.log("Error al formatear fecha:", e)
        }

        // Añadir al historial de partidos
        matchHistory.push({
          id: `${quedadaId}-${userTeam}`,
          sport: userTeamScore.quedada.deporte?.nombre || "Deporte",
          result: `${userTeamScore.puntuacion}-${otherTeamScore}`,
          isWin,
          isDraw,
          date: formattedDate,
          time: userTeamScore.quedada.hora_inicio || "00:00",
          quedadaId,
        })
      }

      // Calcular estadísticas finales
      const matchesPlayed = victories + losses + draws
      const winRate = matchesPlayed > 0 ? (victories / matchesPlayed) * 100 : 0

      console.log(
        `Estadísticas calculadas (solo quedadas cerradas): Victorias=${victories}, Derrotas=${losses}, Empates=${draws}, Partidos=${matchesPlayed}, Puntos=${totalPoints}`,
      )

      // Actualizar puntuación competitiva en el perfil del usuario
      await this.updateUserData({ puntuacion_competitiva: totalPoints })

      const stats = {
        victories,
        losses,
        draws,
        winRate: Number.parseFloat(winRate.toFixed(1)),
        matchesPlayed,
        competitivePoints: totalPoints,
        matchHistory: matchHistory.sort((a, b) => {
          // Ordenar por fecha descendente (más reciente primero)
          try {
            const dateA = new Date(a.date.split("-").reverse().join("-"))
            const dateB = new Date(b.date.split("-").reverse().join("-"))
            return dateB.getTime() - dateA.getTime()
          } catch (e) {
            return 0
          }
        }),
      }

      console.log("Estadísticas finales (solo quedadas cerradas):", JSON.stringify(stats))
      return stats
    } catch (error) {
      console.error("Error al calcular estadísticas del usuario:", error)

      // Devolver estadísticas vacías en caso de error
      return {
        victories: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        matchesPlayed: 0,
        competitivePoints: 0,
        matchHistory: [],
      }
    }
  }

  /**
   * Actualiza y refresca la puntuación competitiva del usuario
   * @returns La puntuación competitiva actualizada
   */
  static async refreshCompetitivePoints(): Promise<number> {
    try {
      console.log("Refrescando puntuación competitiva desde la base de datos...")

      // Obtener puntuación competitiva directamente de la base de datos
      return await this.getCompetitivePointsFromDB()
    } catch (error) {
      console.error("Error al refrescar puntuación competitiva:", error)

      // En caso de error, intentar obtener el valor actual
      const currentUser = await this.getCurrentUser()
      return currentUser?.puntuacion_competitiva || 0
    }
  }

  /**
   * Añade una puntuación para un partido
   */
  static async addPuntuacion(quedadaId: number, equipo: number, puntuacion: number): Promise<boolean> {
    try {
      const api = await this.getAuthenticatedAxios()

      await api.post("/puntuacion/anadir", {
        quedada: quedadaId,
        equipo,
        puntuacion,
      })

      return true
    } catch (error) {
      console.error("Error al añadir puntuación:", error)
      return false
    }
  }

  /**
   * Obtiene el icono correspondiente al deporte
   */
  static getSportIcon(sport: string): string {
    const sportLower = sport?.toLowerCase() || ""

    if (sportLower.includes("tenis")) return "tennisball-outline"
    if (sportLower.includes("baloncesto") || sportLower.includes("basket")) return "basketball-outline"
    if (sportLower.includes("fútbol") || sportLower.includes("futbol")) return "football-outline"
    if (sportLower.includes("voleibol") || sportLower.includes("voley")) return "volleyball-outline"
    if (sportLower.includes("natación") || sportLower.includes("natacion")) return "water-outline"
    if (sportLower.includes("ciclismo") || sportLower.includes("bici")) return "bicycle-outline"
    if (sportLower.includes("correr") || sportLower.includes("running")) return "walk-outline"
    if (sportLower.includes("pádel") || sportLower.includes("padel")) return "tennisball-outline"

    // Icono por defecto
    return "fitness-outline"
  }

  /**
   * Obtiene y almacena la configuración completa del usuario
   * @param configId ID de la configuración a obtener
   * @returns La configuración obtenida o null si hubo un error
   */
  static async fetchAndStoreUserConfiguration(configId: number): Promise<Configuracion | null> {
    try {
      console.log(`[UserService] Obteniendo configuración con ID: ${configId}`)

      const api = await this.getAuthenticatedAxios()
      const response = await api.get(`/configuracion/${configId}`)

      if (!response.data) {
        console.error(`[UserService] No se encontró configuración con ID: ${configId}`)
        return null
      }

      console.log(`[UserService] Configuración obtenida: ${JSON.stringify(response.data)}`)

      // Verificar que la configuración tenga color_aplicacion
      if (!response.data.color_aplicacion) {
        console.log(`[UserService] La configuración no tiene color_aplicacion, estableciendo valor por defecto`)
        response.data.color_aplicacion = "blanco" // Valor por defecto
      }

      // Actualizar datos locales con la configuración completa
      const currentUser = await this.getCurrentUser()
      if (currentUser) {
        console.log(`[UserService] Actualizando datos locales del usuario con la configuración`)
        await this.updateUserData({
          configuracion: response.data,
        })
      }

      return response.data
    } catch (error) {
      console.error(`[UserService] Error obteniendo configuración ${configId}:`, error)
      return null
    }
  }

  /**
   * Inicializa el tema basado en la configuración del usuario
   * Se llama después del login para establecer el tema correcto
   */
  static async initializeThemeFromConfiguration(): Promise<void> {
    try {
      console.log("[UserService] Inicializando tema desde configuración")

      // Obtener configuración directamente de la base de datos
      const user = await this.getCurrentUser()
      if (!user) {
        console.log("[UserService] No hay usuario autenticado para inicializar tema")
        await AsyncStorage.setItem(this.THEME_STORAGE_KEY, "light")
        return
      }

      // Obtener el ID de configuración
      const configId = typeof user.configuracion === "object" ? user.configuracion.id : (user.configuracion as number)

      if (!configId) {
        console.log("[UserService] No se encontró ID de configuración, usando tema por defecto")
        await AsyncStorage.setItem(this.THEME_STORAGE_KEY, "light")
        return
      }

      // Obtener configuración fresca de la base de datos
      console.log(`[UserService] Obteniendo configuración fresca para inicializar tema, ID: ${configId}`)
      const api = await this.getAuthenticatedAxios()
      const response = await api.get(`/configuracion/${configId}`)

      if (!response.data) {
        console.log("[UserService] No se pudo obtener configuración de la base de datos, usando tema por defecto")
        await AsyncStorage.setItem(this.THEME_STORAGE_KEY, "light")
        return
      }

      const config = response.data
      console.log(`[UserService] Configuración obtenida de la base de datos: ${JSON.stringify(config)}`)

      // Determinar el tema basado en color_aplicacion
      const colorAplicacion = config.color_aplicacion || "blanco"
      const theme = this.getThemeFromColorAplicacion(colorAplicacion)

      console.log(`[UserService] Inicializando tema: ${theme} (de color: ${colorAplicacion})`)

      // Guardar en almacenamiento local
      await AsyncStorage.setItem(this.THEME_STORAGE_KEY, theme)

      // Actualizar la configuración en el objeto de usuario
      if (typeof user.configuracion === "object") {
        ;(user.configuracion as Configuracion).color_aplicacion = colorAplicacion
        await this.updateUserData({ configuracion: user.configuracion })
      } else {
        await this.updateUserData({ configuracion: config })
      }

      console.log(`[UserService] Tema inicializado correctamente: ${theme}`)
    } catch (error) {
      console.error("[UserService] Error inicializando tema:", error)
      // En caso de error, establecer tema por defecto
      await AsyncStorage.setItem(this.THEME_STORAGE_KEY, "light")
    }
  }

  /**
   * Obtiene la configuración completa del usuario
   * @returns Configuración del usuario o null si no existe
   */
  static async getUserConfiguration(): Promise<Configuracion | null> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        console.log("[UserService] No hay usuario autenticado para obtener configuración")
        return null
      }

      // Verificar si debemos forzar la actualización desde la base de datos
      const forceRefresh = await AsyncStorage.getItem(this.FORCE_DB_REFRESH)

      // Si la configuración ya es un objeto completo y no se fuerza la actualización, devolverlo
      if (typeof user.configuracion === "object" && forceRefresh !== "true") {
        console.log("[UserService] Usando configuración en caché:", JSON.stringify(user.configuracion))
        return user.configuracion as Configuracion
      }

      // Obtener el ID de configuración
      const configId = typeof user.configuracion === "object" ? user.configuracion.id : (user.configuracion as number)

      if (!configId) {
        console.log("[UserService] Usuario no tiene ID de configuración")
        return null
      }

      // Obtener configuración fresca de la base de datos
      console.log(`[UserService] Obteniendo configuración fresca de la base de datos, ID: ${configId}`)
      const config = await this.fetchAndStoreUserConfiguration(configId)

      // Desactivar el flag de forzar actualización
      await AsyncStorage.setItem(this.FORCE_DB_REFRESH, "false")

      return config
    } catch (error) {
      console.error("[UserService] Error obteniendo configuración:", error)
      return null
    }
  }

  // Simplificar getCurrentTheme para obtener siempre el tema directamente de la base de datos
  static async getCurrentTheme(): Promise<"light" | "dark"> {
    try {
      console.log("[UserService] Obteniendo tema actual directamente de la base de datos...")

      // Obtener usuario actual
      const user = await this.getCurrentUser()
      if (!user) {
        console.log("[UserService] No hay usuario autenticado, usando tema por defecto")
        return "light"
      }

      // Obtener el ID de configuración
      const configId = typeof user.configuracion === "object" ? user.configuracion.id : user.configuracion

      if (!configId) {
        console.log("[UserService] No se encontró ID de configuración, usando tema por defecto")
        return "light"
      }

      // Obtener token
      const token = await this.getAccessToken()
      if (!token) {
        console.log("[UserService] No hay token de autenticación, usando tema por defecto")
        return "light"
      }

      console.log(`[UserService] Consultando configuración en BD para ID: ${configId}`)

      // Obtener configuración directamente de la base de datos
      const response = await axios.get(`${API_URL}/configuracion/${configId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log(`[UserService] RESPUESTA DE CONFIGURACIÓN DE BD:`, JSON.stringify(response.data))

      if (!response.data || !response.data.color_aplicacion) {
        console.log("[UserService] No se pudo obtener color_aplicacion de la BD, usando tema por defecto")
        return "light"
      }

      // Determinar el tema basado en color_aplicacion
      const theme = response.data.color_aplicacion === "negro" ? "dark" : "light"

      console.log(`[UserService] TEMA OBTENIDO DIRECTAMENTE DE BD: ${theme} (color: ${response.data.color_aplicacion})`)

      // Guardar en almacenamiento local
      await AsyncStorage.setItem(this.THEME_STORAGE_KEY, theme)

      // Actualizar la configuración en el objeto de usuario
      if (typeof user.configuracion === "object") {
        ;(user.configuracion as Configuracion).color_aplicacion = response.data.color_aplicacion
        await this.updateUserData({ configuracion: user.configuracion })
      } else {
        await this.updateUserData({ configuracion: response.data })
      }

      return theme
    } catch (error) {
      console.error("[UserService] Error obteniendo tema de BD:", error)
      return "light" // Tema por defecto en caso de error
    }
  }

  /**
   * Cambia el tema de la aplicación y actualiza la configuración en la base de datos
   * @param theme El nuevo tema ("light" o "dark")
   * @returns true si se cambió correctamente, false en caso contrario
   */
  static async changeTheme(theme: "light" | "dark"): Promise<boolean> {
    try {
      console.log(`[UserService] Cambiando tema a: ${theme}`)

      // Guardar en almacenamiento local para respuesta inmediata
      await AsyncStorage.setItem(this.THEME_STORAGE_KEY, theme)

      // Obtener usuario actual
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error("No hay usuario autenticado")
      }

      // Obtener el ID de configuración
      const configId = typeof user.configuracion === "object" ? user.configuracion.id : (user.configuracion as number)

      if (!configId) {
        throw new Error("No se encontró ID de configuración")
      }

      // Convertir tema a valor de color_aplicacion
      const colorAplicacion = this.getColorAplicacionFromTheme(theme)
      console.log(`[UserService] Valor de color_aplicacion a enviar: ${colorAplicacion}`)

      // IMPORTANTE: Estructura correcta para el backend
      const params = {
        id: configId, // Usar 'id' como espera el controlador
        color_aplicacion: colorAplicacion,
      }

      console.log(`[UserService] Enviando parámetros al backend:`, JSON.stringify(params))

      // Actualizar la configuración en el backend
      const api = await this.getAuthenticatedAxios()
      const response = await api.post(`/configuracion/cambiartema`, params)

      console.log(`[UserService] Respuesta del backend:`, JSON.stringify(response.data))

      // Obtener configuración actualizada de la base de datos
      const configResponse = await api.get(`/configuracion/${configId}`)

      if (configResponse.data) {
        console.log(`[UserService] Configuración actualizada obtenida: ${JSON.stringify(configResponse.data)}`)

        // Actualizar datos locales
        await this.updateUserData({
          configuracion: configResponse.data,
        })
      }

      console.log(`[UserService] Tema cambiado exitosamente a: ${theme}`)

      // Activar el flag para forzar la actualización en la próxima carga
      await AsyncStorage.setItem(this.FORCE_DB_REFRESH, "true")

      return true
    } catch (error) {
      console.error("[UserService] Error cambiando tema:", error)
      // Mostrar detalles del error para depuración
      if (axios.isAxiosError(error)) {
        console.error("[UserService] Detalles del error de Axios:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        })
      }
      return false
    }
  }

  /**
   * Convierte un valor de color_aplicacion a un tipo de tema
   * @param colorAplicacion El valor de color_aplicacion ("blanco" o "negro")
   * @returns "light" para "blanco", "dark" para "negro"
   */
  static getThemeFromColorAplicacion(colorAplicacion: string): "light" | "dark" {
    // Normalizar el valor para manejar posibles variaciones
    const color = colorAplicacion?.toLowerCase()?.trim() || ""

    if (color === "negro") {
      return "dark"
    }

    // Para cualquier otro valor (incluyendo "blanco" o valores no esperados), usar light
    return "light"
  }

  /**
   * Convierte un tipo de tema a un valor de color_aplicacion
   * @param theme El tema ("light" o "dark")
   * @returns "blanco" para "light", "negro" para "dark"
   */
  static getColorAplicacionFromTheme(theme: "light" | "dark"): string {
    return theme === "dark" ? "negro" : "blanco"
  }
}

export default UserService
