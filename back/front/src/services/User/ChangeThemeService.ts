import AsyncStorage from "@react-native-async-storage/async-storage"
import axios from "axios"
import UserService from "./UserService"
import { API_URL } from "../../../config"

// Tipos de tema
export type ThemeType = "light" | "dark"

/**
 * Servicio para gestionar el tema de la aplicación
 */
class ChangeThemeService {
  // Clave para almacenamiento local
  static readonly THEME_STORAGE_KEY = "app_theme"

  /**
   * Verifica si el usuario está autenticado
   */
  static async isUserLoggedIn(): Promise<boolean> {
    return UserService.isLoggedIn()
  }

  /**
   * Obtiene el tema actual del usuario basado en su configuración
   * @returns El tema actual ("light" o "dark")
   */
  static async getCurrentTheme(): Promise<ThemeType> {
    try {
      console.log("[ChangeThemeService] Obteniendo tema actual directamente de la base de datos...")

      // Obtener usuario actual
      const user = await UserService.getCurrentUser()
      if (!user) {
        console.log("[ChangeThemeService] No hay usuario autenticado, usando tema por defecto")
        return "light"
      }

      // Obtener token
      const token = await UserService.getAccessToken()
      if (!token) {
        console.log("[ChangeThemeService] No hay token de autenticación, usando tema por defecto")
        return "light"
      }

      // Obtener el ID de configuración
      const configId = typeof user.configuracion === "object" ? user.configuracion.id : user.configuracion

      if (!configId) {
        console.log("[ChangeThemeService] No se encontró ID de configuración, usando tema por defecto")
        return "light"
      }

      console.log(`[ChangeThemeService] Consultando configuración en BD para ID: ${configId}`)

      try {
        // Obtener configuración directamente de la base de datos
        const response = await axios.get(`${API_URL}/configuracion/${configId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log(`[ChangeThemeService] RESPUESTA DE CONFIGURACIÓN DE BD:`, JSON.stringify(response.data))

        if (!response.data || !response.data.color_aplicacion) {
          console.log("[ChangeThemeService] No se pudo obtener color_aplicacion de la BD, usando tema por defecto")
          return "light"
        }

        // Determinar el tema basado en color_aplicacion
        const theme: ThemeType = response.data.color_aplicacion === "negro" ? "dark" : "light"

        console.log(
          `[ChangeThemeService] TEMA OBTENIDO DIRECTAMENTE DE BD: ${theme} (color: ${response.data.color_aplicacion})`,
        )

        // Guardar en almacenamiento local
        await AsyncStorage.setItem(this.THEME_STORAGE_KEY, theme)

        // Actualizar la configuración en el objeto de usuario
        if (typeof user.configuracion === "object") {
          user.configuracion.color_aplicacion = response.data.color_aplicacion
          await UserService.updateUserData({ configuracion: user.configuracion })
        } else {
          await UserService.updateUserData({ configuracion: response.data })
        }

        return theme
      } catch (error) {
        console.error("[ChangeThemeService] Error obteniendo tema de BD:", error)
        console.log("[ChangeThemeService] Usando configuración en caché como respaldo")

        // Si falla la petición, usar la configuración que viene en el objeto de usuario
        if (typeof user.configuracion === "object" && user.configuracion.color_aplicacion) {
          const colorApp = user.configuracion.color_aplicacion
          const theme = colorApp === "negro" ? "dark" : "light"

          console.log(`[ChangeThemeService] Usando tema de respaldo: ${theme} (color: ${colorApp})`)
          return theme
        }

        return "light" // Tema por defecto en caso de error
      }
    } catch (error) {
      console.error("[ChangeThemeService] Error obteniendo tema:", error)
      return "light" // Tema por defecto en caso de error
    }
  }

  /**
   * Cambia el tema de la aplicación y actualiza la configuración en la base de datos
   * @param theme El nuevo tema ("light" o "dark")
   * @returns true si se cambió correctamente, false en caso de error
   */
  static async changeTheme(theme: ThemeType): Promise<boolean> {
    try {
      console.log(`[ChangeThemeService] Cambiando tema a: ${theme}`)

      // Guardar en almacenamiento local para respuesta inmediata
      await AsyncStorage.setItem(this.THEME_STORAGE_KEY, theme)

      // Obtener usuario actual
      const user = await UserService.getCurrentUser()
      if (!user) {
        throw new Error("Usuario no encontrado")
      }

      // Obtener token de autenticación
      const token = await UserService.getAccessToken()
      if (!token) {
        throw new Error("Token de autenticación no encontrado")
      }

      // Obtener el ID de configuración del usuario
      const configId = typeof user.configuracion === "object" ? user.configuracion.id : user.configuracion

      if (!configId) {
        throw new Error("ID de configuración no encontrado")
      }

      // Convertir tema a valor de color_aplicacion
      // light = "blanco", dark = "negro"
      const colorAplicacion = theme === "dark" ? "negro" : "blanco"
      console.log(`[ChangeThemeService] Valor de color_aplicacion a enviar: ${colorAplicacion}`)

      // IMPORTANTE: Estructura correcta para el backend
      const params = {
        configuracion: configId, // Usar 'configuracion' como espera el controlador
        color_aplicacion: colorAplicacion,
      }

      console.log(`[ChangeThemeService] Enviando parámetros al backend:`, JSON.stringify(params))

      // Actualizar la configuración en el backend
      const response = await axios.post(`${API_URL}/configuracion/cambiartema`, params, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log(`[ChangeThemeService] Respuesta del backend:`, JSON.stringify(response.data))
      
      // Actualizar la configuración en el objeto de usuario
      if (typeof user.configuracion === "object") {
        user.configuracion.color_aplicacion = colorAplicacion
        await UserService.updateUserData({ configuracion: user.configuracion })
      }
      
      // Forzar una espera para asegurar que la base de datos se actualice
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return true
    } catch (error) {
      console.error("[ChangeThemeService] Error cambiando tema:", error)
      // Mostrar detalles del error para depuración
      if (axios.isAxiosError(error)) {
        console.error("[ChangeThemeService] Detalles del error de Axios:", {
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
  static getThemeFromColorAplicacion(colorAplicacion: string): ThemeType {
    return colorAplicacion === "negro" ? "dark" : "light"
  }

  /**
   * Convierte un tipo de tema a un valor de color_aplicacion
   * @param theme El tema ("light" o "dark")
   * @returns "blanco" para "light", "negro" para "dark"
   */
  static getColorAplicacionFromTheme(theme: ThemeType): string {
    return theme === "dark" ? "negro" : "blanco"
  }

  /**
   * Inicializa el tema después del login
   * @returns El tema inicializado
   */
  static async initializeThemeAfterLogin(): Promise<ThemeType> {
    try {
      console.log("[ChangeThemeService] Inicializando tema después del login...")
      
      // Obtener el tema actual de la base de datos
      const theme = await this.getCurrentTheme()
      
      // Guardar en almacenamiento local
      await AsyncStorage.setItem(this.THEME_STORAGE_KEY, theme)
      
      console.log(`[ChangeThemeService] Tema inicializado: ${theme}`)
      
      return theme
    } catch (error) {
      console.error("[ChangeThemeService] Error inicializando tema después del login:", error)
      return "light" // Tema por defecto en caso de error
    }
  }
}

export default ChangeThemeService
