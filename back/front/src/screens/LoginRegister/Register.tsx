"use client"

import type { StackScreenProps } from "@react-navigation/stack"
import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import type { RootParamList } from "../../navigation/RootParamList"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import LoginRegisterService from "../../services/LoginRegister/LoginRegisterService"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Notifications from "expo-notifications"
import bcrypt from "react-native-bcrypt"
import axios from "axios"
import { API_URL } from "../../../config"
import EmailVerificationModal from "../../components/modals/EmailVerificationModal"

const NOTIFICATION_PERMISSION_KEY = "@notification_permission"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

type Props = StackScreenProps<RootParamList, "Register">

const Register: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const requestNotificationPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, finalStatus)
      return finalStatus === "granted"
    } catch (error) {
      console.error("Error requesting notification permissions:", error)
      return false
    }
  }

  const sendWelcomeNotification = async () => {
    try {
      const permissionStatus = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY)

      if (permissionStatus === "granted") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "¡Bienvenido a PlayPoint!",
            body: `Hola ${username}, gracias por registrarte. Esperamos que disfrutes de la aplicación.`,
            data: { screen: "Home" },
          },
          trigger: null,
        })
      }
    } catch (error) {
      console.error("Error sending welcome notification:", error)
    }
  }

  // Generate a random 6-digit verification code
  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Send verification code to email
  const sendVerificationCode = async () => {
    setVerificationError(null)

    if (!email.trim()) {
      setErrorMessage("Please enter an email address")
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address")
      return
    }

    setVerificationLoading(true)

    try {
      // Generate a new verification code
      const newCode = generateVerificationCode()
      setVerificationCode(newCode)

      // Call the /mailmanager endpoint
      const response = await axios.post<any>(`${API_URL}/mailmanager/enviar/verificacion-correo`, {
        destinatario: email.trim(),
        codigo: newCode,
      })

      if (response.status >= 200 && response.status < 300) {
        // Show the verification modal
        setShowVerificationModal(true)
      } else {
        setVerificationError(response.data.message || "Failed to send verification code. Please try again.")
      }
    } catch (error) {
      console.error("Error sending verification code:", error)
      setVerificationError("An unexpected error occurred. Please try again.")
    } finally {
      setVerificationLoading(false)
    }
  }

  // Verify the entered code
  const verifyCode = (enteredCode: string) => {
    if (enteredCode === verificationCode) {
      setIsEmailVerified(true)
      setShowVerificationModal(false)
      Alert.alert("Éxito", "Email verificado correctamente!")
    } else {
      setVerificationError("Invalid verification code. Please try again.")
    }
  }

  const handleRegister = async () => {
    setErrorMessage(null)

    if (!username.trim()) {
      setErrorMessage("Please enter a username")
      return
    }

    if (!email.trim()) {
      setErrorMessage("Please enter an email address")
      return
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address")
      return
    }

    if (!isEmailVerified) {
      setErrorMessage("Please verify your email before registering")
      return
    }

    if (!password) {
      setErrorMessage("Please enter a password")
      return
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters")
      return
    }

    if (!confirmPassword) {
      setErrorMessage("Please confirm your password")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match")
      return
    }

    if (!phoneNumber.trim()) {
      setErrorMessage("Please enter a phone number")
      return
    }

    const phoneRegex = /^\d{9}$/
    if (!phoneRegex.test(phoneNumber.trim())) {
      setErrorMessage("Phone number must be 9 digits")
      return
    }

    setLoading(true)

    try {
      const result = await LoginRegisterService.register({
        nombre: username.trim(),
        correo: email.trim(),
        contrasena: await bcrypt.hashSync(password, 10),
        numero_telefono: phoneNumber.trim(),
      })

      if (result.success) {
        await sendWelcomeNotification()
        navigation.navigate("Login")
      } else {
        setErrorMessage(result.message || "Registration failed. Please try again.")
      }
    } catch (error) {
      console.error("Registration error:", error)
      setErrorMessage("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    requestNotificationPermissions()
  }, [])

  if (!fontsLoaded) {
    return <View style={styles.container} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.content}>
            <Text style={styles.registerTitle}>Register</Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#9e9e9e"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.emailContainer}>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter your email"
                placeholderTextColor="#9e9e9e"
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  setIsEmailVerified(false) // Reset verification when email changes
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading && !verificationLoading}
              />
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  isEmailVerified && styles.verifiedButton,
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
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
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

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#9e9e9e"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                activeOpacity={0.7}
                disabled={loading}
              >
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#9e9e9e" />
              </TouchableOpacity>
            </View>

            <View style={styles.phoneContainer}>
              <TouchableOpacity style={styles.countryCode} disabled={loading}>
                <Text style={styles.countryCodeText}>+34</Text>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>

              <TextInput
                style={styles.phoneInput}
                placeholder="Phone Number"
                placeholderTextColor="#9e9e9e"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Register</Text>}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")} disabled={loading}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Email Verification Modal Component */}
      <EmailVerificationModal
        visible={showVerificationModal}
        email={email}
        verificationCode={verificationCode}
        verificationError={verificationError}
        onClose={() => setShowVerificationModal(false)}
        onVerify={verifyCode}
        onResend={sendVerificationCode}
        isResending={verificationLoading}
      />
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
  registerTitle: {
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
  emailContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  emailInput: {
    flex: 1,
    height: 50,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  verifyButton: {
    height: 50,
    backgroundColor: "#006400",
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  verifiedButton: {
    backgroundColor: "#4CAF50",
  },
  disabledButton: {
    backgroundColor: "#6B8E6B",
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -11 }],
  },
  phoneContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  countryCode: {
    height: 50,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  phoneInput: {
    flex: 1,
    height: 50,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  registerButton: {
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
  registerButtonDisabled: {
    backgroundColor: "#6B8E6B",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#333",
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  loginLink: {
    color: "#006400",
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginLeft: 4,
  },
})

export default Register
