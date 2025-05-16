import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Deporte } from "../services/ManageMeetings/SearchMeetingsService"

interface SportsListProps {
  sports: Deporte[]
  selectedSport: Deporte | null
  onSelectSport: (sport: Deporte | null) => void
  getSportIcon: (sportName: string) => string
  theme?: "light" | "dark"
}

const SportsList: React.FC<SportsListProps> = ({ 
  sports, 
  selectedSport, 
  onSelectSport, 
  getSportIcon,
  theme = "light"
}) => {
  const [showAllSports, setShowAllSports] = useState(false)
  const isDark = theme === "dark"
  
  // Limitar la lista de deportes a mostrar a un máximo de 7
  const MAX_VISIBLE_SPORTS = 7
  const hasMoreSports = sports.length > MAX_VISIBLE_SPORTS
  
  // Determinar qué deportes mostrar basado en el estado
  const visibleSports = showAllSports ? sports : sports.slice(0, MAX_VISIBLE_SPORTS)

  // Función para alternar entre mostrar todos los deportes o solo los limitados
  const toggleSportsView = () => {
    setShowAllSports(!showAllSports)
  }

  return (
    <View style={styles.filterSection}>
      <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitle}>Deporte</Text>
      <View style={styles.sportsList}>
        {visibleSports.map((sport) => (
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
        
        {/* Botón "+" para expandir/contraer la lista de deportes */}
        {hasMoreSports && (
          <TouchableOpacity
            style={isDark ? styles.viewMoreButtonDark : styles.viewMoreButton}
            onPress={toggleSportsView}
          >
            <Ionicons
              name={showAllSports ? "remove" : "add"}
              size={16}
              color={isDark ? "#4CAF50" : "#006400"}
              style={styles.sportIcon}
            />
            <Text style={isDark ? styles.viewMoreTextDark : styles.viewMoreText}>
              {showAllSports ? "Ver menos" : "Ver más"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  filterSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  // Estilo común para todos los títulos de sección (Filters y Sport)
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#006400",
    marginBottom: 8,
  },
  sectionTitleDark: {
    fontSize: 16,
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
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF1F5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#006400",
  },
  viewMoreButtonDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  viewMoreText: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#006400",
  },
  viewMoreTextDark: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#4CAF50",
  },
})

export default SportsList