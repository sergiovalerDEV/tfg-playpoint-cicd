import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface CompetitiveRangeFilterProps {
  isEnabled: boolean
  onToggle: () => void
  userCompetitivePoints: number | null
  isDark: boolean
}

const CompetitiveRangeFilter: React.FC<CompetitiveRangeFilterProps> = ({
  isEnabled,
  onToggle,
  userCompetitivePoints,
  isDark,
}) => {
  return (
    <View style={isDark ? styles.containerDark : styles.container}>
      <View style={styles.infoContainer}>
        <Ionicons name="trophy" size={20} color={isDark ? "#4CAF50" : "#006400"} style={styles.icon} as any />
        <View style={styles.textContainer}>
          <Text style={isDark ? styles.titleDark : styles.title}>Filtrar por nivel similar</Text>
          <Text style={isDark ? styles.subtitleDark : styles.subtitle}>
            {userCompetitivePoints !== null
              ? `Basado en tu puntuación: ${userCompetitivePoints} pts`
              : "Cargando tu puntuación..."}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          isEnabled ? (isDark ? styles.toggleActiveButtonDark : styles.toggleActiveButton) : null,
        ]}
        onPress={onToggle}
      >
        <View style={[styles.toggleIndicator, isEnabled ? styles.toggleIndicatorActive : null]} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  containerDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#333333",
    marginBottom: 2,
  },
  titleDark: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#E0E0E0",
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    color: "#666666",
  },
  subtitleDark: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    color: "#AAAAAA",
  },
  toggleButton: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D9D9D9",
    padding: 2,
    justifyContent: "center",
  },
  toggleActiveButton: {
    backgroundColor: "#006400",
  },
  toggleActiveButtonDark: {
    backgroundColor: "#2E7D32",
  },
  toggleIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "white",
  },
  toggleIndicatorActive: {
    transform: [{ translateX: 18 }],
  },
})

export default CompetitiveRangeFilter