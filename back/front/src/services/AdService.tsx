import axios from "axios"
import { API_URL } from "../../config"
import UserService from "./User/UserService"

export interface Ad {
  id: number
  nombre: string
  descripcion: string
  imagenes: string[]
  video: string
}

class AdService {
  private static _cachedAds: Ad[] = []
  private static _lastFetchTime = 0
  private static _cacheExpirationTime = 5 * 60 * 1000 // 5 minutos

  /**
   * Obtiene una instancia de axios autenticada
   */
  static async getAuthenticatedAxios() {
    const token = await UserService.getAccessToken()

    if (!token) {
      throw new Error("Token de autenticación no encontrado")
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
   * Verifica si la caché ha expirado
   */
  static isCacheExpired(): boolean {
    const now = Date.now()
    return now - this._lastFetchTime > this._cacheExpirationTime
  }

  /**
   * Obtiene todos los anuncios disponibles
   */
  static async getAllAds(): Promise<Ad[]> {
    try {
      // Si tenemos anuncios en caché y no ha expirado, devolverlos
      if (this._cachedAds.length > 0 && !this.isCacheExpired()) {
        console.log(`📋 Devolviendo ${this._cachedAds.length} anuncios desde caché`)
        return this._cachedAds
      }

      console.log("🔍 Obteniendo anuncios desde la API...")

      // Obtener instancia autenticada de axios
      const api = await this.getAuthenticatedAxios()

      // Llamar al endpoint para obtener todos los anuncios
      const response = await api.get("/anuncio")

      if (Array.isArray(response.data)) {
        console.log(`✅ Obtenidos ${response.data.length} anuncios desde la API`)

        // Actualizar la caché
        this._cachedAds = response.data
        this._lastFetchTime = Date.now()

        return response.data
      }

      console.error("❌ La respuesta de /anuncio no es un array")
      return []
    } catch (error) {
      console.error("❌ Error al obtener anuncios:", error)

      // Si hay un error pero tenemos anuncios en caché, devolverlos como fallback
      if (this._cachedAds.length > 0) {
        console.log("⚠️ Devolviendo anuncios desde caché como fallback debido a error")
        return this._cachedAds
      }

      return []
    }
  }

  /**
   * Obtiene un número específico de anuncios aleatorios
   * @param count Número de anuncios a obtener
   */
  static async getRandomAds(count: number): Promise<Ad[]> {
    try {
      // Obtener todos los anuncios
      const allAds = await this.getAllAds()
      
      if (allAds.length === 0) {
        return []
      }

      // Si hay menos anuncios que los solicitados, devolver todos
      if (allAds.length <= count) {
        return allAds
      }

      // Seleccionar anuncios aleatorios
      const randomAds: Ad[] = []
      const usedIndexes = new Set<number>()

      while (randomAds.length < count && usedIndexes.size < allAds.length) {
        const randomIndex = Math.floor(Math.random() * allAds.length)
        
        if (!usedIndexes.has(randomIndex)) {
          usedIndexes.add(randomIndex)
          randomAds.push(allAds[randomIndex])
        }
      }

      return randomAds
    } catch (error) {
      console.error("❌ Error al obtener anuncios aleatorios:", error)
      return []
    }
  }
}

export default AdService