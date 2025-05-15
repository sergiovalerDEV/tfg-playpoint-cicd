"use client"

import type { StackScreenProps } from "@react-navigation/stack"
import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from "react-native"
import type { RootParamList } from "../../navigation/RootParamList"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import { useTheme } from "../../contexts/ThemeContext" // Importar el contexto de tema
import SecondaryPageHeader from "../../components/headers/SecondaryPageHeader"

type Props = StackScreenProps<RootParamList, "Settings">

const Settings: React.FC<Props> = ({ navigation }) => {
  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  if (!fontsLoaded) {
    return <View style={isDark ? styles.containerDark : styles.container} />
  }

  return (
    <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />
      
      <SecondaryPageHeader text={"Configuración"} isDark={isDark}></SecondaryPageHeader>

      <ScrollView style={isDark ? styles.scrollViewDark : styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Section */}
        <View style={styles.section}>
          <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitle}>User</Text>

          <TouchableOpacity
            style={isDark ? styles.settingButtonDark : styles.settingButton}
            onPress={() => navigation.navigate("ChangeUsername")}
          >
            <Ionicons name="person-outline" size={20} color={isDark ? "#4CAF50" : "#006400"} />
            <Text style={isDark ? styles.settingButtonTextDark : styles.settingButtonText}>Cambiar Nombre de Usuario</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={isDark ? styles.settingButtonDark : styles.settingButton}
            onPress={() => navigation.navigate("ChangeEmail")}
          >
            <Ionicons name="mail-outline" size={20} color={isDark ? "#4CAF50" : "#006400"} />
            <Text style={isDark ? styles.settingButtonTextDark : styles.settingButtonText}>Cambiar Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={isDark ? styles.settingButtonDark : styles.settingButton}
            onPress={() => navigation.navigate("ChangePhoneNumber")}
          >
            <Ionicons name="phone-portrait-outline" size={20} color={isDark ? "#4CAF50" : "#006400"} />
            <Text style={isDark ? styles.settingButtonTextDark : styles.settingButtonText}>Cambiar Número de Teléfono</Text>
          </TouchableOpacity>
        </View>

        {/* System Section */}
        <View style={styles.section}>
          <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitle}>System</Text>

          <TouchableOpacity
            style={isDark ? styles.settingButtonDark : styles.settingButton}
            onPress={() => navigation.navigate("ChangeTheme")}
          >
            <Ionicons name="color-palette-outline" size={20} color={isDark ? "#4CAF50" : "#006400"} />
            <Text style={isDark ? styles.settingButtonTextDark : styles.settingButtonText}>Tema</Text>
            <Ionicons name="chevron-down" size={16} color={isDark ? "#aaa" : "#777"} style={styles.dropdownIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={isDark ? styles.settingButtonDark : styles.settingButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={20} color={isDark ? "#4CAF50" : "#006400"} />
            <Text style={isDark ? styles.settingButtonTextDark : styles.settingButtonText}>Notificaciones</Text>
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
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollViewDark: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-Medium",
    color: "#333",
    marginBottom: 12,
  },
  sectionTitleDark: {
    fontSize: 18,
    fontFamily: "Inter-Medium",
    color: "#e0e0e0",
    marginBottom: 12,
  },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f0e0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  settingButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E3320",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  settingButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#333",
    marginLeft: 12,
  },
  settingButtonTextDark: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#e0e0e0",
    marginLeft: 12,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
})

export default Settings