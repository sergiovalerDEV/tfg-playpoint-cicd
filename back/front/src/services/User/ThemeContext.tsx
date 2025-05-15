"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ChangeThemeService, { type ThemeType } from "./ChangeThemeService"

// Interfaz para el contexto del tema
interface ThemeContextType {
  theme: ThemeType
  setTheme: (theme: ThemeType) => Promise<void>
  isLoading: boolean
}

// Crear el contexto con un valor por defecto
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: async () => {},
  isLoading: true,
})

// Hook personalizado para usar el contexto del tema
export const useTheme = () => useContext(ThemeContext)

// Proveedor del contexto del tema
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>("light")
  const [isLoading, setIsLoading] = useState(true)

  // Cargar el tema al iniciar la aplicación
  useEffect(() => {
    const loadTheme = async () => {
      try {
        console.log("[ThemeContext] Cargando tema...")
        setIsLoading(true)

        // Primero intentar obtener el tema de AsyncStorage (para respuesta rápida)
        const storedTheme = await AsyncStorage.getItem(ChangeThemeService.THEME_STORAGE_KEY)
        if (storedTheme) {
          console.log(`[ThemeContext] Tema encontrado en AsyncStorage: ${storedTheme}`)
          setThemeState(storedTheme as ThemeType)
        }

        // Verificar si el usuario está autenticado
        const isLoggedIn = await ChangeThemeService.isUserLoggedIn()
        if (isLoggedIn) {
          console.log("[ThemeContext] Usuario autenticado, obteniendo tema desde BD...")
          
          // Obtener el tema del usuario desde el servicio (consulta la BD)
          const userTheme = await ChangeThemeService.getCurrentTheme()
          console.log(`[ThemeContext] Tema cargado desde BD: ${userTheme}`)
          
          setThemeState(userTheme)
        } else {
          console.log("[ThemeContext] No hay usuario autenticado, usando tema por defecto o almacenado")
        }
      } catch (error) {
        console.error("[ThemeContext] Error cargando tema:", error)
        // En caso de error, usar el tema claro por defecto
        setThemeState("light")
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [])

  // Función para cambiar el tema
  const setTheme = async (newTheme: ThemeType) => {
    try {
      console.log(`[ThemeContext] Cambiando tema a: ${newTheme}`)

      // Actualizar el estado local inmediatamente para una respuesta rápida
      setThemeState(newTheme)

      // Guardar en AsyncStorage para persistencia local
      await AsyncStorage.setItem(ChangeThemeService.THEME_STORAGE_KEY, newTheme)

      // Verificar si el usuario está autenticado antes de actualizar en BD
      const isLoggedIn = await ChangeThemeService.isUserLoggedIn()
      if (isLoggedIn) {
        // Actualizar el tema en la base de datos
        const success = await ChangeThemeService.changeTheme(newTheme)

        if (!success) {
          console.error("[ThemeContext] No se pudo actualizar el tema en la base de datos")

          // Obtener el tema actual de la base de datos para sincronizar
          const currentTheme = await ChangeThemeService.getCurrentTheme()
          setThemeState(currentTheme)
        } else {
          console.log("[ThemeContext] Tema actualizado correctamente en la base de datos")
        }
      } else {
        console.log("[ThemeContext] Usuario no autenticado, tema guardado solo localmente")
      }
    } catch (error) {
      console.error("[ThemeContext] Error cambiando tema:", error)
      // Si hay un error, intentar obtener el tema actual
      try {
        const currentTheme = await ChangeThemeService.getCurrentTheme()
        setThemeState(currentTheme)
      } catch {
        // Si falla, mantener el tema actual
      }
    }
  }

  // Valor del contexto
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    isLoading,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export default ThemeContext
