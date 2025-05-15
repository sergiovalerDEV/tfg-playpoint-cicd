"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import { useTheme } from "../../../contexts/ThemeContext" // Importar el contexto de tema
import UserService from "../../../services/User/UserService"
import SecondaryPageHeader from "../../../components/headers/SecondaryPageHeader"

type Props = {
  navigation: any
}

const ChangeEmail: React.FC<Props> = ({ navigation }) => {
  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [currentEmail, setCurrentEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

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
        setInitialLoading(false)
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

  // Modificar la función handleChangeEmail para actualizar y navegar de vuelta
  const handleChangeEmail = async () => {
    // Validaciones (mantener el código existente)
    if (!newEmail.trim() || !confirmEmail.trim()) {
      Alert.alert("Error", "Por favor, completa todos los campos")
      return
    }

    if (newEmail !== confirmEmail) {
      Alert.alert("Error", "Los correos electrónicos no coinciden")
      return
    }

    if (newEmail === currentEmail) {
      Alert.alert("Error", "El nuevo correo electrónico debe ser diferente al actual")
      return
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      Alert.alert("Error", "Por favor, introduce un correo electrónico válido")
      return
    }

    try {
      setLoading(true)

      // Llamar al servicio para actualizar el correo electrónico
      const success = await UserService.updateEmail(newEmail)

      if (success) {
        Alert.alert("Éxito", "Correo electrónico actualizado correctamente", [
          { text: "OK", onPress: () => navigation.goBack() },
        ])
      } else {
        Alert.alert("Error", "No se pudo actualizar el correo electrónico. Inténtalo de nuevo.")
      }
    } catch (error) {
      console.error("Error al cambiar el correo electrónico:", error)
      Alert.alert("Error", "Ocurrió un error al actualizar el correo electrónico. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
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
    <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      <SecondaryPageHeader text={"Cambiar Correo Electrónico"} isDark={isDark}></SecondaryPageHeader>

      {/* Form */}
      <View style={styles.formContainer}>
        <View style={isDark ? styles.currentInfoContainerDark : styles.currentInfoContainer}>
          <Text style={isDark ? styles.currentInfoLabelDark : styles.currentInfoLabel}>Correo electrónico actual:</Text>
          <Text style={isDark ? styles.currentInfoValueDark : styles.currentInfoValue}>{currentEmail}</Text>
        </View>

        <TextInput
          style={isDark ? styles.inputDark : styles.input}
          placeholder="Ingresa nuevo correo electrónico"
          placeholderTextColor={isDark ? "#8A8A8A" : "#999"}
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

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
    </SafeAreaView>
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
    marginBottom: 16,
  },
  titleDark: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    marginBottom: 16,
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
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  inputDark: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#E0E0E0",
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
  changeButtonDark: {
    backgroundColor: "#2E7D32",
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

export default ChangeEmail