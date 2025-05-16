"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import UserService from "../../../services/User/UserService"
import { useTheme } from "../../../contexts/ThemeContext"
import SecondaryPageHeader from "../../../components/headers/SecondaryPageHeader"
import { showAlert, AlertProvider } from "../../../components/Alert"

type Props = {
  navigation: any
}

const ChangePhoneNumber: React.FC<Props> = ({ navigation }) => {
  // Ref para controlar si el componente está montado
  const isMounted = useRef(true)
  
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<number | undefined>(undefined)
  const [formattedCurrentPhone, setFormattedCurrentPhone] = useState("")
  const [newPhoneNumber, setNewPhoneNumber] = useState("")
  const [confirmPhoneNumber, setConfirmPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Efecto para limpiar la referencia cuando el componente se desmonta
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Formatear número de teléfono con guiones
  const formatPhoneWithDashes = (phoneNumber: number | undefined): string => {
    if (!phoneNumber) return "No disponible"

    const phoneStr = phoneNumber.toString()
    if (phoneStr.length !== 9) return phoneStr // Formato español estándar: 9 dígitos

    // Formatear como: XXX-XXX-XXX
    return `${phoneStr.substring(0, 3)}-${phoneStr.substring(3, 6)}-${phoneStr.substring(6)}`
  }

  // Cargar el número de teléfono actual
  useEffect(() => {
    const loadCurrentPhoneNumber = async () => {
      try {
        const user = await UserService.getCurrentUser()
        if (user) {
          setCurrentPhoneNumber(user.numero_telefono)
          setFormattedCurrentPhone(formatPhoneWithDashes(user.numero_telefono))
        }
      } catch (error) {
        console.error("Error al cargar el número de teléfono:", error)
      } finally {
        if (isMounted.current) {
          setInitialLoading(false)
        }
      }
    }

    loadCurrentPhoneNumber()
  }, [])

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Modificar la función handleChangePhoneNumber para actualizar y navegar de vuelta
  const handleChangePhoneNumber = async () => {
    // Validaciones (mantener el código existente)
    if (!newPhoneNumber.trim() || !confirmPhoneNumber.trim()) {
      showAlert("Por favor, completa todos los campos", "error")
      return
    }

    if (newPhoneNumber !== confirmPhoneNumber) {
      showAlert("Los números de teléfono no coinciden", "error")
      return
    }

    // Eliminar caracteres no numéricos
    const cleanedPhoneNumber = newPhoneNumber.replace(/\D/g, "")

    // Validar formato de número de teléfono (validación simple)
    const phoneRegex = /^\d{9,10}$/
    if (!phoneRegex.test(cleanedPhoneNumber)) {
      showAlert("Por favor, introduce un número de teléfono válido (9-10 dígitos)", "error")
      return
    }

    // Convertir a número
    const phoneNumberAsNumber = Number.parseInt(cleanedPhoneNumber, 10)

    // Verificar si es el mismo número
    if (phoneNumberAsNumber === currentPhoneNumber) {
      showAlert("El nuevo número de teléfono debe ser diferente al actual", "error")
      return
    }

    try {
      setLoading(true)

      // Llamar al servicio para actualizar el número de teléfono
      const success = await UserService.updatePhoneNumber(phoneNumberAsNumber)

      if (success) {
        showAlert("Número de teléfono actualizado correctamente", "success", 3000, () => {
          if (isMounted.current) {
            navigation.goBack()
          }
        })
      } else {
        showAlert("No se pudo actualizar el número de teléfono. Inténtalo de nuevo.", "error")
      }
    } catch (error) {
      console.error("Error al cambiar el número de teléfono:", error)
      showAlert("Ocurrió un error al actualizar el número de teléfono. Por favor, inténtalo de nuevo.", "error")
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }

  if (!fontsLoaded || initialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#006400" />
      </View>
    )
  }

  return (
    <AlertProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <SecondaryPageHeader text={"cambiar Número de Teléfono"} isDark={isDark}></SecondaryPageHeader>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.currentInfoContainer}>
            <Text style={styles.currentInfoLabel}>Número de teléfono actual:</Text>
            <View style={styles.phoneNumberContainer}>
              <Text style={styles.phonePrefix}>+34</Text>
              <Text style={styles.currentInfoValue}>{formattedCurrentPhone}</Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Ingresa nuevo número de teléfono"
            placeholderTextColor="#999"
            value={newPhoneNumber}
            onChangeText={setNewPhoneNumber}
            keyboardType="phone-pad"
            editable={!loading}
            maxLength={10}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirma número de teléfono"
            placeholderTextColor="#999"
            value={confirmPhoneNumber}
            onChangeText={setConfirmPhoneNumber}
            keyboardType="phone-pad"
            editable={!loading}
            maxLength={10}
          />

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Introduce solo los dígitos del número de teléfono, sin espacios ni guiones.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.changeButton, loading && styles.disabledButton]}
            onPress={handleChangePhoneNumber}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.changeButtonText}>Cambiar</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </AlertProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  
  placeholder: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  currentInfoContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  currentInfoLabel: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#333",
    marginBottom: 8,
  },
  phoneNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  phonePrefix: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#333",
    marginRight: 4,
  },
  currentInfoValue: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#666",
    marginLeft: 6,
    flex: 1,
  },
  changeButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    height: 56,
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#8ebb8e",
  },
  changeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 16
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    textAlign: "center",
  },
  headerTitleDark: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    textAlign: "center",
  },
})

export default ChangePhoneNumber