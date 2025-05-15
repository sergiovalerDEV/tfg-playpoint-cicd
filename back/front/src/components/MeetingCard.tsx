import type React from "react"
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

// Definición de interfaz genérica para aceptar ambos tipos de quedada
interface MeetingCardProps {
  meeting: {
    id: number
    nombre?: string
    deporte?: {
      id: number
      nombre?: string
      imagen?: string
      numero_jugadores?: number
      numero_equipos?: number
    }
    competitividad: number | boolean
    local?: {
      id: number
      nombre?: string
    }
    localizacion?: string
    fecha: string
    hora_inicio: string
    hora_finalizacion: string
    creador?: {
      id: number
      nombre?: string
      foto_perfil?: string
    }
    abierta?: boolean
  }
  onPress: (meetingId: number) => void
  formatDateForDisplay: (date: string) => string
  formatTimeForDisplay: (time: string) => string
  getSportIcon: (sportName: string) => string
  getSportImageUrl: (deporte: any) => string
  theme?: "light" | "dark"
  isJoinedTab?: boolean // Nueva prop para identificar si estamos en la pestaña "Inscritas"
}

const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onPress,
  formatDateForDisplay,
  formatTimeForDisplay,
  getSportIcon,
  getSportImageUrl,
  theme = "light",
  isJoinedTab = false, // Por defecto, asumimos que no estamos en la pestaña "Inscritas"
}) => {
  const isDark = theme === "dark"
  const BORDER_RADIUS = 8 // Consistent border radius for all elements

  // Función para determinar si es competitivo
  const isCompetitive = () => {
    if (typeof meeting.competitividad === "boolean") {
      return meeting.competitividad
    } else {
      return meeting.competitividad > 0
    }
  }

  // Modificar la función handleNavigateToDetails para añadir más logs y asegurar que el ID se pasa correctamente
  // Función para manejar la navegación a los detalles
  const handleNavigateToDetails = () => {
    if (meeting && meeting.id) {
      console.log(`🔍 MeetingCard: Navegando a detalles de quedada con ID: ${meeting.id}`)
      console.log(`🔍 MeetingCard: Datos completos de la quedada:`, JSON.stringify(meeting))
      // Asegurarse de que el ID se pase como un número y sea el parámetro principal
      const meetingId = Number(meeting.id)
      console.log(`🔍 MeetingCard: Pasando ID numérico: ${meetingId}`)
      onPress(meetingId)
    } else {
      console.error("❌ MeetingCard: No se puede navegar, ID de quedada no disponible")
    }
  }

  // Obtener el nombre del deporte de forma segura
  const sportName = meeting.deporte?.nombre || "Sport"

  // Obtener la ubicación de forma segura
  const location = meeting.localizacion || meeting.local?.nombre || "Location"

  // Seleccionar el estilo de la tarjeta según la pestaña
  const cardStyle = isJoinedTab
    ? isDark
      ? styles.joinedCardDark
      : styles.joinedCard
    : isDark
    ? styles.cardDark
    : styles.card

  return (
    <View style={[cardStyle, { borderRadius: BORDER_RADIUS }]}>
      {/* Imagen con overlay y título - Ahora clickeable */}
      <TouchableOpacity activeOpacity={0.9} onPress={handleNavigateToDetails}>
        <ImageBackground
          source={{ uri: getSportImageUrl(meeting.deporte) }}
          style={styles.imageHeader}
          imageStyle={{ borderTopLeftRadius: BORDER_RADIUS, borderTopRightRadius: BORDER_RADIUS }}
        >
          <View style={styles.imageOverlay}>
            {/* Título del evento y badge del deporte */}
            <View style={styles.titleContainer}>
              {/* Badge de competitividad - Ahora en la esquina superior derecha */}
              {isCompetitive() && (
                <View style={[styles.competitiveBadge, { borderRadius: BORDER_RADIUS }]}>
                  <Ionicons name="trophy" size={14} color="#FFFFFF" />
                  <Text style={styles.badgeText}>Competitiva</Text>
                </View>
              )}

              <Text style={styles.title} numberOfLines={2}>
                {meeting.nombre || `${sportName} in ${location}`}
              </Text>

              {/* Badge del deporte */}
              <View style={[isDark ? styles.sportBadgeDark : styles.sportBadge, { borderRadius: BORDER_RADIUS }]}>
                <Ionicons name={getSportIcon(sportName) as any} size={14} color="#FFFFFF" />
                <Text style={styles.sportBadgeText}>{sportName}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      {/* Contenido de la tarjeta */}
      <View style={isDark ? styles.contentDark : styles.content}>
        {/* Sección de información principal */}
        <View style={styles.infoSection}>
          {/* Fila de fecha y hora */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={isDark ? "#4CAF50" : "#006400"} />
              <Text style={isDark ? styles.infoTextDark : styles.infoText}>{formatDateForDisplay(meeting.fecha)}</Text>
            </View>

            <View style={styles.timeContainer}>
              <Ionicons name="time" size={16} color={isDark ? "#4CAF50" : "#006400"} />
              <Text style={isDark ? styles.infoTextDark : styles.infoText}>
                {formatTimeForDisplay(meeting.hora_inicio)}
              </Text>
              <Text style={isDark ? styles.infoTextDark : styles.infoText}>-</Text>
              <Text style={isDark ? styles.infoTextDark : styles.infoText}>
                {formatTimeForDisplay(meeting.hora_finalizacion)}
              </Text>
            </View>
          </View>

          {/* Ubicación */}
          {location && (
            <View style={styles.infoItem}>
              <Ionicons name="location" size={16} color={isDark ? "#4CAF50" : "#006400"} />
              <Text style={isDark ? styles.infoTextDark : styles.infoText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}

          {/* Creador */}
          {meeting.creador && (
            <View style={styles.infoItem}>
              <Ionicons name="person" size={16} color={isDark ? "#4CAF50" : "#006400"} />
              <Text style={isDark ? styles.infoTextDark : styles.infoText}>
                Creada por <Text style={styles.creatorName}>{meeting.creador.nombre || "Unknown"}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Separador - Solo mostrar en la pestaña "Creadas" */}
        {!isJoinedTab && <View style={isDark ? styles.dividerDark : styles.divider} />}

        {/* Botón de acción */}
        <View style={styles.buttonContainer}>
          {meeting.deporte?.numero_jugadores && meeting.deporte?.numero_equipos && (
            <View
              style={[
                isDark ? styles.playersCountBadgeDark : styles.playersCountBadge,
                { borderRadius: BORDER_RADIUS },
              ]}
            >
              <Ionicons name="people" size={14} color="#FFFFFF" />
              <Text style={styles.playersCountText}>
                {meeting.deporte.numero_jugadores * (meeting.deporte.numero_equipos || 1)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[isDark ? styles.buttonDark : styles.button, { borderRadius: BORDER_RADIUS }]}
            onPress={handleNavigateToDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Ver quedada</Text>
            <Ionicons name="arrow-forward-circle" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // Estilos normales para la pestaña "Creadas"
  card: {
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  cardDark: {
    backgroundColor: "#1E1E1E",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#333",
  },
  // Estilos específicos para la pestaña "Inscritas" - SIN BORDES INFERIORES
  joinedCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  joinedCardDark: {
    backgroundColor: "#1E1E1E",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#333",
  },
  imageHeader: {
    height: 150,
    width: "100%",
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 16,
    justifyContent: "space-between",
  },
  competitiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,140,0,0.9)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter-Medium",
    marginLeft: 4,
  },
  titleContainer: {
    gap: 8,
    position: "relative",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sportBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,100,0,0.9)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  sportBadgeDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(46,125,50,0.9)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 1,
  },
  sportBadgeText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  contentDark: {
    padding: 16,
  },
  infoSection: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#333333",
  },
  infoTextDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#E0E0E0",
  },
  creatorName: {
    fontFamily: "Inter-Medium",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 12,
  },
  dividerDark: {
    height: 1,
    backgroundColor: "#333333",
    marginVertical: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playersCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,100,0,0.9)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  playersCountBadgeDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(46,125,50,0.9)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 1,
  },
  playersCountText: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  button: {
    backgroundColor: "#006400",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDark: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
})

export default MeetingCard
