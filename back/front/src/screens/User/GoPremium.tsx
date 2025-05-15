"use client"

import type { StackScreenProps } from "@react-navigation/stack"
import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import UserService from "../../services/User/UserService"
import type { RootParamList } from "../../navigation/RootParamList"
import { showAlert } from "../../components/Alert"
import { useTheme } from "../../contexts/ThemeContext"
import SecondaryPageHeader from "../../components/headers/SecondaryPageHeader"

type Props = StackScreenProps<RootParamList, "GoPremium">

const GoPremium: React.FC<Props> = ({ navigation }) => {
  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Estados
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [processingSubscription, setProcessingSubscription] = useState(false)

  // Cargar datos del usuario
  const loadUserData = async () => {
    try {
      setLoading(true)
      const userData = await UserService.getCurrentUser()
      if (userData) {
        setUser(userData)
      } else {
        showAlert("No se pudieron cargar tus datos. Por favor, inténtalo de nuevo.", "error")
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error)
      showAlert("Ocurrió un error al cargar tus datos. Por favor, inténtalo de nuevo.", "error")
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUserData()
  }, [])

  // Manejar suscripción premium
  const handlePremiumSubscription = async () => {
    if (!user) return

    try {
      setProcessingSubscription(true)

      if (user.premium) {
        // Cancelar premium directamente sin confirmación adicional
        const success = await UserService.cancelPremium()
        if (success) {
          setUser((prevUser: any) => ({
            ...prevUser,
            premium: false,
          }))
          showAlert("Tu suscripción premium ha sido cancelada", "success")
          
          // Notificar a la pantalla anterior que se actualizó el estado premium
          navigation.navigate({
            name: 'MyAccount',
            params: { premiumUpdated: true },
            merge: true,
          });
        } else {
          showAlert("No se pudo cancelar tu suscripción premium", "error")
        }
        setProcessingSubscription(false)
      } else {
        // Suscribir a premium
        const success = await UserService.subscribeToPremium()
        if (success) {
          setUser((prevUser: any) => ({
            ...prevUser,
            premium: true,
          }))
          showAlert("¡Ahora eres usuario premium!", "success")
          
          // Notificar a la pantalla anterior que se actualizó el estado premium
          navigation.navigate({
            name: 'MyAccount',
            params: { premiumUpdated: true },
            merge: true,
          });
        } else {
          showAlert("No se pudo completar la suscripción premium", "error")
        }
        setProcessingSubscription(false)
      }
    } catch (error) {
      console.error("Error al gestionar suscripción premium:", error)
      showAlert("Ocurrió un error al procesar tu solicitud", "error")
      setProcessingSubscription(false)
    }
  }

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  if (!fontsLoaded) {
    return <View style={isDark ? styles.containerDark : styles.container} />
  }

  if (loading) {
    return (
      <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#4CAF50" : "#006400"} />
          <Text style={isDark ? styles.loadingTextDark : styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={isDark ? styles.headerTitleDark : styles.headerTitle}>Plan Premium</Text>
        <View style={styles.headerPlaceholder}></View>
      </View> */}

      <SecondaryPageHeader text="Hazte Premium" isDark={isDark}></SecondaryPageHeader>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* <Text style={isDark ? styles.titleDark : styles.title}>Hazte Premium</Text> */}

        <View style={isDark ? styles.premiumCardDark : styles.premiumCard}>
          <View style={styles.crownContainer}>
            <Ionicons name="diamond" size={40} color={isDark ? "#FFD700" : "#FFD700"} />
          </View>
          
          <Text style={isDark ? styles.planTitleDark : styles.planTitle}>Plan Premium</Text>
          
          <View style={styles.priceContainer}>
            <Text style={isDark ? styles.priceDark : styles.price}>$5.99</Text>
            <Text style={isDark ? styles.periodDark : styles.period}>/mes</Text>
          </View>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark" size={20} color={isDark ? "#4CAF50" : "#006400"} />
              <Text style={isDark ? styles.benefitTextDark : styles.benefitText}>Sin anuncios</Text>
            </View>
            
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark" size={20} color={isDark ? "#4CAF50" : "#006400"} />
              <Text style={isDark ? styles.benefitTextDark : styles.benefitText}>Sin distracciones</Text>
            </View>
            
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark" size={20} color={isDark ? "#4CAF50" : "#006400"} />
              <Text style={isDark ? styles.benefitTextDark : styles.benefitText}>Experiencia mejorada</Text>
            </View>
          </View>

          <Text style={isDark ? styles.descriptionDark : styles.description}>
            ¡Únete ahora y obtén acceso a todas las funciones premium!
          </Text>

          <TouchableOpacity
            style={
              user?.premium
                ? isDark
                  ? styles.cancelButtonDark
                  : styles.cancelButton
                : isDark
                  ? styles.subscribeButtonDark
                  : styles.subscribeButton
            }
            onPress={handlePremiumSubscription}
            disabled={processingSubscription}
          >
            {processingSubscription ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {user?.premium ? "Cancelar Suscripción" : "Suscribirse Ahora"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.securePaymentContainer}>
            <Ionicons name="lock-closed" size={14} color={isDark ? "#aaa" : "#666"} />
            <Text style={isDark ? styles.securePaymentTextDark : styles.securePaymentText}>
              Pago seguro procesado por Stripe
            </Text>
          </View>
        </View>
      </ScrollView>
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontFamily: "Inter-Regular",
  },
  loadingTextDark: {
    marginTop: 10,
    color: "#aaa",
    fontFamily: "Inter-Regular",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  headerTitleDark: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
  },
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    marginBottom: 24,
    textAlign: "center",
  },
  titleDark: {
    fontSize: 28,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    marginBottom: 24,
    textAlign: "center",
  },
  premiumCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  premiumCardDark: {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  crownContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  planTitleDark: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#e0e0e0",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  priceDark: {
    fontSize: 32,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
  },
  period: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666",
    marginBottom: 4,
    marginLeft: 2,
  },
  periodDark: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#aaa",
    marginBottom: 4,
    marginLeft: 2,
  },
  benefitsContainer: {
    alignSelf: "stretch",
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
    marginLeft: 12,
  },
  benefitTextDark: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#e0e0e0",
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  descriptionDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#aaa",
    textAlign: "center",
    marginBottom: 24,
  },
  subscribeButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  subscribeButtonDark: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: "#D32F2F",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cancelButtonDark: {
    backgroundColor: "#C62828",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  securePaymentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  securePaymentText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#666",
    marginLeft: 4,
  },
  securePaymentTextDark: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#aaa",
    marginLeft: 4,
  },
})

export default GoPremium