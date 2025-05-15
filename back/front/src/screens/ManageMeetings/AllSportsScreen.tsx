"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { StackScreenProps } from "@react-navigation/stack"
import type { RootParamList } from "../../navigation/RootParamList"
import type { Sport } from "../../services/ManageMeetings/CreateMeetingService"
import SearchMeetingsService from "../../services/ManageMeetings/SearchMeetingsService"

type Props = StackScreenProps<RootParamList, "AllSports">

const AllSportsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sports, selectedSportId, theme } = route.params
  const isDark = theme === "dark"
  
  // Estado para la búsqueda
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredSports, setFilteredSports] = useState<Sport[]>(sports)
  
  // Filtrar deportes cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSports(sports)
    } else {
      const query = searchQuery.toLowerCase().trim()
      const filtered = sports.filter(sport => 
        sport.nombre.toLowerCase().includes(query)
      )
      setFilteredSports(filtered)
    }
  }, [searchQuery, sports])
  
  // Manejar la selección de un deporte
  const handleSelectSport = (sport: Sport) => {
    navigation.navigate("CreateMeeting", { selectedSport: sport })
  }
  
  // Renderizar cada elemento de deporte
  const renderSportItem = ({ item }: { item: Sport }) => {
    const isSelected = item.id === selectedSportId
    const sportIcon = SearchMeetingsService.getSportIcon(item.nombre)
    
    return (
      <TouchableOpacity
        style={[
          styles.sportItem,
          isSelected && styles.selectedSportItem
        ]}
        onPress={() => handleSelectSport(item)}
      >
        <Ionicons 
          name={sportIcon} 
          size={24} 
          color={isSelected ? "#FFFFFF" : "#006400"} 
        />
        <Text 
          style={[
            styles.sportItemText,
            isSelected && styles.selectedSportItemText
          ]}
        >
          {item.nombre}
        </Text>
      </TouchableOpacity>
    )
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#006400" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Todos los deportes</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#BDBBC7" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar deporte"
          placeholderTextColor="#BDBBC7"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.trim() !== "" && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={16} color="#BDBBC7" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Lista de deportes */}
      <FlatList
        data={filteredSports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSportItem}
        contentContainerStyle={styles.sportsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron deportes</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
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
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginHorizontal: 16,
    marginVertical: 16,
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
  clearButton: {
    padding: 4,
  },
  sportsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sportItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
  },
  selectedSportItem: {
    backgroundColor: "#006400",
  },
  sportItemText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#333333",
    marginLeft: 12,
  },
  selectedSportItemText: {
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#777",
  },
})

export default AllSportsScreen