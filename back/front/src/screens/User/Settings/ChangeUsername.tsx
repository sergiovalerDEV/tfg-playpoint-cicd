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
import { useFonts } from "expo-font"
import { useTheme } from "../../../contexts/ThemeContext"
import UserService from "../../../services/User/UserService"
import SecondaryPageHeader from "../../../components/headers/SecondaryPageHeader"
import { showAlert, AlertProvider } from "../../../components/Alert"

type Props = {
  navigation: any
}

const ChangeUsername: React.FC<Props> = ({ navigation }) => {
  // Ref para controlar si el componente está montado
  const isMounted = useRef(true)
  
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [currentUsername, setCurrentUsername] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [confirmUsername, setConfirmUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Efecto para limpiar la referencia cuando el componente se desmonta
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Cargar el nombre de usuario actual
  useEffect(() => {
    const loadCurrentUsername = async () => {
      try {
        const user = await UserService.getCurrentUser()
        if (user) {
          setCurrentUsername(user.nombre)
        }
      } catch (error) {
        console.error("Error al cargar el nombre de usuario:", error)
      } finally {
        if (isMounted.current) {
          setInitialLoading(false)
        }
      }
    }

    loadCurrentUsername()
  }, [])

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../../assets/Inter_18pt-SemiBold.ttf"),
  })

  const handleChangeUsername = async () => {
    // Validaciones
    if (!newUsername.trim() || !confirmUsername.trim()) {
      showAlert("Por favor, completa todos los campos", "error")
      return
    }

    if (newUsername !== confirmUsername) {
      showAlert("Los nombres de usuario no coinciden", "error")
      return
    }

    if (newUsername === currentUsername) {
      showAlert("El nuevo nombre de usuario debe ser diferente al actual", "error")
      return
    }

    // Validar longitud mínima
    if (newUsername.length < 3) {
      showAlert("El nombre de usuario debe tener al menos 3 caracteres", "error")
      return
    }

    try {
      setLoading(true)

      // Llamar al servicio para actualizar el nombre de usuario
      const success = await UserService.updateUsername(newUsername)

      if (success) {
        showAlert("Nombre de usuario actualizado correctamente", "success", 3000, () => {
          if (isMounted.current) {
            navigation.goBack()
          }
        })
      } else {
        showAlert("No se pudo actualizar el nombre de usuario. Inténtalo de nuevo.", "error")
      }
    } catch (error) {
      console.error("Error al cambiar el nombre de usuario:", error)
      showAlert("Ocurrió un error al actualizar el nombre de usuario. Por favor, inténtalo de nuevo.", "error")
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

        <SecondaryPageHeader text={"Cambiar Nombre de Usuario"} isDark={isDark}></SecondaryPageHeader>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.currentInfoContainer}>
            <Text style={styles.currentInfoLabel}>Nombre de usuario actual:</Text>
            <Text style={styles.currentInfoValue}>{currentUsername}</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Ingresa nuevo nombre de usuario"
            placeholderTextColor="#999"
            value={newUsername}
            onChangeText={setNewUsername}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirma nombre de usuario"
            placeholderTextColor="#999"
            value={confirmUsername}
            onChangeText={setConfirmUsername}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.changeButton, loading && styles.disabledButton]}
            onPress={handleChangeUsername}
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
    marginBottom: 4,
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
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
})

export default ChangeUsername