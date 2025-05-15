"use client"

import type React from "react"
import { useRef } from "react"
import { View, Text, TouchableOpacity, FlatList, StyleSheet, type GestureResponderEvent } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Establishment } from "../services/ManageMeetings/CreateMeetingService"

interface EstablishmentsListProps {
  establishments: Establishment[]
  selectedEstablishment: Establishment | null
  onSelectEstablishment: (establishment: Establishment) => void
  onClose: () => void
  theme?: "light" | "dark"
}

const EstablishmentsList: React.FC<EstablishmentsListProps> = ({
  establishments,
  selectedEstablishment,
  onSelectEstablishment,
  onClose,
  theme = "light",
}) => {
  const isDark = theme === "dark"
  const listRef = useRef<FlatList>(null)
  const isTouchingList = useRef(false)

  // Handle selection and close dropdown
  const handleSelect = (item: Establishment) => {
    onSelectEstablishment(item)
    onClose()
  }

  // Prevent touch events from propagating to parent when touching the list
  const handleTouchStart = (e: GestureResponderEvent) => {
    isTouchingList.current = true
    // Stop propagation
    e.stopPropagation()
  }

  const handleTouchEnd = (e: GestureResponderEvent) => {
    isTouchingList.current = false
    // Stop propagation
    e.stopPropagation()
  }

  return (
    <View
      style={isDark ? styles.dropdownListDark : styles.dropdownList}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <FlatList
        ref={listRef}
        data={establishments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={isDark ? styles.dropdownItemDark : styles.dropdownItem}
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownItemContent}>
              <Text
                style={[
                  isDark ? styles.dropdownItemTextDark : styles.dropdownItemText,
                  selectedEstablishment?.id === item.id &&
                    (isDark ? styles.dropdownItemTextSelectedDark : styles.dropdownItemTextSelected),
                ]}
                numberOfLines={1}
              >
                {item.nombre}
              </Text>
            </View>
            {selectedEstablishment?.id === item.id && (
              <Ionicons name="checkmark" size={20} color={isDark ? "#4CAF50" : "#006400"} />
            )}
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        scrollEnabled={true}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        scrollEventThrottle={16}
        onMomentumScrollBegin={(e) => {
          // Prevent parent scroll while this list is being scrolled
          e.stopPropagation()
        }}
        onScrollBeginDrag={(e) => {
          // Prevent parent scroll while this list is being scrolled
          e.stopPropagation()
        }}
        onScrollEndDrag={(e) => {
          // Prevent parent scroll when reaching the end of the list
          e.stopPropagation()
        }}
        onMomentumScrollEnd={(e) => {
          // Prevent parent scroll when momentum scrolling ends
          e.stopPropagation()
        }}
        // This is crucial - it prevents the parent from intercepting touches
        // when the list is at the top or bottom
        overScrollMode="never"
        bounces={false}
        // Prevent scroll chaining
        disableScrollViewPanResponder={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  dropdownList: {
    height: 200,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EFF1F5",
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownListDark: {
    height: 200,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 1000,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF1F5",
  },
  dropdownItemDark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  dropdownItemTextDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#E0E0E0",
  },
  dropdownItemTextSelected: {
    color: "#006400",
    fontFamily: "Inter-Medium",
  },
  dropdownItemTextSelectedDark: {
    color: "#4CAF50",
    fontFamily: "Inter-Medium",
  },
})

export default EstablishmentsList
