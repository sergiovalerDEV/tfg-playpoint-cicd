"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, ScrollView, Platform } from "react-native"

interface ClockProps {
  visible: boolean
  onClose: () => void
  onSelectTime: (hour: number, minute: number, period: "AM" | "PM") => void
  initialHour: number | null
  initialMinute: number | null
  title?: string
  theme?: "light" | "dark"
}

const Clock: React.FC<ClockProps> = ({
  visible,
  onClose,
  onSelectTime,
  initialHour,
  initialMinute,
  title = "Seleccionar hora",
  theme = "light",
}) => {
  const isDark = theme === "dark"
  const primaryColor = isDark ? "#4CAF50" : "#006400"
  const backgroundColor = isDark ? "#121212" : "#FFFFFF"
  const textColor = isDark ? "#FFFFFF" : "#000000"
  const borderColor = isDark ? "#333333" : "#E5E5EA"
  const selectedBgColor = isDark ? "#1E1E1E" : "#F2F2F7"

  // Get current time
  const now = new Date()

  // Initialize state with provided values or defaults
  const [hour, setHour] = useState<number>(() => {
    if (initialHour !== null && initialHour !== undefined) {
      return initialHour
    }
    return now.getHours()
  })

  const [minute, setMinute] = useState<number>(() => {
    if (initialMinute !== null && initialMinute !== undefined) {
      return initialMinute
    }
    return Math.floor(now.getMinutes() / 5) * 5
  })

  const [activeSelector, setActiveSelector] = useState<"hour" | "minute">("hour")

  // Refs for ScrollViews
  const hourScrollViewRef = useRef<ScrollView>(null)
  const minuteScrollViewRef = useRef<ScrollView>(null)

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Generate minutes (0-55, step 5)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5)

  // Item height for scrolling calculations
  const ITEM_HEIGHT = 50

  // Scroll to selected values when component mounts or values change
  useEffect(() => {
    if (hourScrollViewRef.current && activeSelector === "hour") {
      hourScrollViewRef.current.scrollTo({
        y: hour * ITEM_HEIGHT,
        animated: true,
      })
    }
  }, [hour, activeSelector])

  useEffect(() => {
    if (minuteScrollViewRef.current && activeSelector === "minute") {
      minuteScrollViewRef.current.scrollTo({
        y: (minute / 5) * ITEM_HEIGHT,
        animated: true,
      })
    }
  }, [minute, activeSelector])

  // Handle time selection
  const handleConfirm = () => {
    // Asegurarse de que los valores son números válidos antes de pasarlos
    const validHour = typeof hour === "number" ? hour : 0
    const validMinute = typeof minute === "number" ? minute : 0

    // Pasar también el valor de AM/PM
    onSelectTime(validHour, validMinute, validHour >= 12 ? "PM" : "AM")
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <SafeAreaView style={styles.safeArea}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: backgroundColor,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                borderColor: borderColor,
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: borderColor,
                },
              ]}
            >
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Text style={[styles.cancelText, { color: primaryColor }]}>Cancelar</Text>
              </TouchableOpacity>

              <Text style={[styles.title, { color: primaryColor }]}>{title}</Text>

              <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
                <Text style={[styles.confirmText, { color: primaryColor }]}>Aceptar</Text>
              </TouchableOpacity>
            </View>

            {/* Time Display */}
            <View style={styles.timeDisplay}>
              <TouchableOpacity
                style={[
                  styles.timeSegment,
                  activeSelector === "hour" && [styles.activeSegment, { backgroundColor: selectedBgColor }],
                ]}
                onPress={() => setActiveSelector("hour")}
              >
                <Text
                  style={[styles.timeText, { color: textColor }, activeSelector === "hour" && { color: primaryColor }]}
                >
                  {hour.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.separator, { color: textColor }]}>:</Text>

              <TouchableOpacity
                style={[
                  styles.timeSegment,
                  activeSelector === "minute" && [styles.activeSegment, { backgroundColor: selectedBgColor }],
                ]}
                onPress={() => setActiveSelector("minute")}
              >
                <Text
                  style={[
                    styles.timeText,
                    { color: textColor },
                    activeSelector === "minute" && { color: primaryColor },
                  ]}
                >
                  {minute.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector */}
            <View style={styles.selectorContainer}>
              {activeSelector === "hour" ? (
                <ScrollView
                  ref={hourScrollViewRef}
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollViewContent}
                  showsVerticalScrollIndicator={false}
                >
                  {hours.map((h) => (
                    <TouchableOpacity
                      key={`hour-${h}`}
                      style={[
                        styles.pickerItem,
                        h === hour && [styles.selectedItem, { backgroundColor: selectedBgColor }],
                      ]}
                      onPress={() => {
                        setHour(h)
                        setActiveSelector("minute")
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          { color: textColor },
                          h === hour && { color: primaryColor, fontWeight: "600" },
                        ]}
                      >
                        {h.toString().padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <ScrollView
                  ref={minuteScrollViewRef}
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollViewContent}
                  showsVerticalScrollIndicator={false}
                >
                  {minutes.map((m) => (
                    <TouchableOpacity
                      key={`minute-${m}`}
                      style={[
                        styles.pickerItem,
                        m === minute && [styles.selectedItem, { backgroundColor: selectedBgColor }],
                      ]}
                      onPress={() => setMinute(m)}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          { color: textColor },
                          m === minute && { color: primaryColor, fontWeight: "600" },
                        ]}
                      >
                        {m.toString().padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Quick Time Presets */}
            <View style={[styles.quickPresets, { borderTopColor: borderColor }]}>
              <Text style={[styles.quickPresetsTitle, { color: isDark ? "#AAAAAA" : "#666666" }]}>Horas comunes</Text>
              <View style={styles.quickPresetsRow}>
                {[8, 12, 15, 18, 20].map((h) => (
                  <TouchableOpacity
                    key={`preset-${h}`}
                    style={[
                      styles.quickPresetButton,
                      {
                        backgroundColor: hour === h && minute === 0 ? primaryColor : selectedBgColor,
                        borderColor: primaryColor,
                      },
                    ]}
                    onPress={() => {
                      setHour(h)
                      setMinute(0)
                    }}
                  >
                    <Text
                      style={[
                        styles.quickPresetText,
                        {
                          color: hour === h && minute === 0 ? "#FFFFFF" : primaryColor,
                        },
                      ]}
                    >
                      {h}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  safeArea: {
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
    height: 36,
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "left",
  },
  confirmText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    textAlign: "right",
  },
  timeDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  timeSegment: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeSegment: {
    borderRadius: 8,
  },
  timeText: {
    fontSize: 42,
    fontFamily: "Inter-Medium",
  },
  separator: {
    fontSize: 42,
    fontFamily: "Inter-Medium",
    marginHorizontal: 4,
  },
  selectorContainer: {
    height: 250,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingVertical: 100, // Add padding to allow scrolling past the ends
  },
  pickerItem: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    borderRadius: 8,
  },
  selectedItem: {
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 22,
    fontFamily: "Inter-Regular",
  },
  quickPresets: {
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  quickPresetsTitle: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginBottom: 12,
  },
  quickPresetsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quickPresetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: "center",
  },
  quickPresetText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
})

export default Clock