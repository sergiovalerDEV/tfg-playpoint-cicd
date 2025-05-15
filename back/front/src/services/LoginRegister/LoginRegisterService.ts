import axios, { type AxiosError } from "axios"
import UserService from "../User/UserService"
import type { User, AuthResponse } from "../User/UserService"
import { API_URL } from "../../../config"

// Interfaces para tipado
interface LoginParams {
  nombre: string
  contrasena: string
}

interface RegisterParams {
  nombre: string
  correo: string
  contrasena: string
  numero_telefono: string
}

interface RegisterResponse {
  identifiers: {
    id: number
  }
  generatedMaps: Array<{
    id: number
  }>
  raw: any
}

/**
 * Servicio para manejar autenticación y registro
 */
class LoginRegisterService {
  /**
   * Inicia sesión con nombre y contraseña
   */
  static async login(params: LoginParams): Promise<{ 
    success: boolean
    data?: User
    message?: string 
  }> {
    try {
      // Validación básica
      if (!params.nombre.trim() || !params.contrasena) {
        return {
          success: false,
          message: "El nombre de usuario y la contraseña son requeridos",
        }
      }

      // Llamada a la API
      const response = await axios.post<AuthResponse>(`${API_URL}/usuario/login`, params)
      
      // Verificar respuesta
      if (response.data.mensaje) {
        return { success: false, message: response.data.mensaje }
      }

      if (!response.data.access_token || !response.data.usuario || response.data.usuario.length === 0) {
        return {
          success: false,
          message: "Respuesta del servidor inválida",
        }
      }

      // Almacenar datos usando UserService
      await UserService.storeUserData(response.data)

      // Configurar token para futuras peticiones
      axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.access_token}`

      return { 
        success: true, 
        data: response.data.usuario[0] 
      }
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error)
      
      // Manejar diferentes tipos de errores
      let mensaje = "Error de conexión. Verifica tu internet."
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        if (axiosError.response) {
          const estado = axiosError.response.status
          
          if (estado === 401) {
            mensaje = "Usuario o contraseña incorrectos"
          } else if (estado === 404) {
            mensaje = "Servidor no encontrado"
          } else {
            mensaje = `Error del servidor: ${(axiosError.response.data as any)?.mensaje || estado}`
          }
        }
      }
      
      return { success: false, message: mensaje }
    }
  }

  /**
   * Registra un nuevo usuario
   */
  static async register(params: RegisterParams): Promise<{ 
    success: boolean
    data?: any
    message?: string 
  }> {
    try {
      // Validar número telefónico
      const numeroTelefono = params.numero_telefono.replace(/\D/g, "")
      
      if (numeroTelefono.length < 9) {
        return {
          success: false,
          message: "Por favor ingresa un número telefónico válido",
        }
      }
      
      // Crear objeto con datos validados
      const datosRegistro = {
        ...params,
        numero_telefono: parseInt(numeroTelefono, 10),
      }
      
      // Llamar al endpoint de registro
      const response = await axios.post<RegisterResponse>(
        `${API_URL}/usuario/registro`, 
        datosRegistro
      )
      
      if (response.status >= 200 && response.status < 300) {
        return { 
          success: true, 
          data: response.data 
        }
      } else {
        return { 
          success: false, 
          message: "El registro falló. Por favor intenta nuevamente." 
        }
      }
    } catch (error: any) {
      console.error("Error de registro:", error)
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError
        
        if (axiosError.response?.status === 409 || 
            (axiosError.response?.data as any)?.message?.includes("duplicate")) {
          return { 
            success: false, 
            message: "Este nombre de usuario ya está en uso. Por favor elige otro." 
          }
        }
        
        if (axiosError.response?.status === 400) {
          return { 
            success: false, 
            message: "Por favor verifica tu información e intenta nuevamente." 
          }
        }
      }
      
      return { 
        success: false, 
        message: "Ocurrió un error inesperado" 
      }
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  static async logout(): Promise<void> {
    try {
      // Usar UserService para limpiar datos
      await UserService.logout()
      
      // Eliminar encabezado de autorización
      delete axios.defaults.headers.common["Authorization"]
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  /**
   * Verifica si el token está expirado
   */
  static isTokenExpired(token: string): boolean {
    try {
      // Decodificar token JWT
      const base64Decode = (str: string): string => {
        return decodeURIComponent(
          Array.prototype.map
            .call(
              atob(str.replace(/-/g, "+").replace(/_/g, "/")),
              (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
            )
            .join("")
        )
      }

      const parts = token.split(".")
      if (parts.length !== 3) {
        throw new Error("Formato de token inválido")
      }

      const payload = JSON.parse(base64Decode(parts[1]))
      const tiempoExpiracion = payload.exp * 1000 // Convertir a milisegundos
      return Date.now() >= tiempoExpiracion
    } catch (error) {
      console.error("Error de validación de token:", error)
      return true // Asumir que el token está expirado si hay un error
    }
  }

  /**
   * Actualiza el token si es necesario
   */
  static async refreshTokenIfNeeded(): Promise<boolean> {
    const token = await UserService.getAccessToken()
    
    if (!token) {
      return false
    }

    if (this.isTokenExpired(token)) {
      await this.logout()
      return false
    }

    return true
  }

  /**
   * Obtiene los datos del usuario actual
   */
  static async getUserData(): Promise<User | null> {
    try {
      // Primero verificar si tenemos datos en almacenamiento
      const userData = await UserService.getCurrentUser()
      if (userData) {
        return userData
      }
      
      // Si no hay datos pero tenemos token, obtener datos de la API
      const token = await UserService.getAccessToken()
      if (token) {
        const api = axios.create({
          baseURL: API_URL,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        })
        
        const response = await api.get("/usuario/perfil")
        
        if (response.data) {
          // Actualizar datos en UserService
          await UserService.updateUserData(response.data)
          return response.data
        }
      }
      
      return null
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      return null
    }
  }

  /**
   * Obtiene una instancia de axios con autorización
   */
  static async getAuthenticatedAxios() {
    const token = await UserService.getAccessToken()
    return axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      },
    })
  }
}

export default LoginRegisterService
