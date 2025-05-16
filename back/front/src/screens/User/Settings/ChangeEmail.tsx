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
import { useTheme } from "../../../contexts/ThemeContext"
import UserService from "../../../services/User/UserService"
import SecondaryPageHeader from "../../../components/headers/SecondaryPageHeader"
import { showAlert, AlertProvider } from "../../../components/Alert"
import axios from "axios"
import { API_URL } from "../../../../config"
import EmailVerificationModal from "../../../components/modals/EmailVerificationModal"

type Props = {
  navigation: any
}

const ChangeEmail: React.FC<Props> = ({ navigation }) => {
  // Ref para controlar si el componente está montado
  const isMounted = useRef(true)

  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [currentEmail, setCurrentEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Estados para verificación de email
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  // Efecto para limpiar la referencia cuando el componente se desmonta
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Cargar el correo electrónico actual
  useEffect(() => {
    const loadCurrentEmail = async () => {
      try {
        const user = await UserService.getCurrentUser()
        if (user) {
          setCurrentEmail(user.correo)
        }
      } catch (error) {
        console.error("Error al cargar el correo electrónico:", error)
      } finally {
        if (isMounted.current) {
          setInitialLoading(false)
        }
      }
    }

    loadCurrentEmail()
  }, [])

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Validar formato de correo electrónico
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Generar código de verificación aleatorio de 6 dígitos
  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Enviar código de verificación al email
  const sendVerificationCode = async () => {
    setVerificationError(null)

    if (!newEmail.trim()) {
      showAlert("Por favor, introduce un correo electrónico", "error")
      return
    }

    if (!isValidEmail(newEmail)) {
      showAlert("Por favor, introduce un correo electrónico válido", "error")
      return
    }

    if (newEmail === currentEmail) {
      showAlert("El nuevo correo electrónico debe ser diferente al actual", "error")
      return
    }

    setVerificationLoading(true)

    try {
      // Generar un nuevo código de verificación
      const newCode = generateVerificationCode()
      setVerificationCode(newCode)

      // Llamar al endpoint /mailmanager
      const response = await axios.post<any>(`${API_URL}/mailmanager/enviar/verificacion-correo`, {
        destinatario: newEmail.trim(),
        codigo: newCode,
      })

      if (response.status >= 200 && response.status < 300) {
        // Mostrar el modal de verificación
        setShowVerificationModal(true)
      } else {
        setVerificationError(response.data.message || "Error al enviar el código de verificación. Inténtalo de nuevo.")
        showAlert("Error al enviar el código de verificación. Inténtalo de nuevo.", "error")
      }
    } catch (error) {
      console.error("Error al enviar código de verificación:", error)
      showAlert("Ha ocurrido un error inesperado. Inténtalo de nuevo.", "error")
      setVerificationError("Ha ocurrido un error inesperado. Inténtalo de nuevo.")
    } finally {
      if (isMounted.current) {
        setVerificationLoading(false)
      }
    }
  }

  // Verificar el código introducido
  const verifyCode = (enteredCode: string) => {
    if (enteredCode === verificationCode) {
      setIsEmailVerified(true)
      setShowVerificationModal(false)
      showAlert("Email verificado correctamente", "success")
    } else {
      setVerificationError("Código de verificación inválido. Inténtalo de nuevo.")
    }
  }

  // Modificar la función handleChangeEmail para actualizar y navegar de vuelta
  const handleChangeEmail = async () => {
    // Validaciones
    if (!newEmail.trim() || !confirmEmail.trim()) {
      showAlert("Por favor, completa todos los campos", "error")
      return
    }

    if (newEmail !== confirmEmail) {
      showAlert("Los correos electrónicos no coinciden", "error")
      return
    }

    if (newEmail === currentEmail) {
      showAlert("El nuevo correo electrónico debe ser diferente al actual", "error")
      return
    }

    if (!isValidEmail(newEmail)) {
      showAlert("Por favor, introduce un correo electrónico válido", "error")
      return
    }

    if (!isEmailVerified) {
      showAlert("Por favor, verifica tu correo electrónico antes de continuar", "error")
      return
    }

    try {
      setLoading(true)

      // Llamar al servicio para actualizar el correo electrónico
      const success = await UserService.updateEmail(newEmail)

      if (success) {
        showAlert("Correo electrónico actualizado correctamente", "success", 3000)

        // Navegar después de un breve retraso para permitir que la alerta se muestre completamente
        setTimeout(() => {
          if (isMounted.current) {
            navigation.goBack()
          }
        }, 1500)
      } else {
        showAlert("No se pudo actualizar el correo electrónico. Inténtalo de nuevo.", "error")
      }
    } catch (error) {
      console.error("Error al cambiar el correo electrónico:", error)
      showAlert("Ocurrió un error al actualizar el correo electrónico. Por favor, inténtalo de nuevo.", "error")
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }

  if (!fontsLoaded || initialLoading) {
    return (
      <View style={[isDark ? styles.containerDark : styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={isDark ? "#4CAF50" : "#006400"} />
      </View>
    )
  }

  return (
    <AlertProvider>
      <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

        <SecondaryPageHeader text={"Cambiar Correo Electrónico"} isDark={isDark}></SecondaryPageHeader>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={isDark ? styles.currentInfoContainerDark : styles.currentInfoContainer}>
            <Text style={isDark ? styles.currentInfoLabelDark : styles.currentInfoLabel}>
              Correo electrónico actual:
            </Text>
            <Text style={isDark ? styles.currentInfoValueDark : styles.currentInfoValue}>{currentEmail}</Text>
          </View>

          {/* Email con botón de verificación */}
          <View style={styles.emailContainer}>
            <TextInput
              style={isDark ? styles.emailInputDark : styles.emailInput}
              placeholder="Ingresa nuevo correo electrónico"
              placeholderTextColor={isDark ? "#8A8A8A" : "#999"}
              value={newEmail}
              onChangeText={(text) => {
                setNewEmail(text)
                setIsEmailVerified(false) // Resetear verificación cuando cambia el email
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !verificationLoading}
            />
            <TouchableOpacity
              style={[
                isDark ? styles.verifyButtonDark : styles.verifyButton,
                isEmailVerified && (isDark ? styles.verifiedButtonDark : styles.verifiedButton),
                (loading || verificationLoading) && styles.disabledButton,
              ]}
              onPress={sendVerificationCode}
              disabled={loading || verificationLoading || isEmailVerified}
            >
              {verificationLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : isEmailVerified ? (
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verificar</Text>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            style={isDark ? styles.inputDark : styles.input}
            placeholder="Confirma correo electrónico"
            placeholderTextColor={isDark ? "#8A8A8A" : "#999"}
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              isDark ? styles.changeButtonDark : styles.changeButton,
              loading && (isDark ? styles.disabledButtonDark : styles.disabledButton),
            ]}
            onPress={handleChangeEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.changeButtonText}>Cambiar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal de verificación de email */}
        <EmailVerificationModal
          visible={showVerificationModal}
          email={newEmail}
          verificationCode={verificationCode}
          verificationError={verificationError}
          onClose={() => setShowVerificationModal(false)}
          onVerify={verifyCode}
          onResend={sendVerificationCode}
          isResending={verificationLoading}
        />
      </SafeAreaView>
    </AlertProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDark: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
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
  currentInfoContainerDark: {
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  currentInfoLabel: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#333",
    marginBottom: 4,
  },
  currentInfoLabelDark: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#e0e0e0",
    marginBottom: 4,
  },
  currentInfoValue: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  currentInfoValueDark: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
  },
  emailContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  emailInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  emailInputDark: {
    flex: 1,
    height: 40,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#E0E0E0",
  },
  verifyButton: {
    height: 40,
    backgroundColor: "#006400",
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  verifyButtonDark: {
    height: 40,
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  verifiedButton: {
    backgroundColor: "#4CAF50",
  },
  verifiedButtonDark: {
    backgroundColor: "#4CAF50",
  },
  disabledButton: {
    backgroundColor: "#8ebb8e",
    opacity: 0.7,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  input: {
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  inputDark: {
    height: 40,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#E0E0E0",
  },
  changeButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  changeButtonDark: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  disabledButtonDark: {
    backgroundColor: "#1B5E20",
    opacity: 0.7,
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
    gap: 16,
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

export default ChangeEmail
