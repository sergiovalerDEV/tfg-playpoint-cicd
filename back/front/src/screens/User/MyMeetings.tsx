"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert as RNAlert,
  Animated,
  Dimensions,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import MyMeetingsService, { type Quedada } from "../../services/ManageMeetings/MyMeetingsService"
import MeetingCard from "../../components/MeetingCard"
import Constants from "expo-constants"
import { useTheme } from "../../contexts/ThemeContext"
import SecondaryPageHeader from "../../components/headers/SecondaryPageHeader"

// Implementación directa de un componente de alerta para asegurar que se muestre
type InlineAlertType = "success" | "error" | "info" | "warning"

interface InlineAlertProps {
  visible: boolean
  type: InlineAlertType
  message: string
  onClose: () => void
}

const InlineAlert: React.FC<InlineAlertProps> = ({ visible, type, message, onClose }) => {
  const [slideAnim] = useState(new Animated.Value(-100))
  const [opacityAnim] = useState(new Animated.Value(0))

  // Configuración de colores según el tipo de alerta
  const getAlertStyle = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#006400", // Verde oscuro para éxito
          iconName: "checkmark-circle-outline",
          iconColor: "#FFFFFF",
        }
      case "error":
        return {
          backgroundColor: "#D32F2F", // Rojo para error
          iconName: "alert-circle-outline",
          iconColor: "#FFFFFF",
        }
      case "warning":
        return {
          backgroundColor: "#FF9800", // Naranja para advertencia
          iconName: "warning-outline",
          iconColor: "#FFFFFF",
        }
      case "info":
      default:
        return {
          backgroundColor: "#2196F3", // Azul para información
          iconName: "information-circle-outline",
          iconColor: "#FFFFFF",
        }
    }
  }

  const alertStyle = getAlertStyle()

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      // Configurar temporizador para cerrar automáticamente
      const timer = setTimeout(() => {
        hideAlert()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [visible])

  const hideAlert = () => {
    // Animación de salida
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose()
    })
  }

  if (!visible) return null

  const { width } = Dimensions.get("window")

  return (
    <Animated.View
      style={[
        inlineAlertStyles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[inlineAlertStyles.alertContainer, { backgroundColor: alertStyle.backgroundColor, width: width - 32 }]}
      >
        <Ionicons name={alertStyle.iconName as any} size={24} color={alertStyle.iconColor} />
        <Text style={inlineAlertStyles.message}>{message}</Text>
        <TouchableOpacity style={inlineAlertStyles.closeButton} onPress={hideAlert}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const inlineAlertStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
})

type Props = {
  navigation: any
}

// Extender la interfaz Quedada para incluir si ya ha sido puntuada
interface ExtendedQuedada extends Quedada {
  puntuada?: boolean // Indica si la quedada ya ha sido puntuada
}

const MyMeetings: React.FC<Props> = ({ navigation }) => {
  // Estado para el alert inline
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertType, setAlertType] = useState<InlineAlertType>("info")
  const [alertMessage, setAlertMessage] = useState("")

  // Función para mostrar el alert inline
  const showInlineAlert = (message: string, type: InlineAlertType = "info") => {
    setAlertMessage(message)
    setAlertType(type)
    setAlertVisible(true)
  }

  // Función para cerrar el alert inline
  const hideInlineAlert = () => {
    setAlertVisible(false)
  }

  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Estados
  const [joinedMeetings, setJoinedMeetings] = useState<ExtendedQuedada[]>([])
  const [createdMeetings, setCreatedMeetings] = useState<ExtendedQuedada[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"joined" | "created">("joined")
  const [error, setError] = useState<string | null>(null)
  const [closingMeetingId, setClosingMeetingId] = useState<number | null>(null)
  const [isJoinedTabActive, setIsJoinedTabActive] = useState(false)
  const [isCreatedTabActive, setIsCreatedTabActive] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Referencia para almacenar los IDs de quedadas que pueden cerrarse
  const closableMeetingsRef = useRef<Set<number>>(new Set())

  // API base URL - Asegúrate de que esta URL sea correcta para tu entorno
  const API_BASE_URL = Constants.manifest?.extra?.apiUrl || "https://tu-api-backend.com"

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Verificar si una quedada ya ha sido puntuada
  const checkIfMeetingRated = useCallback(async (meetingId: number): Promise<boolean> => {
    try {
      // Aquí llamaríamos al servicio para verificar si la quedada ya ha sido puntuada
      // Por ahora simulamos la llamada al API
      const hasRatings = await MyMeetingsService.checkMeetingRatings?.(meetingId)
      return hasRatings || false
    } catch (error) {
      console.error(`Error al verificar puntuaciones para quedada ${meetingId}:`, error)
      return false
    }
  }, [])

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar quedadas inscritas
      const joined = await MyMeetingsService.getJoinedMeetings()
      setJoinedMeetings(joined)

      // Cargar quedadas creadas (tanto abiertas como cerradas)
      const created = await MyMeetingsService.getCreatedMeetings()

      // Verificar el estado de cada quedada creada
      console.log("Verificando estado de quedadas creadas...")
      let abiertas = 0
      let cerradas = 0

      // Verificar si las quedadas cerradas ya han sido puntuadas
      const createdWithRatingStatus: ExtendedQuedada[] = await Promise.all(
        created.map(async (meeting) => {
          if (!meeting.abierta) {
            // Solo verificamos puntuaciones para quedadas cerradas
            const puntuada = await checkIfMeetingRated(meeting.id)
            return { ...meeting, puntuada }
          }
          return meeting
        }),
      )

      for (const meeting of createdWithRatingStatus) {
        console.log(`Quedada ${meeting.id} - ${meeting.nombre}: Estado abierta = ${meeting.abierta}`)
        if (meeting.abierta) {
          abiertas++
        } else {
          cerradas++
          console.log(`Quedada ${meeting.id} - Puntuada: ${meeting.puntuada ? "Sí" : "No"}`)
        }
      }

      console.log(`Total quedadas: ${created.length}, Abiertas: ${abiertas}, Cerradas: ${cerradas}`)

      // Asegurarse de que se muestren todas las quedadas, tanto abiertas como cerradas
      setCreatedMeetings(createdWithRatingStatus)

      // Actualizar la lista de quedadas que pueden cerrarse
      updateClosableMeetings(createdWithRatingStatus)
    } catch (error) {
      console.error("Error al cargar quedadas:", error)
      setError("No se pudieron cargar tus quedadas. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [checkIfMeetingRated])

  // Actualizar la lista de quedadas que pueden cerrarse
  const updateClosableMeetings = useCallback((meetings: ExtendedQuedada[]) => {
    const now = new Date()
    const closableMeetings = new Set<number>()

    meetings.forEach((meeting) => {
      if (meeting.abierta && isExactlyMeetingStartTime(meeting, now)) {
        closableMeetings.add(meeting.id)
      }
    })

    closableMeetingsRef.current = closableMeetings
    console.log(`Quedadas que pueden cerrarse: ${Array.from(closableMeetings).join(", ")}`)
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData()
  }, [loadData])

  // Modificar el useEffect para refrescar la lista cada vez que se cambia de pestaña
  useEffect(() => {
    // Refrescar los datos cuando se cambia de pestaña (tanto para "Inscritas" como para "Creadas")
    loadData()
  }, [activeTab, loadData])

  // Actualizar la hora actual cada segundo y verificar quedadas que pueden cerrarse
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date()
      setCurrentTime(newTime)

      // Verificar periódicamente qué quedadas pueden cerrarse
      if (createdMeetings.length > 0) {
        updateClosableMeetings(createdMeetings)
      }
    }, 1000) // Actualizar cada segundo para mayor precisión

    return () => clearInterval(timer)
  }, [createdMeetings, updateClosableMeetings])

  // Manejar refresco
  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Navegar a los detalles de la quedada
  const navigateToMeetingDetails = (meetingId: number) => {
    navigation.navigate("MeetingDetails", { _id: meetingId })
  }

  // Navegar a la pantalla de puntuar equipos
  const navigateToPuntuarEquipos = (quedadaId: number) => {
    // Verificar si la quedada ya ha sido puntuada
    const meeting = createdMeetings.find((m) => m.id === quedadaId)
    
    // Verificar si la quedada tiene solo un participante
    if (meeting && meeting.usuarioquedada && meeting.usuarioquedada.length <= 1) {
      showInlineAlert("No se puede puntuar una quedada con un solo participante.", "warning")
      return
    }

    console.log(`🎯 Navegando a PuntuarEquipos con quedadaId: ${quedadaId}, soloLectura: ${meeting?.puntuada || false}`)
    navigation.navigate("PuntuarEquipos", {
      quedadaId,
      soloLectura: meeting?.puntuada || false,
    })
  }

  // Modificar la función isExactlyMeetingStartTime para ajustar también la fecha
  const isExactlyMeetingStartTime = (meeting: Quedada, currentTimeParam?: Date): boolean => {
    if (!meeting.fecha || !meeting.hora_inicio) return false

    try {
      // Usar el tiempo proporcionado o el tiempo actual
      const now = currentTimeParam || currentTime

      // Extraer componentes de la fecha
      let year, month, day

      // Procesar la fecha según su formato
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

      // CORRECCIÓN: Sumar 1 día para ajustar la fecha correctamente
      day = day + 1

      // Extraer componentes de la hora de inicio
      const timeParts = meeting.hora_inicio.split(":")
      const hours = Number.parseInt(timeParts[0], 10)
      const minutes = Number.parseInt(timeParts[1], 10)
      const seconds = timeParts.length > 2 ? Number.parseInt(timeParts[2], 10) : 0

      // Crear fecha y hora de la quedada
      const meetingDate = new Date(year, month, day, hours, minutes, seconds)

      // Verificar si es exactamente el mismo minuto
      const result =
        now.getFullYear() === meetingDate.getFullYear() &&
        now.getMonth() === meetingDate.getMonth() &&
        now.getDate() === meetingDate.getDate() &&
        now.getHours() === meetingDate.getHours() &&
        now.getMinutes() === meetingDate.getMinutes()

      // Registrar el resultado para depuración
      if (result) {
        console.log(`Quedada ${meeting.id} PUEDE cerrarse ahora: ${now.toLocaleTimeString()}`)
      }

      return result
    } catch (error) {
      console.error("Error al verificar hora exacta de inicio:", error)
      return false
    }
  }

  // Verificar si una quedada puede cerrarse (usando la referencia)
  const canCloseMeeting = (meetingId: number): boolean => {
    return closableMeetingsRef.current.has(meetingId)
  }

  // Modificar la función hasMeetingStarted para corregir el problema de la fecha
  const hasMeetingStarted = (meeting: Quedada): boolean => {
    if (!meeting.fecha || !meeting.hora_inicio) return false

    try {
      const now = new Date()
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
        console.error("Formato de fecha inválido:", meeting.fecha)
        return false
      }

      // CORRECCIÓN: Sumar 1 día para ajustar la fecha correctamente
      day = day + 1

      // Extraer componentes de la hora de inicio
      let hours = 0,
        minutes = 0,
        seconds = 0
      if (typeof meeting.hora_inicio === "string") {
        const timeParts = meeting.hora_inicio.split(":")
        hours = Number.parseInt(timeParts[0], 10)
        minutes = Number.parseInt(timeParts[1], 10)
        seconds = timeParts.length > 2 ? Number.parseInt(timeParts[2], 10) : 0
      }

      // Crear fecha y hora de la quedada
      meetingDate = new Date(year, month, day, hours, minutes, seconds)

      // Registrar para depuración
      console.log(
        `⏱️ VERIFICACIÓN: Diferencia en minutos (con fecha ajustada): ${Math.floor((now.getTime() - meetingDate.getTime()) / (1000 * 60))}`,
      )
      console.log(
        `🚦 VERIFICACIÓN: Resultado final (con fecha ajustada): ${now >= meetingDate ? "✅ HA COMENZADO" : "⏳ NO HA COMENZADO"}`,
      )
      console.log(`🔄 Verificación frecuente: Quedada ${now >= meetingDate ? "✅ INICIADA" : "⏳ PENDIENTE"}`)

      // Verificar si la fecha y hora actual es posterior o igual a la fecha y hora de inicio
      return now >= meetingDate
    } catch (error) {
      console.error("Error al verificar si la quedada ha comenzado:", error)
      return false
    }
  }

  // Reemplazar la función handleCloseMeeting completa con esta versión mejorada
  // que garantiza que el alert se muestre correctamente

  const handleCloseMeeting = async (meetingId: number) => {
    try {
      console.log(`🔍 Intentando cerrar quedada ${meetingId}...`)

      // Obtener los detalles de la quedada
      const meeting = await MyMeetingsService.getMeetingDetails(meetingId)
      if (!meeting) {
        console.log("❌ No se pudo obtener la información de la quedada")
        showInlineAlert("No se pudo obtener la información de la quedada.", "error")
        return
      }

      console.log(`📅 Fecha de la quedada: ${meeting.fecha}, Hora: ${meeting.hora_inicio}`)

      // Verificar si la quedada ya ha comenzado
      const hasStarted = hasMeetingStarted(meeting)
      console.log(`⏱️ ¿La quedada ha comenzado? ${hasStarted ? "SÍ" : "NO"}`)

      if (!hasStarted) {
        // Formatear la fecha y hora para mostrar en el mensaje
        const formattedDate = MyMeetingsService.formatDate(meeting.fecha)
        const formattedTime = MyMeetingsService.formatTime(meeting.hora_inicio)

        const message = `No puedes cerrar la quedada hasta que llegue la fecha y hora de inicio: ${formattedDate} a las ${formattedTime}`
        console.log(`⚠️ MOSTRANDO ALERTA: ${message}`)

        // Usar el alert inline
        showInlineAlert(message, "warning")
        return
      }

      // Si llegamos aquí, la quedada puede cerrarse
      // Confirmar antes de cerrar
      RNAlert.alert("Cerrar quedada", "¿Estás seguro de que quieres cerrar esta quedada?", [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar",
          style: "destructive",
          onPress: async () => {
            setClosingMeetingId(meetingId)

            try {
              // Usar el método del servicio para cerrar la quedada
              const result = await MyMeetingsService.closeMeeting(meetingId)

              if (result.success) {
                // Actualizar el estado local
                const updatedMeetings = createdMeetings.map((meeting) =>
                  meeting.id === meetingId ? { ...meeting, abierta: false } : meeting,
                )
                setCreatedMeetings(updatedMeetings)

                // Refrescar todas las quedadas para asegurar que tenemos el estado más reciente
                loadData()

                // Mostrar mensaje de éxito
                showInlineAlert(result.message || "La quedada se ha cerrado correctamente", "success")
              } else {
                // Mostrar mensaje de error
                showInlineAlert(result.message || "Error al cerrar la quedada", "error")
                loadData()
              }
            } catch (error) {
              console.error("Error al cerrar la quedada:", error)
              showInlineAlert("No se pudo cerrar la quedada. Inténtalo de nuevo.", "error")
              loadData()
            } finally {
              setClosingMeetingId(null)
            }
          },
        },
      ])
    } catch (error) {
      console.error("Error al verificar si la quedada puede cerrarse:", error)
      showInlineAlert("Ocurrió un error inesperado. Inténtalo de nuevo.", "error")
    }
  }

  useEffect(() => {
    setIsJoinedTabActive(activeTab === "joined")
    setIsCreatedTabActive(activeTab === "created")
  }, [activeTab])

  // Estado para controlar si se deben refrescar las quedadas creadas
  const [shouldRefreshCreated, setShouldRefreshCreated] = useState(false)

  useEffect(() => {
    if (activeTab === "created" || shouldRefreshCreated) {
      // Refrescar las quedadas creadas cuando se cambia a esa pestaña o cuando se indica
      const refreshCreatedMeetings = async () => {
        try {
          const created = await MyMeetingsService.getCreatedMeetings()

          // Verificar si las quedadas cerradas ya han sido puntuadas
          const createdWithRatingStatus: ExtendedQuedada[] = await Promise.all(
            created.map(async (meeting) => {
              if (!meeting.abierta) {
                // Solo verificamos puntuaciones para quedadas cerradas
                const puntuada = await checkIfMeetingRated(meeting.id)
                return { ...meeting, puntuada }
              }
              return meeting
            }),
          )

          setCreatedMeetings(createdWithRatingStatus)

          // Actualizar la lista de quedadas que pueden cerrarse
          updateClosableMeetings(createdWithRatingStatus)
        } catch (error) {
          console.error("Error al refrescar quedadas creadas:", error)
        } finally {
          // Resetear el estado de refresco
          setShouldRefreshCreated(false)
        }
      }

      refreshCreatedMeetings()
    }
  }, [activeTab, checkIfMeetingRated, updateClosableMeetings, shouldRefreshCreated])

  if (!fontsLoaded) {
    return <View style={styles.container} />
  }

  // Función para obtener la URL de la imagen del deporte
  const getSportImageUrl = (deporte: any): string => {
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

  // Función para obtener el icono del deporte
  const getSportIcon = (sportName: string): string => {
    if (!sportName) return "basketball-outline"

    const name = sportName.toLowerCase()

    if (name.includes("fútbol") || name.includes("futbol") || name.includes("soccer")) {
      return "football-outline"
    } else if (name.includes("baloncesto") || name.includes("basket") || name.includes("basketball")) {
      return "basketball-outline"
    } else if (name.includes("tenis") || name.includes("tennis")) {
      return "tennisball-outline"
    } else if (name.includes("voleibol") || name.includes("voley") || name.includes("volleyball")) {
      return "american-football-outline"
    } else if (name.includes("natación") || name.includes("swim") || name.includes("swimming")) {
      return "water-outline"
    } else if (name.includes("ciclismo") || name.includes("cycling") || name.includes("bicicleta")) {
      return "bicycle-outline"
    } else if (name.includes("running") || name.includes("correr") || name.includes("atletismo")) {
      return "walk-outline"
    } else if (name.includes("golf")) {
      return "golf-outline"
    } else if (name.includes("hockey")) {
      return "baseball-outline"
    } else if (name.includes("rugby")) {
      return "american-football-outline"
    } else if (name.includes("padel") || name.includes("paddle")) {
      return "tennisball-outline"
    }

    // Icono por defecto para otros deportes
    return "basketball-outline"
  }

  // Renderizar contenido según la pestaña activa
  const renderContent = () => {
    const meetings = activeTab === "joined" ? joinedMeetings : createdMeetings

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#4CAF50" : "#006400"} />
          <Text style={[styles.loadingText, isDark && { color: "#aaa" }]}>Cargando quedadas...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={isDark ? "#F44336" : "#D32F2F"} as any />
          <Text style={[styles.errorText, isDark && { color: "#aaa" }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, isDark && { backgroundColor: "#2E7D32" }]}
            onPress={loadData}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (meetings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={isDark ? "#555" : "#ccc"} as any />
          <Text style={[styles.emptyText, isDark && { color: "#aaa" }]}>
            {activeTab === "joined" ? "No estás inscrito en ninguna quedada" : "No has creado ninguna quedada"}
          </Text>
          {activeTab === "created" && (
            <TouchableOpacity
              style={[styles.createButton, isDark && { backgroundColor: "#2E7D32" }]}
              onPress={() => navigation.navigate("CreateMeeting")}
              activeOpacity={0.7}
            >
              <Text style={styles.createButtonText}>Crear Quedada</Text>
            </TouchableOpacity>
          )}
        </View>
      )
    }

    // Mostrar información sobre el número de quedadas abiertas y cerradas
    if (activeTab === "created") {
      const abiertas = meetings.filter((m) => m.abierta).length
      const cerradas = meetings.filter((m) => !m.abierta).length
      console.log(`Mostrando: ${meetings.length} quedadas (${abiertas} abiertas, ${cerradas} cerradas)`)
    }

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[isDark ? "#4CAF50" : "#006400"]}
            tintColor={isDark ? "#4CAF50" : "#006400"}
            progressBackgroundColor={isDark ? "#121212" : "#FFFFFF"}
          />
        }
      >
        {meetings.map((meeting) => {
          // Verificar si la quedada puede cerrarse
          const canClose = canCloseMeeting(meeting.id)
          const isClosing = closingMeetingId === meeting.id
          const isPuntuada = meeting.puntuada || false

          if (activeTab === "joined") {
            // Para la pestaña "Inscritas", renderizar solo el MeetingCard sin espacio adicional
            return (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onPress={() => navigateToMeetingDetails(meeting.id)}
                formatDateForDisplay={MyMeetingsService.formatDate}
                formatTimeForDisplay={MyMeetingsService.formatTime}
                getSportIcon={getSportIcon}
                getSportImageUrl={getSportImageUrl}
                theme={theme}
              />
            )
          } else {
            // Para la pestaña "Creadas", mantener el contenedor con espacio adicional para botones
            return (
              <View key={meeting.id} style={styles.createdMeetingCardContainer}>
                <MeetingCard
                  meeting={meeting}
                  onPress={() => navigateToMeetingDetails(meeting.id)}
                  formatDateForDisplay={MyMeetingsService.formatDate}
                  formatTimeForDisplay={MyMeetingsService.formatTime}
                  getSportIcon={getSportIcon}
                  getSportImageUrl={getSportImageUrl}
                  theme={theme}
                />

                <View style={styles.buttonsRow}>
                  {/* Lado izquierdo: Estado de la quedada */}
                  <View style={styles.leftButtonContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        meeting.abierta ? styles.abiertaBadge : styles.cerradaBadge,
                        isDark && (meeting.abierta ? styles.abiertaBadgeDark : styles.cerradaBadgeDark),
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          meeting.abierta ? styles.abiertaText : styles.cerradaText,
                          isDark && (meeting.abierta ? styles.abiertaTextDark : styles.cerradaTextDark),
                        ]}
                      >
                        {meeting.abierta ? "Abierta" : "Cerrada"}
                      </Text>
                    </View>
                  </View>

                  {/* Lado derecho: Botón de acción (Cerrar o Puntuar) */}
                  <View style={styles.rightButtonContainer}>
                    {meeting.abierta ? (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.cerrarButton,
                          isClosing && styles.cerrarButtonLoading,
                          isDark && styles.cerrarButtonDark,
                        ]}
                        onPress={() => handleCloseMeeting(meeting.id)}
                        disabled={isClosing}
                      >
                        {isClosing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.actionButtonText}>Cerrar</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.puntuarButton,
                          isPuntuada && styles.puntuarButtonPuntuada,
                          isDark && styles.puntuarButtonDark,
                          isPuntuada && isDark && styles.puntuarButtonPuntuadaDark,
                        ]}
                        onPress={() => navigateToPuntuarEquipos(meeting.id)}
                      >
                        <Text style={[styles.actionButtonText, isPuntuada && styles.puntuadaButtonText]}>
                          {isPuntuada ? "Puntuada" : "Puntuar"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )
          }
        })}

        {/* Add padding at the bottom for better scrolling */}
        <View style={{ height: 20 }} />
      </ScrollView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: "#121212" }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      {/* Alert personalizado */}
      <InlineAlert visible={alertVisible} type={alertType} message={alertMessage} onClose={hideInlineAlert} />

      {/* Header */}

      <SecondaryPageHeader text="Mis Quedadas" isDark={isDark}></SecondaryPageHeader>

      {/* Tabs */}
      <View style={[styles.tabContainer, isDark && { borderBottomColor: "#333" }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "joined" && styles.activeTab,
            activeTab === "joined" && isDark && { borderBottomColor: "#4CAF50" },
          ]}
          onPress={() => setActiveTab("joined")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              isDark && { color: "#aaa" },
              activeTab === "joined" && styles.activeTabText,
              activeTab === "joined" && isDark && { color: "#4CAF50" },
            ]}
          >
            Inscritas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "created" && styles.activeTab,
            activeTab === "created" && isDark && { borderBottomColor: "#4CAF50" },
          ]}
          onPress={() => {
            setActiveTab("created")
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              isDark && { color: "#aaa" },
              activeTab === "created" && styles.activeTabText,
              activeTab === "created" && isDark && { color: "#4CAF50" },
            ]}
          >
            Creadas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 28,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#006400",
  },
  tabText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#006400",
    fontFamily: "Inter-SemiBold",
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#777",
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
  // Contenedor específico para tarjetas en la pestaña "Creadas"
  createdMeetingCardContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // Fila de botones en la parte inferior
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },
  // Contenedor para el botón izquierdo (estado)
  leftButtonContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  // Contenedor para el botón derecho (acción)
  rightButtonContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  // Estilos para el badge de estado
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  abiertaBadge: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  abiertaBadgeDark: {
    backgroundColor: "#1B5E20",
    borderColor: "#2E7D32",
  },
  cerradaBadge: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  cerradaBadgeDark: {
    backgroundColor: "#B71C1C",
    borderColor: "#C62828",
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  abiertaText: {
    color: "#2E7D32",
  },
  abiertaTextDark: {
    color: "#FFFFFF",
  },
  cerradaText: {
    color: "#C62828",
  },
  cerradaTextDark: {
    color: "#FFFFFF",
  },
  // Estilos para los botones de acción
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  cerrarButton: {
    backgroundColor: "#D32F2F",
  },
  cerrarButtonDark: {
    backgroundColor: "#C62828",
  },
  cerrarButtonDisabled: {
    backgroundColor: "#E0E0E0",
    borderWidth: 1,
    borderColor: "#BDBDBD",
  },
  cerrarButtonLoading: {
    opacity: 0.7,
  },
  puntuarButton: {
    backgroundColor: "#2196F3",
  },
  puntuarButtonDark: {
    backgroundColor: "#1976D2",
  },
  // Estilos para el botón de puntuar deshabilitado
  puntuarButtonDisabled: {
    backgroundColor: "#E0E0E0",
    borderWidth: 1,
    borderColor: "#BDBDBD",
  },
  puntuarButtonDisabledDark: {
    backgroundColor: "#424242",
    borderWidth: 1,
    borderColor: "#616161",
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#FFFFFF",
  },
  disabledButtonText: {
    color: "#9E9E9E",
  },
  puntuarButtonPuntuada: {
    backgroundColor: "#64B5F6",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  puntuarButtonPuntuadaDark: {
    backgroundColor: "#1565C0",
    borderWidth: 1,
    borderColor: "#0D47A1",
  },
  puntuadaButtonText: {
    color: "#FFFFFF",
  },
})

export default MyMeetings