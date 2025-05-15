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
import { useTheme } from "../../../contexts/ThemeContext"
import UserService from "../../../services/User/UserService"
import SecondaryPageHeader from "../../../components/headers/SecondaryPageHeader"

type Props = {
  navigation: any
}

const ChangeUsername: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [currentUsername, setCurrentUsername] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [confirmUsername, setConfirmUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

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
        setInitialLoading(false)
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
      Alert.alert("Error", "Por favor, completa todos los campos")
      return
    }

    if (newUsername !== confirmUsername) {
      Alert.alert("Error", "Los nombres de usuario no coinciden")
      return
    }

    if (newUsername === currentUsername) {
      Alert.alert("Error", "El nuevo nombre de usuario debe ser diferente al actual")
      return
    }

    // Validar longitud mínima
    if (newUsername.length < 3) {
      Alert.alert("Error", "El nombre de usuario debe tener al menos 3 caracteres")
      return
    }

    try {
      setLoading(true)

      // Llamar al servicio para actualizar el nombre de usuario
      const success = await UserService.updateUsername(newUsername)

      if (success) {
        Alert.alert("Éxito", "Nombre de usuario actualizado correctamente", [
          { text: "OK", onPress: () => navigation.goBack() },
        ])
      } else {
        Alert.alert("Error", "No se pudo actualizar el nombre de usuario. Inténtalo de nuevo.")
      }
    } catch (error) {
      console.error("Error al cambiar el nombre de usuario:", error)
      Alert.alert("Error", "Ocurrió un error al actualizar el nombre de usuario. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
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
