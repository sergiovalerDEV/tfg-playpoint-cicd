"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import LoginRegisterService from "../../services/LoginRegister/LoginRegisterService"
import { useTheme } from "../../contexts/ThemeContext"
import UserService from "../../services/User/UserService"

// Props simplificadas sin dependencia de RootParamList
interface LoginProps {
  navigation: {
    navigate: (screen: string) => void
  }
}

const Login: React.FC<LoginProps> = ({ navigation }) => {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { setTheme } = useTheme()

  useEffect(() => {
    const isLoggedIn = async () => {
      const isLogged: boolean = await UserService.isLoggedIn()
      if(isLogged){
        navigation.navigate("SearchMeetings")
      }
    }
    isLoggedIn()
  }, [navigation])

  // Cargar fuentes Inter
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Manejar envío del formulario de login
  const handleLogin = async () => {
    // Limpiar mensajes de error previos
    setErrorMessage(null)

    // Validar entradas
    if (!name.trim()) {
      setErrorMessage("Por favor ingresa tu nombre de usuario")
      return
    }

    if (!password) {
      setErrorMessage("Por favor ingresa tu contraseña")
      return
    }

    setLoading(true)

    try {
      // Usar LoginRegisterService para iniciar sesión
      const resultado = await LoginRegisterService.login({
        nombre: name.trim(),
        contrasena: password,
      })

      if (resultado.success) {
        console.log("Inicio de sesión exitoso, token recibido")

        // NUEVO: Obtener y aplicar el tema del usuario desde la base de datos
        try {
          console.log("Obteniendo tema del usuario desde la base de datos...")
          const userTheme = await UserService.getCurrentTheme()
          console.log(`Tema obtenido: ${userTheme}`)

          // Aplicar el tema
          await setTheme(userTheme)
          console.log(`Tema aplicado: ${userTheme}`)
        } catch (themeError) {
          console.error("Error al obtener/aplicar el tema:", themeError)
          // Continuar con la navegación aunque haya error en el tema
        }

        // Navegar a la pantalla principal
        navigation.navigate("SearchMeetings")
      } else {
        // Mostrar mensaje de error
        setErrorMessage(resultado.message || "Error de inicio de sesión")
      }
    } catch (error) {
      console.error("Error de login:", error)
      setErrorMessage("Error de conexión. Por favor verifica tu internet.")
    } finally {
      setLoading(false)
    }
  }

  if (!fontsLoaded) {
    return <View style={styles.container} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Contenido del Login */}
          <View style={styles.content}>
            <Text style={styles.loginTitle}>Iniciar Sesión</Text>

            {/* Mensaje de error */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#9e9e9e"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#9e9e9e"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#9e9e9e" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")} disabled={loading}>
                <Text style={styles.registerLink}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  loginTitle: {
    fontSize: 28,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#D32F2F",
  },
  errorText: {
    color: "#D32F2F",
    fontFamily: "Inter-Regular",
    fontSize: 14,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 16,
  },
  input: {
    height: 50,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -11 }],
  },
  loginButton: {
    height: 50,
    backgroundColor: "#006400",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonDisabled: {
    backgroundColor: "#6B8E6B", // Verde más claro cuando está deshabilitado
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  registerText: {
    color: "#333",
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  registerLink: {
    color: "#006400",
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginLeft: 4,
  },
})

export default Login
