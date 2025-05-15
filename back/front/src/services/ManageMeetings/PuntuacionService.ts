import UserService from "../User/UserService"

// Definición de tipos
export interface AnadirPuntuacionDto {
  puntuacion: number
  equipo: number
  quedada: number
}

export interface Puntuacion {
  id: number
  equipo: number
  puntuacion: number
  quedada: {
    id: number
    nombre?: string
  }
}

/**
 * Servicio para gestionar las puntuaciones de las quedadas
 */
class PuntuacionService {
  /**
   * Añade una puntuación para un equipo en una quedada específica
   * @param quedadaId ID de la quedada
   * @param equipoId ID del equipo
   * @param puntuacion Valor de la puntuación (1-10)
   * @returns true si se añadió correctamente, false en caso contrario
   */
  static async anadirPuntuacion(quedadaId: number, equipoId: number, puntuacion: number): Promise<boolean> {
    try {
      console.log(`🏆 Añadiendo puntuación ${puntuacion} al equipo ${equipoId} en quedada ${quedadaId}`)

      // Validar puntuación
      if (puntuacion < 1 || puntuacion > 10) {
        console.error("❌ Puntuación inválida. Debe estar entre 1 y 10")
        return false
      }

      // Obtener instancia autenticada de axios
      const api = await UserService.getAuthenticatedAxios()

      // Crear DTO para enviar al backend
      const puntuacionDto: AnadirPuntuacionDto = {
        puntuacion,
        equipo: equipoId,
        quedada: quedadaId,
      }

      // Enviar petición al backend
      const response = await api.post("/puntuacion/anadir", puntuacionDto)

      console.log(`✅ Puntuación añadida correctamente:`, response.data)
      
      return true
    } catch (error) {
      console.error("❌ Error al añadir puntuación:", error)
      return false
    }
  }

  /**
   * Suma puntos competitivos a un usuario
   * @param userId ID del usuario
   * @param puntos Cantidad de puntos a sumar
   * @returns true si se sumaron correctamente, false en caso contrario
   */
  static async sumarPuntosCompetitivos(userId: number, puntos: number): Promise<boolean> {
    try {
      console.log(`🔺 Sumando ${puntos} puntos competitivos al usuario ${userId}`)
      
      // Obtener instancia autenticada de axios
      const api = await UserService.getAuthenticatedAxios()
      
      // Llamar al endpoint para sumar puntos
      const response = await api.post("/usuario/puntos/sumar", {
        id: userId,
        puntos: puntos
      })
      
      console.log(`✅ Puntos competitivos sumados correctamente:`, response.data)
      return true
    } catch (error) {
      console.error(`❌ Error al sumar puntos competitivos al usuario ${userId}:`, error)
      return false
    }
  }

  /**
   * Resta puntos competitivos a un usuario
   * @param userId ID del usuario
   * @param puntos Cantidad de puntos a restar
   * @returns true si se restaron correctamente, false en caso contrario
   */
  static async restarPuntosCompetitivos(userId: number, puntos: number): Promise<boolean> {
    try {
      console.log(`🔻 Restando ${puntos} puntos competitivos al usuario ${userId}`)
      
      // Obtener instancia autenticada de axios
      const api = await UserService.getAuthenticatedAxios()
      
      // Llamar al endpoint para restar puntos
      const response = await api.post("/usuario/puntos/restar", {
        id: userId,
        puntos: puntos
      })
      
      console.log(`✅ Puntos competitivos restados correctamente:`, response.data)
      return true
    } catch (error) {
      console.error(`❌ Error al restar puntos competitivos al usuario ${userId}:`, error)
      return false
    }
  }

  /**
   * Verifica si un equipo ya tiene puntuación en una quedada
   * @param quedadaId ID de la quedada
   * @param equipoId ID del equipo
   * @returns true si ya tiene puntuación, false en caso contrario
   */
  static async equipoTienePuntuacion(quedadaId: number, equipoId: number): Promise<boolean> {
    try {
      // Obtener todas las puntuaciones de la quedada
      const puntuaciones = await this.getPuntuacionesByQuedadaId(quedadaId)

      // Verificar si existe alguna puntuación para el equipo
      return puntuaciones.some((p) => p.equipo === equipoId)
    } catch (error) {
      console.error("❌ Error al verificar puntuación de equipo:", error)
      return false
    }
  }

  /**
   * Obtiene todas las puntuaciones de una quedada
   * @param quedadaId ID de la quedada
   * @returns Array de puntuaciones
   */
  static async getPuntuacionesByQuedadaId(quedadaId: number): Promise<Puntuacion[]> {
    try {
      console.log(`🔍 Obteniendo puntuaciones para quedada ${quedadaId}`)

      // IMPORTANTE: NUNCA usar el endpoint directo /quedada/{id} que causa error 404
      // Usar EXCLUSIVAMENTE el endpoint de filtrado que funciona correctamente
      const api = await UserService.getAuthenticatedAxios()
      const filterResponse = await api.post("/quedada/filtrar", { id: quedadaId })

      if (filterResponse.data && Array.isArray(filterResponse.data) && filterResponse.data.length > 0) {
        const quedada = filterResponse.data.find((q) => q.id === quedadaId)

        if (quedada && quedada.puntuaciones) {
          console.log(`✅ Se encontraron ${quedada.puntuaciones.length} puntuaciones mediante filtrado`)
          return quedada.puntuaciones
        }
      }

      // Si llegamos aquí, no se encontraron puntuaciones
      console.log(`ℹ️ No se encontraron puntuaciones para la quedada ${quedadaId}`)
      return []
    } catch (error) {
      console.error("❌ Error al obtener puntuaciones:", error)
      return []
    }
  }
  
  /**
   * Verifica si una quedada ya ha sido puntuada
   * @param quedadaId ID de la quedada
   * @returns true si ya tiene puntuaciones, false en caso contrario
   */
  static async quedadaTienePuntuaciones(quedadaId: number): Promise<boolean> {
    try {
      const puntuaciones = await this.getPuntuacionesByQuedadaId(quedadaId)
      return puntuaciones.length > 0
    } catch (error) {
      console.error("❌ Error al verificar si la quedada tiene puntuaciones:", error)
      return false
    }
  }
  
  /**
   * Actualiza la puntuación competitiva basada en el resultado del partido
   * @param quedadaId ID de la quedada
   * @returns true si se actualizó correctamente, false en caso contrario
   */
  static async actualizarPuntuacionCompetitivaPorResultado(quedadaId: number): Promise<boolean> {
    try {
      console.log(`🏆 Actualizando puntuación competitiva basada en resultado para quedada ${quedadaId}`)
      
      // Obtener todas las puntuaciones de la quedada
      const puntuaciones = await this.getPuntuacionesByQuedadaId(quedadaId)
      
      if (puntuaciones.length === 0) {
        console.log(`ℹ️ No hay puntuaciones para la quedada ${quedadaId}`)
        return false
      }
      
      // Obtener instancia autenticada de axios
      const api = await UserService.getAuthenticatedAxios()
      
      // Obtener detalles de la quedada para acceder a los usuarios
      const response = await api.post("/quedada/filtrar", { id: quedadaId })
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        console.error("❌ No se pudo obtener información de la quedada")
        return false
      }
      
      const quedada = response.data[0]
      
      if (!quedada.usuarioquedada || !Array.isArray(quedada.usuarioquedada)) {
        console.error("❌ No hay información de usuarios en la quedada")
        return false
      }
      
      // Verificar si hay empate (todas las puntuaciones son iguales)
      const hayEmpate = this.verificarEmpate(puntuaciones)
      
      if (hayEmpate) {
        console.log(`🤝 Hay un empate en la quedada ${quedadaId}, todos los equipos reciben puntos`)
        
        // En caso de empate, sumar puntos a todos los participantes
        for (const usuarioQuedada of quedada.usuarioquedada) {
          const userId = usuarioQuedada.usuario.id
          const equipoUsuario = usuarioQuedada.equipo
          
          // Buscar la puntuación del equipo del usuario
          const puntuacionEquipo = puntuaciones.find(p => p.equipo === equipoUsuario)
          
          if (puntuacionEquipo) {
            // Sumar la puntuación del equipo a los puntos competitivos del usuario
            const puntosASumar = puntuacionEquipo.puntuacion
            console.log(`🎖️ Usuario ${userId} (equipo ${equipoUsuario}): +${puntosASumar} puntos (empate)`)
            await this.sumarPuntosCompetitivos(userId, puntosASumar)
          }
        }
      } else {
        // No hay empate, determinar equipo ganador y perdedor
        const equiposPuntuaciones = new Map<number, number>()
        
        // Crear mapa de equipos y sus puntuaciones
        for (const puntuacion of puntuaciones) {
          equiposPuntuaciones.set(puntuacion.equipo, puntuacion.puntuacion)
        }
        
        // Ordenar equipos por puntuación (de mayor a menor)
        const equiposOrdenados = Array.from(equiposPuntuaciones.entries())
          .sort((a, b) => b[1] - a[1])
        
        console.log(`📊 Equipos ordenados por puntuación:`, equiposOrdenados)
        
        // Procesar cada usuario según su equipo
        for (const usuarioQuedada of quedada.usuarioquedada) {
          const userId = usuarioQuedada.usuario.id
          const equipoUsuario = usuarioQuedada.equipo
          
          // Buscar la puntuación del equipo del usuario
          const puntuacionEquipo = equiposPuntuaciones.get(equipoUsuario)
          
          if (puntuacionEquipo !== undefined) {
            // Verificar si el equipo del usuario es el que tiene mayor puntuación
            if (equipoUsuario === equiposOrdenados[0][0]) {
              // Equipo ganador: sumar puntos
              console.log(`🏅 Usuario ${userId} (equipo ${equipoUsuario}): +${puntuacionEquipo} puntos (equipo ganador)`)
              await this.sumarPuntosCompetitivos(userId, puntuacionEquipo)
            } else {
              // Equipo perdedor: restar puntos
              console.log(`📉 Usuario ${userId} (equipo ${equipoUsuario}): -${puntuacionEquipo} puntos (equipo perdedor)`)
              await this.restarPuntosCompetitivos(userId, puntuacionEquipo)
            }
          }
        }
      }
      
      console.log(`✅ Actualización de puntuación competitiva por resultado completada`)
      return true
    } catch (error) {
      console.error("❌ Error al actualizar puntuación competitiva por resultado:", error)
      return false
    }
  }
  
  /**
   * Verifica si hay empate entre las puntuaciones
   * @param puntuaciones Lista de puntuaciones
   * @returns true si todas las puntuaciones son iguales, false en caso contrario
   */
  static verificarEmpate(puntuaciones: Puntuacion[]): boolean {
    if (puntuaciones.length <= 1) {
      return true
    }
    
    const primeraPuntuacion = puntuaciones[0].puntuacion
    return puntuaciones.every(p => p.puntuacion === primeraPuntuacion)
  }
}

export default PuntuacionService