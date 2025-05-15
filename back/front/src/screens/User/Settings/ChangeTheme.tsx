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
  Switch,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import { useTheme } from "../../../contexts/ThemeContext"
import UserService from "../../../services/User/UserService"
import SecondaryPageHeader from "../../../components/headers/SecondaryPageHeader"

type Props = {
  navigation: any
}

const ChangeTheme: React.FC<Props> = ({ navigation }) => {
  const { theme, setTheme, isLoading } = useTheme()
  const isDark = theme === "dark"
  const [isChanging, setIsChanging] = useState(false)
  const [configInfo, setConfigInfo] = useState<{ id: number; color: string } | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">(theme || "light")

  // Cargar información de la configuración
  useEffect(() => {
    const loadConfigInfo = async () => {
      try {
        console.log("[ChangeTheme] Cargando información de configuración...")
        const config = await UserService.getUserConfiguration()
        if (config) {
          console.log(`[ChangeTheme] Configuración cargada: ID=${config.id}, Color=${config.color_aplicacion}`)
          setConfigInfo({
            id: config.id,
            color: config.color_aplicacion,
          })
        } else {
          console.log("[ChangeTheme] No se pudo cargar la configuración")
        }
      } catch (error) {
        console.error("[ChangeTheme] Error al cargar información de configuración:", error)
      }
    }

    loadConfigInfo()
    setSelectedTheme(theme || "light")
  }, [theme]) // Recargar cuando cambie el tema

  // Determinar si el tema actual es oscuro
  const isDarkMode = theme === "dark"

  // Manejar tap en los recuadros de tema
  const handleThemeSelect = async (newTheme: "light" | "dark") => {
    if (isChanging) return

    setSelectedTheme(newTheme)

    try {
      setIsChanging(true)
      console.log(`[ChangeTheme] Intentando cambiar tema a: ${newTheme}`)

      // Mostrar mensaje de confirmación
      if (Platform.OS === "web") {
        // En web, cambiar directamente
        await setTheme(newTheme)
        setIsChanging(false)
      } else {
        // En dispositivos móviles, mostrar confirmación
        Alert.alert(
          "Cambiar tema",
          `¿Estás seguro de que quieres cambiar al modo ${newTheme === "dark" ? "oscuro" : "claro"}?`,
          [
            {
              text: "Cancelar",
              style: "cancel",
              onPress: () => {
                console.log("[ChangeTheme] Cambio de tema cancelado")
                setSelectedTheme(theme || "light") // Revertir selección visual
                setIsChanging(false)
              },
            },
            {
              text: "Cambiar",
              onPress: async () => {
                console.log("[ChangeTheme] Confirmado cambio de tema")
                await setTheme(newTheme)
                setIsChanging(false)
              },
            },
          ],
        )
      }
    } catch (error) {
      console.error("[ChangeTheme] Error al cambiar el tema:", error)
      Alert.alert("Error", "No se pudo cambiar el tema. Inténtalo de nuevo más tarde.")
      setSelectedTheme(theme || "light") // Revertir selección visual
      setIsChanging(false)
    }
  }

  // Manejar cambio en el switch
  const toggleSwitch = () => {
    const newTheme = isDarkMode ? "light" : "dark"
    handleThemeSelect(newTheme)
  }

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../../assets/Inter_18pt-SemiBold.ttf"),
  })

  if (!fontsLoaded) {
    return <View style={isDarkMode ? styles.containerDark : styles.container} />
  }

  // Si está cargando, mostrar indicador
  if (isLoading) {
    return (
      <SafeAreaView style={isDarkMode ? styles.containerDark : styles.container}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={isDarkMode ? "#121212" : "#fff"}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? "#4CAF50" : "#006400"} />
          <Text style={isDarkMode ? styles.loadingTextDark : styles.loadingText}>Cargando preferencias...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={isDarkMode ? styles.containerDark : styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#121212" : "#fff"}
      />

      <ScrollView showsVerticalScrollIndicator={false}>

        <SecondaryPageHeader text="Cambiar Tema" isDark={isDark}></SecondaryPageHeader>
        {/* Header */}
        {/* <View style={styles.header}>
          <View style={styles.headerPlaceholder}></View>
          <Text style={isDarkMode ? styles.headerTitleDark : styles.headerTitle}>Cambiar Tema</Text>
          <View style={styles.headerPlaceholder}></View>
        </View> */}

        {/* Subtitle */}
        <View style={styles.titleContainer}>
          <Text style={isDarkMode ? styles.subtitleDark : styles.subtitle}>Selecciona un tema para la aplicación</Text>
        </View>

        {/* Theme Options */}
        <View style={styles.optionsContainer}>
          <View style={isDarkMode ? styles.optionRowDark : styles.optionRow}>
            <View style={styles.optionLabelContainer}>
              <Text style={isDarkMode ? styles.optionLabelDark : styles.optionLabel}>Modo Oscuro</Text>
              <Text style={isDarkMode ? styles.optionDescriptionDark : styles.optionDescription}>
                {selectedTheme === "dark" ? "Activado" : "Desactivado"}
              </Text>
            </View>
            {isChanging ? (
              <ActivityIndicator size="small" color={isDarkMode ? "#4CAF50" : "#006400"} />
            ) : (
              <Switch
                trackColor={{ false: "#D9D9D9", true: isDarkMode ? "#2E7D32" : "#006400" }}
                thumbColor={"#FFFFFF"}
                ios_backgroundColor="#D9D9D9"
                onValueChange={toggleSwitch}
                value={selectedTheme === "dark"}
              />
            )}
          </View>

          {/* Theme Preview */}
          <View style={styles.previewSection}>
            <Text style={isDarkMode ? styles.previewTitleDark : styles.previewTitle}>Selecciona un tema</Text>

            <View style={isDarkMode ? styles.themePreviewContainerDark : styles.themePreviewContainer}>
              <View style={styles.previewRow}>
                {/* Light Theme Preview */}
                <TouchableOpacity
                  style={[
                    styles.previewCard,
                    selectedTheme === "light" && styles.previewCardActive,
                    isDarkMode && styles.previewCardDark,
                  ]}
                  onPress={() => handleThemeSelect("light")}
                  activeOpacity={0.7}
                  disabled={isChanging}
                >
                  <View style={styles.previewLightTheme}>
                    <View style={styles.previewHeader}>
                      <View style={styles.previewStatusBar} />
                      <View style={styles.previewNavBar} />
                    </View>
                    <View style={styles.previewContent}>
                      <View style={styles.previewTextLine} />
                      <View style={styles.previewTextLineShort} />
                      <View style={styles.previewButton} />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.previewLabel,
                      selectedTheme === "light" && styles.previewLabelActive,
                      isDarkMode && styles.previewLabelDark,
                    ]}
                  >
                    Tema Claro
                  </Text>
                </TouchableOpacity>

                {/* Dark Theme Preview */}
                <TouchableOpacity
                  style={[
                    styles.previewCard,
                    selectedTheme === "dark" && styles.previewCardActive,
                    isDarkMode && styles.previewCardDark,
                  ]}
                  onPress={() => handleThemeSelect("dark")}
                  activeOpacity={0.7}
                  disabled={isChanging}
                >
                  <View style={styles.previewDarkTheme}>
                    <View style={styles.previewHeaderDark}>
                      <View style={styles.previewStatusBarDark} />
                      <View style={styles.previewNavBarDark} />
                    </View>
                    <View style={styles.previewContentDark}>
                      <View style={styles.previewTextLineDark} />
                      <View style={styles.previewTextLineShortDark} />
                      <View style={styles.previewButtonDark} />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.previewLabel,
                      selectedTheme === "dark" && styles.previewLabelActive,
                      isDarkMode && styles.previewLabelDark,
                    ]}
                  >
                    Tema Oscuro
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Note */}
          <View style={isDarkMode ? styles.noteContainerDark : styles.noteContainer}>
            <Text style={isDarkMode ? styles.noteTitleDark : styles.noteTitle}>
              <Ionicons name="information-circle-outline" size={18} color={isDarkMode ? "#4CAF50" : "#006400"} /> Acerca
              de los temas
            </Text>

            <View style={styles.noteItemContainer}>
              <View style={styles.bulletPoint}>
                <View style={isDarkMode ? styles.bulletDark : styles.bullet} />
              </View>
              <Text style={isDarkMode ? styles.noteTextDark : styles.noteText}>
                El <Text style={styles.boldText}>Modo Claro</Text> es ideal para usar la aplicación durante el día o en
                entornos bien iluminados.
              </Text>
            </View>

            <View style={styles.noteItemContainer}>
              <View style={styles.bulletPoint}>
                <View style={isDarkMode ? styles.bulletDark : styles.bullet} />
              </View>
              <Text style={isDarkMode ? styles.noteTextDark : styles.noteText}>
                El <Text style={styles.boldText}>Modo Oscuro</Text> reduce la fatiga visual en entornos con poca luz y
                ahorra batería en dispositivos con pantalla OLED.
              </Text>
            </View>

            <View style={styles.noteItemContainer}>
              <View style={styles.bulletPoint}>
                <View style={isDarkMode ? styles.bulletDark : styles.bullet} />
              </View>
              <Text style={isDarkMode ? styles.noteTextDark : styles.noteText}>
                Tu preferencia de tema se guardará y aplicará automáticamente en todos tus dispositivos cuando inicies
                sesión.
              </Text>
            </View>
          </View>

          {/* Botón de ayuda */}
          <TouchableOpacity
            style={isDarkMode ? styles.helpButtonDark : styles.helpButton}
            onPress={() =>
              Alert.alert(
                "Ayuda sobre temas",
                "Si tienes problemas con el tema, puedes cerrar sesión y volver a iniciar para restablecer la configuración. Si el problema persiste, contacta con soporte.",
              )
            }
          >
            <Ionicons name="help-circle-outline" size={20} color={isDarkMode ? "#FFFFFF" : "#006400"} />
            <Text style={isDarkMode ? styles.helpButtonTextDark : styles.helpButtonText}>¿Necesitas ayuda?</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
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
    marginBottom: 8,
  },
  titleDark: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#666",
  },
  subtitleDark: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#aaa",
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionRowDark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  optionLabelContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#333",
  },
  optionLabelDark: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#e0e0e0",
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#666",
    marginTop: 2,
  },
  optionDescriptionDark: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#aaa",
    marginTop: 2,
  },
  previewSection: {
    marginTop: 24,
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#333",
    marginBottom: 16,
  },
  previewTitleDark: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#e0e0e0",
    marginBottom: 16,
  },
  themePreviewContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  themePreviewContainerDark: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewCard: {
    width: "48%",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  previewCardDark: {
    borderColor: "transparent",
  },
  previewCardActive: {
    borderColor: "#006400",
  },
  previewLightTheme: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    height: 160,
  },
  previewDarkTheme: {
    backgroundColor: "#121212",
    borderRadius: 8,
    overflow: "hidden",
    height: 160,
  },
  previewHeader: {
    backgroundColor: "#fff",
  },
  previewHeaderDark: {
    backgroundColor: "#121212",
  },
  previewStatusBar: {
    height: 10,
    backgroundColor: "#f0f0f0",
  },
  previewStatusBarDark: {
    height: 10,
    backgroundColor: "#000",
  },
  previewNavBar: {
    height: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  previewNavBarDark: {
    height: 20,
    backgroundColor: "#121212",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  previewContent: {
    padding: 10,
    backgroundColor: "#fff",
    flex: 1,
  },
  previewContentDark: {
    padding: 10,
    backgroundColor: "#121212",
    flex: 1,
  },
  previewTextLine: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginBottom: 8,
  },
  previewTextLineDark: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 8,
  },
  previewTextLineShort: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginBottom: 16,
    width: "70%",
  },
  previewTextLineShortDark: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    marginBottom: 16,
    width: "70%",
  },
  previewButton: {
    height: 20,
    backgroundColor: "#006400",
    borderRadius: 4,
    width: "50%",
    alignSelf: "center",
  },
  previewButtonDark: {
    height: 20,
    backgroundColor: "#2E7D32",
    borderRadius: 4,
    width: "50%",
    alignSelf: "center",
  },
  previewLabel: {
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Inter-Medium",
    fontSize: 12,
    color: "#666",
  },
  previewLabelDark: {
    color: "#aaa",
  },
  previewLabelActive: {
    color: "#006400",
    fontFamily: "Inter-SemiBold",
  },
  noteContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  noteContainerDark: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#333",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  noteTitleDark: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#e0e0e0",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  noteItemContainer: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-start",
  },
  bulletPoint: {
    width: 20,
    alignItems: "center",
    paddingTop: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#006400",
  },
  bulletDark: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  noteText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#555",
    flex: 1,
    lineHeight: 22,
  },
  noteTextDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#bbb",
    flex: 1,
    lineHeight: 22,
  },
  boldText: {
    fontFamily: "Inter-Medium",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  helpButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  helpButtonText: {
    color: "#006400",
    fontFamily: "Inter-Medium",
    fontSize: 14,
    marginLeft: 8,
  },
  helpButtonTextDark: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
    marginLeft: 8,
  },
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    flex: 1,
    textAlign: "center",
  },
  headerTitleDark: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    flex: 1,
    textAlign: "center",
  },
})

export default ChangeTheme