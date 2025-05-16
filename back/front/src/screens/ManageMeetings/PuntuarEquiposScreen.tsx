"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import PuntuacionService from "../../services/ManageMeetings/PuntuacionService"
import UserService from "../../services/User/UserService"
import { useTheme } from "../../contexts/ThemeContext"

type Props = {
  navigation: any
  route: any
}

// Interfaz para el equipo con su puntuación
interface EquipoConPuntuacion {
  id: number
  nombre: string
  puntuacion: number
  tienePuntuacion: boolean
  jugadores: {
    id: number
    nombre: string
  }[]
}

const PuntuarEquiposScreen: React.FC<Props> = ({ navigation, route }) => {
  // Obtener el ID de la quedada y el modo de solo lectura de los parámetros de la ruta
  const { quedadaId, soloLectura = false } = route.params

  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Estados
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quedadaNombre, setQuedadaNombre] = useState<string>("")
  const [equipos, setEquipos] = useState<EquipoConPuntuacion[]>([])
  const [puntuacionesModificadas, setPuntuacionesModificadas] = useState<boolean>(false)
  const [esCompetitiva, setEsCompetitiva] = useState<boolean>(false)
  // Nuevo estado para el multiplicador del deporte
  const [multiplicadorDeporte, setMultiplicadorDeporte] = useState<number>(1)

  // Cargar fuentes
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Cargar datos de la quedada y equipos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log(`🔄 Cargando datos para puntuar equipos de quedada ${quedadaId}`)

        // IMPORTANTE: NUNCA usar el método getMeetingById que causa error 404
        // Usar EXCLUSIVAMENTE el endpoint de filtrado que funciona correctamente
        const api = await UserService.getAuthenticatedAxios()
        const response = await api.post("/quedada/filtrar", { id: quedadaId })

        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          throw new Error("No se pudo obtener la información de la quedada")
        }

        // Buscar la quedada con el ID exacto
        console.log("rd", response.data)
        const quedada = response.data.find((q) => q.id === quedadaId)

        if (!quedada) {
          throw new Error("No se pudo encontrar la quedada con el ID especificado")
        }

        // Verificar que la quedada esté cerrada
        if (quedada.abierta) {
          throw new Error("No se pueden puntuar equipos de una quedada que no está cerrada")
        }

        setQuedadaNombre(quedada.nombre || `Quedada #${quedadaId}`)

        // Guardar si la quedada es competitiva
        setEsCompetitiva(quedada.competitividad === true)
        console.log(`ℹ️ La quedada ${quedadaId} es competitiva: ${quedada.competitividad === true}`)

        // Obtener el multiplicador del deporte
        const multiplicador = quedada.deporte?.multiplicador_puntuacion_competitiva || 1
        setMultiplicadorDeporte(multiplicador)
        console.log(`ℹ️ Multiplicador del deporte: ${multiplicador}`)

        // Obtener puntuaciones existentes
        const puntuacionesExistentes = await PuntuacionService.getPuntuacionesByQuedadaId(quedadaId)

        // Organizar equipos con sus jugadores
        const equiposData: EquipoConPuntuacion[] = []
        const numEquipos = quedada.deporte?.numero_equipos || 2

        // Crear estructura de equipos
        for (let i = 1; i <= numEquipos; i++) {
          // Buscar jugadores de este equipo
          const jugadores = quedada.usuarioquedada
            ? quedada.usuarioquedada
                .filter((uq: { equipo: number }) => uq.equipo === i)
                .map((uq: { usuario: { id: number; nombre?: string } }) => ({
                  id: uq.usuario.id,
                  nombre: uq.usuario.nombre || "Usuario",
                }))
            : []

          // Buscar si ya tiene puntuación
          const puntuacionExistente = puntuacionesExistentes.find((p) => p.equipo === i)

          // Si tiene puntuación, mostrar la puntuación original (antes de aplicar el multiplicador)
          let puntuacionOriginal = 5 // Valor por defecto
          if (puntuacionExistente) {
            // Calcular la puntuación original dividiendo por el multiplicador
            puntuacionOriginal = Math.round((puntuacionExistente.puntuacion / multiplicador) * 10) / 10
            // Asegurar que esté en el rango 1-10
            puntuacionOriginal = Math.max(1, Math.min(10, Math.round(puntuacionOriginal)))
          }

          equiposData.push({
            id: i,
            nombre: `Equipo ${i}`,
            puntuacion: puntuacionExistente ? puntuacionOriginal : 5, // Valor por defecto o puntuación original
            tienePuntuacion: !!puntuacionExistente,
            jugadores: jugadores,
          })
        }

        setEquipos(equiposData)
      } catch (error) {
        console.error("❌ Error al cargar datos:", error)
        setError(error instanceof Error ? error.message : "Error al cargar datos")
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [quedadaId])

  // Función para cambiar la puntuación de un equipo
  const cambiarPuntuacion = (equipoId: number, nuevaPuntuacion: number) => {
    setEquipos((prevEquipos) =>
      prevEquipos.map((equipo) => (equipo.id === equipoId ? { ...equipo, puntuacion: nuevaPuntuacion } : equipo)),
    )
    setPuntuacionesModificadas(true)
  }

  // Función para guardar las puntuaciones
  const guardarPuntuaciones = async () => {
    try {
      setSubmitting(true)

      // Verificar si hay puntuaciones para guardar
      const equiposSinPuntuacion = equipos.filter((e) => !e.tienePuntuacion)

      if (equiposSinPuntuacion.length === 0) {
        Alert.alert("Información", "Todos los equipos ya tienen puntuación asignada")
        setSubmitting(false)
        return
      }

      // Guardar puntuaciones para equipos que no tienen puntuación
      let exito = true
      for (const equipo of equiposSinPuntuacion) {
        console.log(
          `📊 Guardando puntuación ${equipo.puntuacion} para equipo ${equipo.id} con ${equipo.jugadores.length} jugadores`,
        )

        // Aquí se aplica el multiplicador al guardar la puntuación
        const resultado = await PuntuacionService.anadirPuntuacion(quedadaId, equipo.id, equipo.puntuacion)

        if (!resultado) {
          exito = false
          console.error(`❌ Error al guardar puntuación para equipo ${equipo.id}`)
        } else {
          console.log(`✅ Puntuación guardada correctamente para equipo ${equipo.id}`)
        }
      }

      // Si todas las puntuaciones se guardaron correctamente y la quedada es competitiva,
      // actualizar los puntos competitivos de los usuarios
      if (exito) {
        // Verificar si todos los equipos tienen puntuación ahora
        const todasPuntuacionesGuardadas = await verificarTodasPuntuacionesGuardadas()

        if (todasPuntuacionesGuardadas && esCompetitiva) {
          console.log(`🏆 Todas las puntuaciones guardadas. Actualizando puntos competitivos...`)

          // Actualizar puntos competitivos según las reglas:
          // 1. Equipo con más puntos: suma puntos
          // 2. Equipo con menos puntos: resta puntos
          // 3. Empate: todos suman puntos
          const resultadoActualizacion = await PuntuacionService.actualizarPuntuacionCompetitivaPorResultado(quedadaId)

          if (resultadoActualizacion) {
            console.log(`✅ Puntos competitivos actualizados correctamente`)
            Alert.alert(
              "Éxito",
              "Las puntuaciones se han guardado correctamente y los puntos competitivos han sido actualizados",
              [{ text: "OK", onPress: () => navigation.goBack() }],
            )
          } else {
            console.error(`❌ Error al actualizar puntos competitivos`)
            Alert.alert(
              "Advertencia",
              "Las puntuaciones se guardaron, pero hubo un problema al actualizar los puntos competitivos",
              [{ text: "OK", onPress: () => navigation.goBack() }],
            )
          }
        } else {
          // Si no es competitiva o faltan puntuaciones, solo mostrar mensaje de éxito
          Alert.alert("Éxito", "Las puntuaciones se han guardado correctamente", [
            { text: "OK", onPress: () => navigation.goBack() },
          ])
        }
      } else {
        Alert.alert("Error", "Hubo un problema al guardar algunas puntuaciones. Por favor, inténtalo de nuevo.")
      }
    } catch (error) {
      console.error("❌ Error al guardar puntuaciones:", error)
      Alert.alert("Error", "No se pudieron guardar las puntuaciones")
    } finally {
      setSubmitting(false)
    }
  }

  // Verificar si todos los equipos tienen puntuación
  const verificarTodasPuntuacionesGuardadas = async (): Promise<boolean> => {
    try {
      // Obtener puntuaciones actualizadas
      const puntuaciones = await PuntuacionService.getPuntuacionesByQuedadaId(quedadaId)

      // Verificar si hay puntuación para cada equipo
      for (const equipo of equipos) {
        const tienePuntuacion = puntuaciones.some((p) => p.equipo === equipo.id)
        if (!tienePuntuacion) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error("❌ Error al verificar puntuaciones guardadas:", error)
      return false
    }
  }

  // Renderizar botones de puntuación
  const renderPuntuacionButtons = (equipo: EquipoConPuntuacion) => {
    const buttons = []
    for (let i = 1; i <= 10; i++) {
      buttons.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.puntuacionButton,
            isDark && styles.puntuacionButtonDark,
            equipo.puntuacion === i && styles.puntuacionSelected,
            equipo.puntuacion === i && isDark && styles.puntuacionSelectedDark,
            equipo.tienePuntuacion && styles.puntuacionDisabled,
          ]}
          onPress={() => !equipo.tienePuntuacion && cambiarPuntuacion(equipo.id, i)}
          disabled={equipo.tienePuntuacion}
        >
          <Text
            style={[
              styles.puntuacionText,
              isDark && styles.puntuacionTextDark,
              equipo.puntuacion === i && styles.puntuacionSelectedText,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>,
      )
    }
    return buttons
  }

  // Si las fuentes no están cargadas, mostrar un contenedor vacío
  if (!fontsLoaded) {
    return <View style={[styles.container, isDark && styles.containerDark]} />
  }

  // Pantalla de carga
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#4CAF50" : "#006400"} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Cargando equipos...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Pantalla de error
  if (error) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} as any />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Puntuar Equipos</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={isDark ? "#FF5252" : "#D32F2F"} as any />
          <Text style={[styles.errorText, isDark && styles.errorTextDark]}>{error}</Text>
          <TouchableOpacity
            style={[styles.goBackButton, isDark && styles.goBackButtonDark]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} as any />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
          {soloLectura ? "Ver Puntuaciones" : "Puntuar Equipos"}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* Título de la quedada */}
        <Text style={[styles.quedadaTitle, isDark && styles.quedadaTitleDark]}>{quedadaNombre}</Text>

        {/* Instrucciones */}
        <View style={[styles.instructionsContainer, isDark && styles.instructionsContainerDark]}>
          {soloLectura ? (
            <Text style={[styles.instructionsText, isDark && styles.instructionsTextDark]}>
              Aquí puedes ver las puntuaciones asignadas a cada equipo en esta quedada.
            </Text>
          ) : (
            <>
              <Text style={[styles.instructionsText, isDark && styles.instructionsTextDark]}>
                Asigna una puntuación del 1 al 10 a cada equipo según su desempeño en la quedada.
              </Text>
              {esCompetitiva && (
                <Text style={[styles.instructionsText, isDark && styles.instructionsTextDark, styles.competitiveNote]}>
                  Esta es una quedada competitiva. Los puntos asignados afectarán a la puntuación competitiva de los
                  jugadores.
                </Text>
              )}
              {/* Mostrar información sobre el multiplicador si es diferente de 1 */}
              {multiplicadorDeporte !== 1 && esCompetitiva && (
                <Text style={[styles.instructionsText, isDark && styles.instructionsTextDark, styles.competitiveNote]}>
                  Este deporte tiene un multiplicador de puntuación de x{multiplicadorDeporte}.
                </Text>
              )}
              <Text style={[styles.instructionsText, styles.instructionsNote, isDark && styles.instructionsTextDark]}>
                Nota: Una vez asignada, la puntuación no se puede modificar.
              </Text>
            </>
          )}
        </View>

        {/* Lista de equipos */}
        {equipos.map((equipo) => (
          <View
            key={equipo.id}
            style={[
              styles.equipoCard,
              isDark && styles.equipoCardDark,
              (equipo.tienePuntuacion || soloLectura) && styles.equipoCardDisabled,
              (equipo.tienePuntuacion || soloLectura) && isDark && styles.equipoCardDisabledDark,
            ]}
          >
            <View style={styles.equipoHeader}>
              <Text style={[styles.equipoTitle, isDark && styles.equipoTitleDark]}>{equipo.nombre}</Text>
              {equipo.tienePuntuacion && (
                <View style={[styles.puntuacionBadge, isDark && styles.puntuacionBadgeDark]}>
                  <Text style={[styles.puntuacionBadgeText, isDark && styles.puntuacionBadgeTextDark]}>
                    Puntuación: {equipo.puntuacion}
                  </Text>
                </View>
              )}
            </View>

            {/* Jugadores del equipo */}
            <View style={styles.jugadoresContainer}>
              <Text style={[styles.jugadoresTitle, isDark && styles.jugadoresTitleDark]}>Jugadores:</Text>
              {equipo.jugadores.length > 0 ? (
                <View style={styles.jugadoresList}>
                  {equipo.jugadores.map((jugador) => (
                    <View key={jugador.id} style={[styles.jugadorItem, isDark && styles.jugadorItemDark]}>
                      <Ionicons name="person" size={16} color={isDark ? "#4CAF50" : "#006400"} as any />
                      <Text style={[styles.jugadorName, isDark && styles.jugadorNameDark]}>{jugador.nombre}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noJugadoresText, isDark && styles.noJugadoresTextDark]}>
                  No hay jugadores en este equipo
                </Text>
              )}
            </View>

            {/* Selector de puntuación */}
            <View style={styles.puntuacionContainer}>
              <Text style={[styles.puntuacionLabel, isDark && styles.puntuacionLabelDark]}>
                {equipo.tienePuntuacion || soloLectura ? "Puntuación asignada:" : "Selecciona una puntuación:"}
              </Text>

              <View style={styles.puntuacionButtonsContainer}>{renderPuntuacionButtons(equipo)}</View>

              {(equipo.tienePuntuacion || soloLectura) && (
                <View style={[styles.puntuacionResultado, isDark && styles.puntuacionResultadoDark]}>
                  <Ionicons name="star" size={20} color={isDark ? "#FFD700" : "#FFC107"} as any />
                  <Text style={[styles.puntuacionResultadoText, isDark && styles.puntuacionResultadoTextDark]}>
                    Este equipo ha sido puntuado con {equipo.puntuacion} {equipo.puntuacion === 1 ? "punto" : "puntos"}
                    {multiplicadorDeporte !== 1 && esCompetitiva
                      ? ` (x${multiplicadorDeporte} = ${Math.round(equipo.puntuacion * multiplicadorDeporte * 10) / 10} puntos competitivos)`
                      : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Botón de guardar - solo visible si no es modo solo lectura */}
        {!soloLectura && (
          <TouchableOpacity
            style={[
              styles.saveButton,
              isDark && styles.saveButtonDark,
              (!puntuacionesModificadas || submitting) && styles.saveButtonDisabled,
            ]}
            onPress={guardarPuntuaciones}
            disabled={!puntuacionesModificadas || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Guardar Puntuaciones</Text>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" as any />
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDark: {
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerDark: {
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    textAlign: "center",
  },
  headerTitleDark: {
    color: "#4CAF50",
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  quedadaTitle: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#333",
    marginBottom: 16,
  },
  quedadaTitleDark: {
    color: "#E0E0E0",
  },
  instructionsContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  instructionsContainerDark: {
    backgroundColor: "#2A2A2A",
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#333",
    marginBottom: 8,
  },
  instructionsTextDark: {
    color: "#E0E0E0",
  },
  instructionsNote: {
    fontStyle: "italic",
    marginBottom: 0,
  },
  competitiveNote: {
    color: "#006400",
    fontFamily: "Inter-Medium",
  },
  equipoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFF1F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  equipoCardDark: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
    shadowOpacity: 0.2,
  },
  equipoCardDisabled: {
    opacity: 0.8,
    borderColor: "#CCCCCC",
  },
  equipoCardDisabledDark: {
    borderColor: "#444444",
  },
  equipoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  equipoTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  equipoTitleDark: {
    color: "#4CAF50",
  },
  puntuacionBadge: {
    backgroundColor: "#E3F2FD",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
    minWidth: 100, // Add this line to ensure enough width for the score text
  },
  puntuacionBadgeDark: {
    backgroundColor: "#0D47A1",
  },
  puntuacionBadgeText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "#2196F3",
  },
  puntuacionBadgeTextDark: {
    color: "#64B5F6",
  },
  jugadoresContainer: {
    marginBottom: 16,
  },
  jugadoresTitle: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#333",
    marginBottom: 8,
  },
  jugadoresTitleDark: {
    color: "#E0E0E0",
  },
  jugadoresList: {
    gap: 8,
  },
  jugadorItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  jugadorItemDark: {},
  jugadorName: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  jugadorNameDark: {
    color: "#E0E0E0",
  },
  noJugadoresText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#999",
    fontStyle: "italic",
  },
  noJugadoresTextDark: {
    color: "#777",
  },
  puntuacionContainer: {
    borderTopWidth: 1,
    borderTopColor: "#EFF1F5",
    paddingTop: 16,
  },
  puntuacionLabel: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#333",
    marginBottom: 12,
  },
  puntuacionLabelDark: {
    color: "#E0E0E0",
  },
  puntuacionButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  puntuacionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  puntuacionButtonDark: {
    backgroundColor: "#2A2A2A",
    borderColor: "#444444",
  },
  puntuacionSelected: {
    backgroundColor: "#006400",
    borderColor: "#006400",
  },
  puntuacionSelectedDark: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  puntuacionDisabled: {
    opacity: 0.5,
  },
  puntuacionText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#333",
  },
  puntuacionTextDark: {
    color: "#E0E0E0",
  },
  puntuacionSelectedText: {
    color: "#FFFFFF",
  },
  puntuacionNote: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
  },
  puntuacionNoteDark: {
    color: "#777",
  },
  saveButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 8,
  },
  saveButtonDark: {
    backgroundColor: "#2E7D32",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  loadingTextDark: {
    color: "#aaa",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#D32F2F",
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  errorTextDark: {
    color: "#FF5252",
  },
  goBackButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#006400",
    borderRadius: 8,
  },
  goBackButtonDark: {
    backgroundColor: "#2E7D32",
  },
  goBackButtonText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#FFFFFF",
  },
  puntuacionResultado: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  puntuacionResultadoDark: {
    backgroundColor: "#3E2723",
    borderColor: "#4E342E",
  },
  puntuacionResultadoText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#F57F17",
    marginLeft: 8,
  },
  puntuacionResultadoTextDark: {
    color: "#FFD54F",
  },
})

export default PuntuarEquiposScreen
