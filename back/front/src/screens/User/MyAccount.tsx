"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import UserService from "../../services/User/UserService"
import { showAlert } from "../../components/Alert"
import { useTheme } from "../../contexts/ThemeContext"
import MyAccountHeader from "../../components/headers/MyAccountHeader"

type Props = {
  navigation: any
  route: any
}

const MyAccount: React.FC<Props> = ({ navigation, route }) => {
  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Estados para los datos del usuario
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [refreshingPoints, setRefreshingPoints] = useState(false)
  const [photoOptionsVisible, setPhotoOptionsVisible] = useState(false)

  // Cargar datos del usuario
  const loadUserData = async () => {
    try {
      setLoading(true)

      // Verificar si el usuario está autenticado
      const isLoggedIn = await UserService.isLoggedIn()
      if (!isLoggedIn) {
        console.log("Usuario no autenticado, redirigiendo a login")
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
        return
      }

      // Obtener datos del usuario
      const userData = await UserService.getCurrentUser()
      if (userData) {
        setUser(userData)
        console.log("Datos de usuario cargados:", userData)
      } else {
        console.log("No se pudieron obtener los datos del usuario")
        showAlert("No se pudieron cargar tus datos. Por favor, inténtalo de nuevo.", "error")
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error)
      showAlert("Ocurrió un error al cargar tus datos. Por favor, inténtalo de nuevo.", "error")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Cargar datos al montar el componente y cuando se actualiza el estado premium
  useEffect(() => {
    // Añadir un listener para cuando la pantalla recibe el foco
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("MyAccount recibió el foco - recargando datos de usuario")
      loadUserData()
    })

    // Cargar datos iniciales
    loadUserData()

    // Limpiar el listener cuando el componente se desmonta
    return unsubscribe
  }, [navigation])

  // Efecto para manejar la actualización del estado premium
  useEffect(() => {
    if (route.params?.premiumUpdated) {
      // Recargar datos del usuario cuando se actualiza el estado premium
      loadUserData()
      // Limpiar el parámetro para evitar recargas innecesarias
      navigation.setParams({ premiumUpdated: undefined })
    }
  }, [route.params?.premiumUpdated])

  // Mostrar opciones para cambiar foto de perfil
  const handleChangeProfilePicture = () => {
    setPhotoOptionsVisible(true)
  }

  // Manejar selección de imagen de la galería
  const handleSelectFromGallery = async () => {
    try {
      setPhotoOptionsVisible(false)
      setUploadingImage(true)

      // Seleccionar imagen de la galería
      const imageFile = await UserService.pickImage()
      if (!imageFile) {
        setUploadingImage(false)
        return
      }

      // Subir imagen al servidor
      const uploadedImageUrl = await UserService.uploadProfilePicture(imageFile)

      if (uploadedImageUrl) {
        // Actualizar estado local
        setUser((prevUser: any) => ({
          ...prevUser,
          foto_perfil: uploadedImageUrl,
        }))

        showAlert("Foto de perfil actualizada correctamente", "success")
      } else {
        showAlert("No se pudo actualizar la foto de perfil", "error")
      }
    } catch (error) {
      console.error("Error al cambiar foto de perfil desde galería:", error)
      showAlert("Ocurrió un error al actualizar tu foto de perfil. Por favor, inténtalo de nuevo.", "error")
    } finally {
      setUploadingImage(false)
    }
  }

  // Manejar toma de foto con la cámara
  const handleTakePhoto = async () => {
    try {
      setPhotoOptionsVisible(false)
      setUploadingImage(true)

      // Tomar foto con la cámara
      const imageFile = await UserService.takePhoto()
      if (!imageFile) {
        setUploadingImage(false)
        return
      }

      // Subir imagen al servidor
      const uploadedImageUrl = await UserService.uploadProfilePicture(imageFile)

      if (uploadedImageUrl) {
        // Actualizar estado local
        setUser((prevUser: any) => ({
          ...prevUser,
          foto_perfil: uploadedImageUrl,
        }))

        showAlert("Foto de perfil actualizada correctamente", "success")
      } else {
        showAlert("No se pudo actualizar la foto de perfil", "error")
      }
    } catch (error) {
      console.error("Error al tomar foto con la cámara:", error)
      showAlert("Ocurrió un error al actualizar tu foto de perfil. Por favor, inténtalo de nuevo.", "error")
    } finally {
      setUploadingImage(false)
    }
  }

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      console.log("Iniciando proceso de cierre de sesión directo")
      setLoggingOut(true)

      // Implementación directa sin usar showAlert
      await UserService.logout()
      console.log("Logout exitoso, redirigiendo a Login")

      // Asegurarse de que la navegación se realice correctamente
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      setLoggingOut(false)
      // Mostrar mensaje de error sin usar showAlert
      alert("No se pudo cerrar sesión. Inténtalo de nuevo.")
    }
  }

  // Navegar a la pantalla premium
  const navigateToPremium = () => {
    navigation.navigate("GoPremium")
  }

  const handleRefreshCompetitivePoints = async () => {
    try {
      setRefreshingPoints(true)
      const updatedPoints = await UserService.getCompetitivePointsFromDB()

      // Update the user state with the new points
      setUser((prevUser: any) => ({
        ...prevUser,
        puntuacion_competitiva: updatedPoints,
      }))

      // Show success message
      showAlert("Puntuación competitiva actualizada correctamente", "success")
    } catch (error) {
      console.error("Error al actualizar puntuación competitiva:", error)
      showAlert("No se pudo actualizar la puntuación competitiva", "error")
    } finally {
      setRefreshingPoints(false)
    }
  }

  // Load Inter font - MANTENIENDO LA UBICACIÓN ORIGINAL DE LAS FUENTES
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  if (!fontsLoaded) {
    return <View style={isDark ? styles.containerDark : styles.container} />
  }

  if (loading || loggingOut) {
    return (
      <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />
        <View style={isDark ? styles.loadingContainerDark : styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#4CAF50" : "#006400"} />
          <Text style={isDark ? styles.loadingTextDark : styles.loadingText}>
            {loggingOut ? "Cerrando sesión..." : "Cargando datos..."}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      <MyAccountHeader isDark={isDark} userPremium={user?.premium}></MyAccountHeader>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header con botón premium */}
        {/* <View style={styles.header}>
          <View style={styles.headerPlaceholder}></View>
          <Text style={isDark ? styles.headerTitleDark : styles.headerTitle}>Mi Cuenta</Text>
          <TouchableOpacity style={styles.premiumIconButton} onPress={navigateToPremium} activeOpacity={0.7}>
            <Ionicons
              name="diamond"
              size={24}
              color={user?.premium ? (isDark ? "#FFD700" : "#FFD700") : isDark ? "#4CAF50" : "#006400"}
            />
          </TouchableOpacity>
        </View> */}

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={isDark ? styles.profileImageContainerDark : styles.profileImageContainer}>
            {uploadingImage ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color={isDark ? "#4CAF50" : "#006400"} />
              </View>
            ) : user?.foto_perfil ? (
              <Image source={{ uri: user.foto_perfil }} style={styles.profileImage} />
            ) : (
              <View
                style={[
                  isDark ? styles.profileImageContainerDark : styles.profileImageContainer,
                  { justifyContent: "center", alignItems: "center" },
                ]}
              >
                <Text
                  style={{
                    fontSize: 48,
                    fontFamily: "Inter-SemiBold",
                    color: isDark ? "#FFFFFF" : "#006400",
                  }}
                >
                  {user?.nombre && user.nombre.trim() !== ""
                    ? user.nombre.trim().split(/\s+/).length > 1
                      ? `${user.nombre.trim().split(/\s+/)[0][0]}${user.nombre.trim().split(/\s+/)[user.nombre.trim().split(/\s+/).length - 1][0]}`.toUpperCase()
                      : user.nombre.trim()[0].toUpperCase()
                    : "U"}
                </Text>
              </View>
            )}
          </View>

          {/* Botón para cambiar foto de perfil */}
          <TouchableOpacity
            style={isDark ? styles.changePhotoButtonDark : styles.changePhotoButton}
            onPress={handleChangeProfilePicture}
            disabled={uploadingImage}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={16} color={isDark ? "#fff" : "#fff"} style={styles.buttonIcon} />
            <Text style={styles.changePhotoText}>Cambiar foto</Text>
          </TouchableOpacity>

          <View style={isDark ? styles.userInfoContainerDark : styles.userInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={isDark ? styles.infoLabelDark : styles.infoLabel}>Nombre de usuario:</Text>
              <Text style={isDark ? styles.infoValueDark : styles.infoValue}>{user?.nombre || "No disponible"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={isDark ? styles.infoLabelDark : styles.infoLabel}>Correo electrónico:</Text>
              <Text style={isDark ? styles.infoValueDark : styles.infoValue}>{user?.correo || "No disponible"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={isDark ? styles.infoLabelDark : styles.infoLabel}>Número de teléfono:</Text>
              <Text style={isDark ? styles.infoValueDark : styles.infoValue}>
                {UserService.formatPhoneNumber(user?.numero_telefono)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={isDark ? styles.infoLabelDark : styles.infoLabel}>Estado premium:</Text>
              <View style={user?.premium ? styles.premiumBadge : styles.nonPremiumBadge}>
                <Text style={user?.premium ? styles.premiumBadgeText : styles.nonPremiumBadgeText}>
                  {user?.premium ? "Premium" : "Estándar"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={isDark ? styles.infoLabelDark : styles.infoLabel}>Puntuación competitiva:</Text>
              <View style={styles.scoreContainer}>
                <Text style={isDark ? styles.scoreValueDark : styles.scoreValue}>
                  {user?.puntuacion_competitiva || 0}
                </Text>
                <TouchableOpacity
                  onPress={handleRefreshCompetitivePoints}
                  disabled={refreshingPoints}
                  style={[styles.refreshButton, { backgroundColor: isDark ? "#1E3320" : "#e0f0e0" }]}
                >
                  {refreshingPoints ? (
                    <ActivityIndicator size="small" color={isDark ? "#4CAF50" : "#006400"} />
                  ) : (
                    <Ionicons name="refresh-outline" size={16} color={isDark ? "#4CAF50" : "#006400"} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={isDark ? styles.menuButtonDark : styles.menuButton}
            onPress={() => navigation.navigate("MyMeetings")}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={20} color={isDark ? "#4CAF50" : "#006400"} />
            <Text style={isDark ? styles.menuButtonTextDark : styles.menuButtonText}>Mis Quedadas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={isDark ? styles.menuButtonDark : styles.menuButton}
            onPress={() => navigation.navigate("Stats")}
            activeOpacity={0.7}
          >
            <Ionicons name="stats-chart-outline" size={20} color={isDark ? "#4CAF50" : "#006400"} />
            <Text style={isDark ? styles.menuButtonTextDark : styles.menuButtonText}>Estadísticas Personales</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={isDark ? styles.menuButtonDark : styles.menuButton}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={isDark ? "#4CAF50" : "#006400"} />
            <Text style={isDark ? styles.menuButtonTextDark : styles.menuButtonText}>Configuración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={isDark ? styles.logoutButtonDark : styles.logoutButton}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={isDark ? "#FF5252" : "#D32F2F"} />
            <Text style={isDark ? styles.logoutButtonTextDark : styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal para opciones de foto */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={photoOptionsVisible}
        onRequestClose={() => setPhotoOptionsVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPhotoOptionsVisible(false)}>
          <View style={isDark ? styles.photoOptionsContainerDark : styles.photoOptionsContainer}>
            <Text style={isDark ? styles.photoOptionsHeaderDark : styles.photoOptionsHeader}>
              Cambiar foto de perfil
            </Text>

            <TouchableOpacity style={isDark ? styles.photoOptionDark : styles.photoOption} onPress={handleTakePhoto}>
              <Ionicons
                name="camera-outline"
                size={24}
                color={isDark ? "#4CAF50" : "#006400"}
                style={styles.photoOptionIcon}
              />
              <Text style={isDark ? styles.photoOptionTextDark : styles.photoOptionText}>Tomar una foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={isDark ? styles.photoOptionDark : styles.photoOption}
              onPress={handleSelectFromGallery}
            >
              <Ionicons
                name="image-outline"
                size={24}
                color={isDark ? "#4CAF50" : "#006400"}
                style={styles.photoOptionIcon}
              />
              <Text style={isDark ? styles.photoOptionTextDark : styles.photoOptionText}>
                Seleccionar de la galería
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={isDark ? styles.cancelButtonDark : styles.cancelButton}
              onPress={() => setPhotoOptionsVisible(false)}
            >
              <Text style={isDark ? styles.cancelButtonTextDark : styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  loadingContainerDark: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  loadingTextDark: {
    fontFamily: "Inter-Regular",
    fontSize: 16,
    color: "#aaa",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  premiumIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    flex: 1,
    textAlign: "center",
  },
  headerTitleDark: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    flex: 1,
    textAlign: "center",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#f5f5f5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImageContainerDark: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#006400",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  changePhotoButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 6,
  },
  changePhotoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  userInfoContainer: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  userInfoContainerDark: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#333",
    marginRight: 5,
    width: 150,
  },
  infoLabelDark: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#e0e0e0",
    marginRight: 5,
    width: 150,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#555",
    flex: 1,
  },
  infoValueDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#aaa",
    flex: 1,
  },
  scoreValue: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  scoreValueDark: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
  },
  premiumBadge: {
    backgroundColor: "#006400",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  premiumBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  nonPremiumBadge: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  nonPremiumBadgeText: {
    color: "#555555",
    fontSize: 12,
    fontFamily: "Inter-Medium",
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f0e0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E3320",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  menuButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#006400",
    marginLeft: 12,
  },
  menuButtonTextDark: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#4CAF50",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#331A1A",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#D32F2F",
    marginLeft: 12,
  },
  logoutButtonTextDark: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#FF5252",
    marginLeft: 12,
  },
  headerPlaceholder: {
    width: 40,
    height: 40,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  refreshButton: {
    marginLeft: 10,
    padding: 4,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // Estilos para el modal de opciones de foto
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoOptionsContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photoOptionsContainerDark: {
    width: "80%",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  photoOptionsHeader: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    marginBottom: 16,
    textAlign: "center",
  },
  photoOptionsHeaderDark: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    marginBottom: 16,
    textAlign: "center",
  },
  photoOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f0e0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  photoOptionDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E3320",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  photoOptionIcon: {
    marginRight: 12,
  },
  photoOptionText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#006400",
  },
  photoOptionTextDark: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonDark: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#666",
  },
  cancelButtonTextDark: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#aaa",
  },
})

export default MyAccount
