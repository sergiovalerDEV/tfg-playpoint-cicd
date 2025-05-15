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
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import type { RootParamList } from "../../navigation/RootParamList"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import UserService, { type UserStats } from "../../services/User/UserService"
import { useTheme } from "../../contexts/ThemeContext" // Importar el contexto de tema
import SecondaryPageHeader from "../../components/headers/SecondaryPageHeader"

type Props = StackScreenProps<RootParamList, "Stats">

const Stats: React.FC<Props> = ({ navigation }) => {
  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar estadísticas del usuario
  const loadUserStats = async () => {
    try {
      setLoading(true)
      setError(null)

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

      try {
        // Ejecutar debug para ayudar a identificar problemas
        await UserService.debugUserStats()

        // Obtener estadísticas calculadas (solo de quedadas cerradas)
        console.log("Iniciando cálculo de estadísticas (solo quedadas cerradas)...")
        const userStats = await UserService.calculateUserStats()
        console.log("Estadísticas obtenidas:", JSON.stringify(userStats))

        // Verificar que las estadísticas no sean nulas
        if (userStats) {
          setStats(userStats)

          // Actualizar la puntuación competitiva en el perfil del usuario
          const currentUser = await UserService.getCurrentUser()
          if (currentUser) {
            await UserService.updateUserData({
              puntuacion_competitiva: userStats.competitivePoints,
            })
          }
        } else {
          // Si las estadísticas son nulas, establecer valores predeterminados
          setStats({
            victories: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            matchesPlayed: 0,
            competitivePoints: 0,
            matchHistory: [],
          })
        }
      } catch (statsError) {
        console.error("Error específico al calcular estadísticas:", statsError)
        // No mostrar error al usuario, simplemente mostrar estadísticas vacías
        setStats({
          victories: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          matchesPlayed: 0,
          competitivePoints: 0,
          matchHistory: [],
        })
      }
    } catch (error) {
      console.error("Error general al cargar estadísticas:", error)
      setError("No se pudieron cargar tus estadísticas. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadUserStats()
  }, [navigation])

  // Manejar refresco
  const handleRefresh = () => {
    setRefreshing(true)
    loadUserStats()
  }

  // Manejar tap en un partido para ver detalles
  const handleMatchPress = (quedadaId: number) => {
    navigation.navigate("MeetingDetails", {
      _id: quedadaId,
      meeting: {
        id: quedadaId,
        nombre: "Partido", // Añadimos la propiedad nombre requerida
      },
    })
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />
        <View style={isDark ? styles.loadingContainerDark : styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#4CAF50" : "#006400"} />
          <Text style={isDark ? styles.loadingTextDark : styles.loadingText}>
            Cargando estadísticas de quedadas cerradas...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />
        <View style={isDark ? styles.errorContainerDark : styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={isDark ? "#FF5252" : "#D32F2F"} as any />
          <Text style={isDark ? styles.errorTextDark : styles.errorText}>{error}</Text>
          <TouchableOpacity style={isDark ? styles.retryButtonDark : styles.retryButton} onPress={loadUserStats}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Si no hay estadísticas, mostrar mensaje
  if (!stats || (stats.matchesPlayed === 0 && stats.matchHistory.length === 0)) {
    return (
      <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

        {/* Header with back button */}
        {/* <View style={styles.header}>
          <View style={styles.headerPlaceholder}></View>
          <Text style={isDark ? styles.headerTitleDark : styles.headerTitle}>Estadísticas Personales</Text>
          <View style={styles.headerPlaceholder}></View>
        </View> */}
        <SecondaryPageHeader text="Estadísticas Personales" isDark={isDark}></SecondaryPageHeader>

        <View style={isDark ? styles.emptyContainerDark : styles.emptyContainer}>
          <Ionicons name="stats-chart-outline" size={64} color={isDark ? "#555" : "#ccc"} as any />
          <Text style={isDark ? styles.emptyTextDark : styles.emptyText}>
            No tienes estadísticas disponibles. Participa en quedadas competitivas cerradas para generar estadísticas.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Calculate percentage for visual representation
  const winPercentage = stats.winRate
  const lossPercentage = 100 - winPercentage

  return (
    <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      {/* Header with back button */}
      {/* <View style={styles.header}>
        <View style={styles.headerPlaceholder}></View>
        <Text style={isDark ? styles.headerTitleDark : styles.headerTitle}>Estadísticas Personales</Text>
        <View style={styles.headerPlaceholder}></View>
      </View> */}
      <SecondaryPageHeader text="Estadísticas Personales" isDark={isDark}></SecondaryPageHeader>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[isDark ? "#4CAF50" : "#006400"]}
            tintColor={isDark ? "#4CAF50" : "#006400"}
            progressBackgroundColor={isDark ? "#1e1e1e" : "#fff"}
          />
        }
      >
        {/* Indicador de que solo se muestran quedadas cerradas */}
        <View style={isDark ? styles.filterIndicatorDark : styles.filterIndicator}>
          <Ionicons name="information-circle-outline" size={16} color={isDark ? "#aaa" : "#666"} as any />
          <Text style={isDark ? styles.filterTextDark : styles.filterText}>
            Mostrando solo estadísticas de quedadas cerradas
          </Text>
        </View>

        {/* Main Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={isDark ? styles.statBoxDark : styles.statBox}>
              <Text style={isDark ? styles.statLabelDark : styles.statLabel}>Victorias</Text>
              <Text style={isDark ? styles.statValueDark : styles.statValue}>{stats.victories}</Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${winPercentage}%`,
                      backgroundColor: isDark ? "#4CAF50" : "#006400",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[isDark ? styles.statBoxDark : styles.statBox, styles.middleBox]}>
              <Text style={isDark ? styles.statLabelDark : styles.statLabel}>Derrotas</Text>
              <Text style={isDark ? styles.statValueDark : styles.statValue}>{stats.losses}</Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${lossPercentage}%`,
                      backgroundColor: isDark ? "#FF5252" : "#FF5252",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={isDark ? styles.statBoxDark : styles.statBox}>
              <Text style={isDark ? styles.statLabelDark : styles.statLabel}>% Victoria</Text>
              <Text style={isDark ? styles.statValueDark : styles.statValue}>{stats.winRate}%</Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${winPercentage}%`,
                      backgroundColor: isDark ? "#4CAF50" : "#006400",
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Añadir estadística de empates */}
          <View style={styles.statsRow}>
            <View style={[isDark ? styles.statBoxDark : styles.statBox, styles.wideBox]}>
              <Text style={isDark ? styles.statLabelDark : styles.statLabel}>Empates</Text>
              <Text style={isDark ? styles.statValueDark : styles.statValue}>{stats.draws}</Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${stats.draws > 0 ? 50 : 0}%`,
                      backgroundColor: isDark ? "#FFC107" : "#FFC107",
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[isDark ? styles.statBoxDark : styles.statBox, styles.wideBox]}>
              <Text style={isDark ? styles.statLabelDark : styles.statLabel}>Partidos Jugados</Text>
              <Text style={isDark ? styles.statValueDark : styles.statValue}>{stats.matchesPlayed}</Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: "100%",
                      backgroundColor: isDark ? "#4CAF50" : "#4CAF50",
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[isDark ? styles.statBoxDark : styles.statBox, { flex: 1 }]}>
              <Text style={isDark ? styles.statLabelDark : styles.statLabel}>Puntos Competitivos</Text>
              <Text style={isDark ? styles.statValueDark : styles.statValue}>{stats.competitivePoints}</Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: "80%",
                      backgroundColor: isDark ? "#FFC107" : "#FFC107",
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Match History - Elegant and minimalist design */}
        <View style={styles.historyContainer}>
          <Text style={isDark ? styles.historyTitleDark : styles.historyTitle}>Historial de Partidos</Text>

          {stats.matchHistory.length === 0 ? (
            <View style={isDark ? styles.emptyHistoryContainerDark : styles.emptyHistoryContainer}>
              <Text style={isDark ? styles.emptyHistoryTextDark : styles.emptyHistoryText}>
                No hay partidos registrados
              </Text>
            </View>
          ) : (
            stats.matchHistory.map((match) => (
              <TouchableOpacity
                key={match.id}
                style={[
                  match.isDraw
                    ? isDark
                      ? styles.drawMatchDark
                      : styles.drawMatch
                    : match.isWin
                      ? isDark
                        ? styles.winMatchDark
                        : styles.winMatch
                      : isDark
                        ? styles.lossMatchDark
                        : styles.lossMatch,
                ]}
                onPress={() => handleMatchPress(match.quedadaId)}
              >
                {/* Sport Icon */}
                <View style={isDark ? styles.sportIconWrapperDark : styles.sportIconWrapper}>
                  <Ionicons
                    name={UserService.getSportIcon(match.sport) as any}
                    size={20}
                    color={
                      match.isDraw
                        ? isDark
                          ? "#FFC107"
                          : "#FFC107"
                        : match.isWin
                          ? isDark
                            ? "#4CAF50"
                            : "#006400"
                          : isDark
                            ? "#FF5252"
                            : "#d32f2f"
                    }
                  />
                </View>

                {/* Sport Name */}
                <Text style={isDark ? styles.sportNameDark : styles.sportName}>{match.sport}</Text>

                {/* Match Info Container - Nuevo contenedor para agrupar resultado y fecha */}
                <View style={styles.matchInfoContainer}>
                  {/* Result */}
                  <Text
                    style={[
                      styles.resultText,
                      match.isDraw
                        ? isDark
                          ? styles.drawResultTextDark
                          : styles.drawResultText
                        : match.isWin
                          ? isDark
                            ? styles.winResultTextDark
                            : styles.winResultText
                          : isDark
                            ? styles.lossResultTextDark
                            : styles.lossResultText,
                    ]}
                  >
                    {match.result}
                    {match.isDraw && " (Empate)"}
                  </Text>

                  {/* Date with icon */}
                  <View style={styles.dateContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={isDark ? "#aaa" : "#777"}
                      style={styles.dateIcon}
                      as
                      any
                    />
                    <Text style={isDark ? styles.dateTextDark : styles.dateText}>
                      {match.date.split("-")[0]}/{match.date.split("-")[1]}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorContainerDark: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  errorTextDark: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonDark: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyContainerDark: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  emptyTextDark: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginTop: 16,
  },
  emptyHistoryContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  emptyHistoryContainerDark: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
  },
  emptyHistoryText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#666",
  },
  emptyHistoryTextDark: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#aaa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
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
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  filterIndicatorDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  filterText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  filterTextDark: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#aaa",
    marginLeft: 8,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  statBoxDark: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#1e1e1e",
  },
  middleBox: {
    marginHorizontal: 10,
  },
  wideBox: {
    flex: 1,
    marginRight: 5,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#006400",
    marginBottom: 4,
  },
  statLabelDark: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#4CAF50",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  statValueDark: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#e0e0e0",
    marginBottom: 8,
  },
  progressContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  historyContainer: {
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#333",
    marginBottom: 12,
  },
  historyTitleDark: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#e0e0e0",
    marginBottom: 12,
  },
  matchItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  winMatch: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#e6f4e6", // Tono de verde claro para partidos ganados
  },
  winMatchDark: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#1A2E1A", // Tono de verde oscuro para partidos ganados
  },
  lossMatch: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#ffebee", // Tono de rojo claro para partidos perdidos
  },
  lossMatchDark: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#2E1A1A", // Tono de rojo oscuro para partidos perdidos
  },
  // Nuevos estilos para empates
  drawMatch: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#FFF8E1", // Tono de amarillo claro para empates
  },
  drawMatchDark: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#2D2A1B", // Tono de amarillo oscuro para empates
  },
  sportIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sportIconWrapperDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sportName: {
    fontSize: 15,
    fontFamily: "Inter-Medium",
    color: "#333",
    flex: 1,
  },
  sportNameDark: {
    fontSize: 15,
    fontFamily: "Inter-Medium",
    color: "#e0e0e0",
    flex: 1,
  },
  // Nuevo contenedor para agrupar resultado y fecha
  matchInfoContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 80, // Ancho mínimo para evitar solapamientos
  },
  resultText: {
    fontSize: 15,
    fontFamily: "Inter-SemiBold",
    marginBottom: 4, // Espacio entre el resultado y la fecha
  },
  winResultText: {
    color: "#006400", // Verde oscuro para resultados ganados
  },
  winResultTextDark: {
    color: "#4CAF50", // Verde claro para resultados ganados en modo oscuro
  },
  lossResultText: {
    color: "#d32f2f", // Rojo para resultados perdidos
  },
  lossResultTextDark: {
    color: "#FF5252", // Rojo claro para resultados perdidos en modo oscuro
  },
  // Nuevos estilos para resultados de empate
  drawResultText: {
    color: "#F57F17", // Naranja para empates
  },
  drawResultTextDark: {
    color: "#FFC107", // Amarillo para empates en modo oscuro
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#777",
  },
  dateTextDark: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#aaa",
  },
})

export default Stats
