"use client"

import type React from "react"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Sport } from "../services/ManageMeetings/CreateMeetingService"

interface FullSportsListProps {
  visible: boolean
  onClose: () => void
  sports: Sport[]
  selectedSport: Sport | null
  onSelectSport: (sport: Sport) => void
  getSportIcon: (sportName: string) => string
  theme: string
}

const FullSportsList: React.FC<FullSportsListProps> = ({
  visible,
  onClose,
  sports,
  selectedSport,
  onSelectSport,
  getSportIcon,
  theme,
}) => {
  const isDark = theme === "dark"
  const [searchQuery, setSearchQuery] = useState("")

  // Filtrar deportes según la búsqueda
  const filteredSports = sports.filter((sport) => sport.nombre.toLowerCase().includes(searchQuery.toLowerCase()))

  // Manejar la selección de un deporte
  const handleSelectSport = (sport: Sport) => {
    onSelectSport(sport)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

        {/* Header */}
        <View style={isDark ? styles.headerDark : styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? "#4CAF50" : "#006400"} as any />
          </TouchableOpacity>
          <Text style={isDark ? styles.titleDark : styles.title}>Seleccionar Deporte</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Search Bar */}
        <View style={isDark ? styles.searchContainerDark : styles.searchContainer}>
          <Ionicons name="search" size={20} color={isDark ? "#8A8A8A" : "#BDBBC7"} style={styles.searchIcon} as any />
          <TextInput
            style={isDark ? styles.searchInputDark : styles.searchInput}
            placeholder="Buscar deportes"
            placeholderTextColor={isDark ? "#8A8A8A" : "#BDBBC7"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.trim() !== "" && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
            </TouchableOpacity>
          )}
        </View>

        {/* Sports List */}
        <FlatList
          data={filteredSports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                isDark ? styles.sportItemDark : styles.sportItem,
                selectedSport?.id === item.id && (isDark ? styles.selectedItemDark : styles.selectedItem),
              ]}
              onPress={() => handleSelectSport(item)}
            >
              <View style={isDark ? styles.sportIconContainerDark : styles.sportIconContainer}>
                <Ionicons name={getSportIcon(item.nombre) as any} size={24} color={isDark ? "#4CAF50" : "#006400"} />
              </View>
              <Text style={isDark ? styles.sportNameDark : styles.sportName}>{item.nombre}</Text>
              {selectedSport?.id === item.id && (
                <Ionicons name="checkmark-circle" size={20} color={isDark ? "#4CAF50" : "#006400"} as any />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={isDark ? styles.emptyTextDark : styles.emptyText}>
                No se encontraron deportes que coincidan con la búsqueda
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  titleDark: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
  },
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchContainerDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#333",
  },
  searchInputDark: {
    flex: 1,
    height: "100%",
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#E0E0E0",
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sportItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F5F9F5",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  sportItemDark: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  selectedItem: {
    borderColor: "#006400",
    borderWidth: 2,
  },
  selectedItemDark: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  sportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sportIconContainerDark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sportName: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#333",
  },
  sportNameDark: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#E0E0E0",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#777",
    textAlign: "center",
  },
  emptyTextDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#999",
    textAlign: "center",
  },
})

export default FullSportsList
