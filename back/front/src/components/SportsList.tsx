import type React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Deporte } from "../services/ManageMeetings/SearchMeetingsService"

interface SportsListProps {
  sports: Deporte[]
  selectedSport: Deporte | null
  onSelectSport: (sport: Deporte | null) => void
  getSportIcon: (sportName: string) => string
  theme?: "light" | "dark" // Añadir prop para el tema
}

const SportsList: React.FC<SportsListProps> = ({ 
  sports, 
  selectedSport, 
  onSelectSport, 
  getSportIcon,
  theme = "light" // Valor por defecto
}) => {
  const isDark = theme === "dark"

  return (
    <View style={styles.filterSection}>
      <Text style={isDark ? styles.filterSectionTitleDark : styles.filterSectionTitle}>Sport</Text>
      <View style={styles.sportsList}>
        {sports.map((sport) => (
          <TouchableOpacity
            key={sport.id.toString()}
            style={[
              isDark ? styles.sportItemDark : styles.sportItem, 
              selectedSport?.id === sport.id && (isDark ? styles.sportItemSelectedDark : styles.sportItemSelected)
            ]}
            onPress={() => onSelectSport(selectedSport?.id === sport.id ? null : sport)}
          >
            <Ionicons
              name={getSportIcon(sport.nombre || "") as any}
              size={16}
              color={selectedSport?.id === sport.id 
                ? "#FFFFFF" 
                : isDark ? "#4CAF50" : "#006400"}
              style={styles.sportIcon}
            />
            <Text 
              style={[
                isDark ? styles.sportItemTextDark : styles.sportItemText, 
                selectedSport?.id === sport.id && styles.sportItemTextSelected
              ]}
            >
              {sport.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  filterSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#006400",
    marginBottom: 8,
  },
  filterSectionTitleDark: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#4CAF50",
    marginBottom: 8,
  },
  sportsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sportItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF1F5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EFF1F5",
  },
  sportItemDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  sportItemSelected: {
    backgroundColor: "#006400",
    borderColor: "#006400",
  },
  sportItemSelectedDark: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  sportIcon: {
    marginRight: 4,
  },
  sportItemText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  sportItemTextDark: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#E0E0E0",
  },
  sportItemTextSelected: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
  },
})

export default SportsList