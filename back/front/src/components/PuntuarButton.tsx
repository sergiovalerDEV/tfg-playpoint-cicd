import type React from "react"
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import SearchMeetingsService from "../services/ManageMeetings/SearchMeetingsService"

interface PuntuarButtonProps {
  quedadaId?: number | string
  onPress?: () => void
  theme?: "light" | "dark"
}

const PuntuarButton: React.FC<PuntuarButtonProps> = ({ quedadaId, onPress, theme = "light" }) => {
  const isDark = theme === "dark"
  const navigation = useNavigation()

  const handlePress = async () => {
    try {
      // Si se proporciona una función onPress personalizada, usarla
      if (onPress) {
        onPress()
        return
      }

      // SOLUCIÓN: Extraer y validar el ID de la quedada de manera robusta
      // similar a cómo se hace en MeetingDetails.tsx
      console.log(`🔍 Verificando quedada con ID original: ${quedadaId}`)

      // Convertir a número si es posible
      let numericQuedadaId: number | undefined

      if (quedadaId !== undefined && quedadaId !== null) {
        numericQuedadaId = Number(quedadaId)
        if (isNaN(numericQuedadaId)) {
          console.error(`❌ El ID proporcionado no es un número válido: ${quedadaId}`)
          Alert.alert("Error", "ID de quedada no válido. Por favor, inténtalo de nuevo.")
          return
        }
      } else {
        console.error("❌ No se proporcionó un ID de quedada")
        Alert.alert("Error", "No se pudo identificar la quedada. Por favor, inténtalo de nuevo.")
        return
      }

      console.log(`🔍 Verificando quedada ${numericQuedadaId} antes de navegar a puntuación`)

      // Usar el servicio SearchMeetingsService para obtener la quedada
      const quedada = await SearchMeetingsService.getMeetingById(numericQuedadaId, true)

      if (!quedada) {
        console.error(`❌ No se encontró la quedada con ID ${numericQuedadaId}`)
        Alert.alert("Error", "No se pudo encontrar la quedada. Por favor, inténtalo de nuevo más tarde.")
        return
      }

      // Verificar que la quedada esté cerrada
      if (quedada.abierta) {
        Alert.alert("Error", "Solo se pueden puntuar quedadas que estén cerradas")
        return
      }

      // Si todo está bien, navegar a la pantalla de puntuación
      console.log(`✅ Navegando a PuntuarEquipos con quedadaId: ${numericQuedadaId}`)
      navigation.navigate("PuntuarEquipos", { quedadaId: numericQuedadaId })
    } catch (error) {
      console.error("❌ Error al verificar quedada:", error)
      Alert.alert("Error", "No se pudo acceder a la información de la quedada. Por favor, inténtalo de nuevo.")
    }
  }

  // Determinar si el botón debe estar deshabilitado
  const isDisabled = quedadaId === undefined || quedadaId === null || isNaN(Number(quedadaId))

  return (
    <TouchableOpacity
      style={[styles.button, isDark && styles.buttonDark, isDisabled && styles.buttonDisabled]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isDisabled}
    >
      <Ionicons name="star" size={16} color="#FFFFFF" as any />
      <Text style={styles.buttonText}>Puntuar Equipos</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#9C27B0", // Morado para destacar
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(156, 39, 176, 0.3)",
  },
  buttonDark: {
    backgroundColor: "rgba(156, 39, 176, 0.8)",
    borderColor: "rgba(156, 39, 176, 0.3)",
  },
  buttonDisabled: {
    backgroundColor: "#cccccc",
    borderColor: "#bbbbbb",
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 12,
  },
})

export default PuntuarButton
