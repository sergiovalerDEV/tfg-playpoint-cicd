"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  FlatList,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"

interface CalendarProps {
  visible: boolean
  onClose: () => void
  onSelectDate: (day: number, month: number, year: number) => void
  initialDay: number | null
  initialMonth: number | null
  initialYear: number | null
  theme?: "light" | "dark"
}

// Month names and day names moved outside component to prevent recreation on each render
const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

// Helper functions moved outside component
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay()
}

// Mover la generación de días del calendario fuera del componente
const generateCalendarDays = (year: number, month: number) => {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)

  const prevMonthDays = []
  if (firstDayOfMonth > 0) {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevMonthYear = month === 0 ? year - 1 : year
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth)

    for (let i = 0; i < firstDayOfMonth; i++) {
      prevMonthDays.push({
        day: daysInPrevMonth - firstDayOfMonth + i + 1,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
      })
    }
  }

  const currentMonthDays = []
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    })
  }

  const nextMonthDays = []
  const totalDaysShown = prevMonthDays.length + currentMonthDays.length
  const remainingCells = 42 - totalDaysShown

  if (remainingCells > 0) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextMonthYear = month === 11 ? year + 1 : year

    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
      })
    }
  }

  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
}

// Memoizar la generación de meses
const generateMonths = (currentRealYear: number, today: Date) => {
  const monthsArray = []
  const startYear = currentRealYear
  const endYear = currentRealYear + 2

  for (let year = startYear; year <= endYear; year++) {
    const startMonth = year === startYear ? today.getMonth() : 0
    const endMonth = year === endYear ? 11 : 11

    for (let month = startMonth; month <= endMonth; month++) {
      monthsArray.push({ year, month })
    }
  }

  return monthsArray
}

const Calendar: React.FC<CalendarProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDay,
  initialMonth,
  initialYear,
  theme = "light",
}) => {
  const isDark = theme === "dark"

  // Memoizar valores que no cambian frecuentemente
  const today = useMemo(() => new Date(), [])
  const currentRealYear = useMemo(() => today.getFullYear(), [today])
  const { width: screenWidth, height: screenHeight } = useMemo(() => Dimensions.get("window"), [])

  // Estados optimizados
  const [selectedDay, setSelectedDay] = useState<number>(initialDay || today.getDate())
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth !== null ? initialMonth : today.getMonth())
  const [currentYear, setCurrentYear] = useState<number>(initialYear || currentRealYear)

  // Ref para el scroll
  const monthScrollRef = useRef<FlatList>(null)

  // Memoizar los meses
  const months = useMemo(() => generateMonths(currentRealYear, today), [currentRealYear, today])

  // Memoizar la función de navegación
  const navigateToMonth = useCallback((index: number) => {
    if (monthScrollRef.current) {
      monthScrollRef.current.scrollToIndex({
        index,
        animated: true
      })
    }
  }, [])

  // Memorizar la fecha formateada
  const formattedSelectedDate = useMemo(() => {
    return `${selectedDay} de ${monthNames[currentMonth]} de ${currentYear}`
  }, [selectedDay, currentMonth, currentYear])

  // Manejar el scroll
  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      if (months[newIndex]) {
        const { year, month } = months[newIndex]
        setCurrentMonth(month)
        setCurrentYear(year)
      }
    },
    [months, screenWidth],
  )

  // Manejar el fallo del scroll
  const scrollToIndexFailed = useCallback(() => {
    const wait = new Promise((resolve) => setTimeout(resolve, 500))
    wait.then(() => {
      if (monthScrollRef.current) {
        const index = months.findIndex((item) => item.month === currentMonth && item.year === currentYear)
        if (index !== -1) {
          monthScrollRef.current.scrollToIndex({ index, animated: false })
        }
      }
    })
  }, [currentMonth, currentYear, months])

  // Optimizar la navegación entre meses
  const goToPreviousMonth = useCallback(() => {
    if (currentMonth === 0) {
      if (currentYear > currentRealYear) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
        const prevIndex = months.findIndex((item) => item.month === 11 && item.year === currentYear - 1)
        if (prevIndex !== -1) navigateToMonth(prevIndex)
      }
    } else {
      setCurrentMonth(currentMonth - 1)
      const prevIndex = months.findIndex((item) => item.month === currentMonth - 1 && item.year === currentYear)
      if (prevIndex !== -1) navigateToMonth(prevIndex)
    }
  }, [currentMonth, currentYear, currentRealYear, months, navigateToMonth])

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      if (currentYear < currentRealYear + 10) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
        const nextIndex = months.findIndex((item) => item.month === 0 && item.year === currentYear + 1)
        if (nextIndex !== -1) navigateToMonth(nextIndex)
      }
    } else {
      setCurrentMonth(currentMonth + 1)
      const nextIndex = months.findIndex((item) => item.month === currentMonth + 1 && item.year === currentYear)
      if (nextIndex !== -1) navigateToMonth(nextIndex)
    }
  }, [currentMonth, currentYear, currentRealYear, months, navigateToMonth])

  // Memoizar la función de selección de día
  const handleDaySelect = useCallback(
    (day: number, month: number, year: number) => {
      if (year >= currentRealYear && year <= currentRealYear + 10) {
        setSelectedDay(day)
        if (month !== currentMonth || year !== currentYear) {
          setCurrentMonth(month)
          setCurrentYear(year)
        }
      }
    },
    [currentMonth, currentYear, currentRealYear],
  )

  // Memoizar la función de confirmación
  const handleConfirm = useCallback(() => {
    onSelectDate(selectedDay, currentMonth, currentYear)
    onClose()
  }, [selectedDay, currentMonth, currentYear, onSelectDate, onClose])

  // Memoizar funciones de utilidad
  const isToday = useCallback(
    (day: number, month: number, year: number) => {
      return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
    },
    [today],
  )

  const isSelected = useCallback(
    (day: number, month: number, year: number) => {
      return day === selectedDay && month === currentMonth && year === currentYear
    },
    [selectedDay, currentMonth, currentYear],
  )

  const isSelectable = useCallback(
    (year: number) => {
      return year >= currentRealYear && year <= currentRealYear + 10
    },
    [currentRealYear],
  )

  // Memoizar el índice inicial para el FlatList
  const initialScrollIndex = useMemo(() => {
    return months.findIndex((item) => item.month === currentMonth && item.year === currentYear) || 0
  }, [months, currentMonth, currentYear])

  // Memoizar el layout de los items
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth],
  )

  // Memoizar el key extractor
  const keyExtractor = useCallback((item: { year: number; month: number }) => `${item.year}-${item.month}`, [])

  // Memoizar el renderizado de cada mes
  const renderMonth = useCallback(
    ({ item }: { item: { year: number; month: number } }) => {
      const { year, month } = item
      const days = generateCalendarDays(year, month)

      return (
        <View style={{ width: screenWidth }}>
          <View style={isDark ? styles.calendarHeaderDark : styles.calendarHeader}>
            <Text style={isDark ? styles.monthYearTextDark : styles.monthYearText}>
              {monthNames[month]} {year}
            </Text>
          </View>

          <View style={isDark ? styles.dayNamesContainerDark : styles.dayNamesContainer}>
            {dayNames.map((name, index) => (
              <Text key={index} style={isDark ? styles.dayNameDark : styles.dayName}>
                {name}
              </Text>
            ))}
          </View>

          <View style={isDark ? styles.calendarGridDark : styles.calendarGrid}>
            {days.map((item, index) => {
              const isDateSelectable = isSelectable(item.year)
              const isTodayDate = isToday(item.day, item.month, item.year)
              const isSelectedDate = isSelected(item.day, item.month, item.year)

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    isDark ? styles.dayCellDark : styles.dayCell,
                    !item.isCurrentMonth && (isDark ? styles.otherMonthDayDark : styles.otherMonthDay),
                    !isDateSelectable && (isDark ? styles.disabledDayDark : styles.disabledDay),
                    isSelectedDate && (isDark ? styles.selectedDayDark : styles.selectedDay),
                    isTodayDate && (isDark ? styles.todayDark : styles.today),
                  ]}
                  onPress={() => handleDaySelect(item.day, item.month, item.year)}
                  disabled={!isDateSelectable}
                >
                  <Text
                    style={[
                      isDark ? styles.dayTextDark : styles.dayText,
                      !item.isCurrentMonth && (isDark ? styles.otherMonthDayTextDark : styles.otherMonthDayText),
                      !isDateSelectable && (isDark ? styles.disabledDayTextDark : styles.disabledDayText),
                      isSelectedDate && styles.selectedDayText,
                      isTodayDate && (isDark ? styles.todayTextDark : styles.todayText),
                    ]}
                  >
                    {item.day}
                  </Text>
                  {isTodayDate && <View style={isDark ? styles.todayDotDark : styles.todayDot} />}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )
    },
    [handleDaySelect, isDark, isSelectable, isSelected, isToday, screenWidth],
  )

  // Only render the modal content when visible to improve performance
  if (!visible) return null

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={10} tint={isDark ? "dark" : "light"} style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoidingView}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={[isDark ? styles.modalContentDark : styles.modalContent, { maxHeight: screenHeight * 0.9 }]}>
              <View style={isDark ? styles.modalHeaderDark : styles.modalHeader}>
                <Text style={isDark ? styles.modalTitleDark : styles.modalTitle}>Seleccionar Fecha</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={isDark ? "#E0E0E0" : "#333"} />
                </TouchableOpacity>
              </View>

              {/* Month Navigation */}
              <View style={styles.navigationContainer}>
                <TouchableOpacity
                  onPress={goToPreviousMonth}
                  style={[
                    isDark ? styles.navigationButtonDark : styles.navigationButton,
                    currentMonth === 0 &&
                      currentYear === currentRealYear &&
                      (isDark ? styles.disabledButtonDark : styles.disabledButton),
                  ]}
                  disabled={currentMonth === 0 && currentYear === currentRealYear}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={
                      currentMonth === 0 && currentYear === currentRealYear
                        ? isDark
                          ? "#555"
                          : "#ccc"
                        : isDark
                          ? "#4CAF50"
                          : "#006400"
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={goToNextMonth}
                  style={[
                    isDark ? styles.navigationButtonDark : styles.navigationButton,
                    currentMonth === 11 &&
                      currentYear === currentRealYear + 10 &&
                      (isDark ? styles.disabledButtonDark : styles.disabledButton),
                  ]}
                  disabled={currentMonth === 11 && currentYear === currentRealYear + 10}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={
                      currentMonth === 11 && currentYear === currentRealYear + 10
                        ? isDark
                          ? "#555"
                          : "#ccc"
                        : isDark
                          ? "#4CAF50"
                          : "#006400"
                    }
                  />
                </TouchableOpacity>
              </View>

              {/* Horizontal Month Scroll */}
              <FlatList
                ref={monthScrollRef}
                data={months}
                renderItem={renderMonth}
                keyExtractor={keyExtractor}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={initialScrollIndex}
                getItemLayout={getItemLayout}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                onScrollToIndexFailed={scrollToIndexFailed}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={5}
              />

              {/* Selected Date Display */}
              <View style={styles.selectedDateContainer}>
                <View style={isDark ? styles.selectedDateCardDark : styles.selectedDateCard}>
                  <Text style={isDark ? styles.selectedDateLabelDark : styles.selectedDateLabel}>
                    Fecha seleccionada:
                  </Text>
                  <Text style={isDark ? styles.selectedDateTextDark : styles.selectedDateText}>
                    {formattedSelectedDate}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={isDark ? "#4CAF50" : "#006400"}
                    style={styles.selectedDateIcon}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={isDark ? styles.cancelButtonDark : styles.cancelButton} onPress={onClose}>
                  <Text style={isDark ? styles.cancelButtonTextDark : styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={isDark ? styles.confirmButtonDark : styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.confirmIcon} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  safeArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === "ios" ? 8 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalContentDark: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === "ios" ? 8 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF1F5",
  },
  modalHeaderDark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  modalTitleDark: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
  },
  closeButton: {
    padding: 4,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navigationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#EFF1F5",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationButtonDark: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: "#F0F0F0",
  },
  disabledButtonDark: {
    opacity: 0.5,
    backgroundColor: "#222222",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#F9F9F9",
  },
  calendarHeaderDark: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#1A1A1A",
  },
  monthYearText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
  },
  monthYearTextDark: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
  },
  dayNamesContainer: {
    flexDirection: "row",
    paddingVertical: 8,
    backgroundColor: "#F9F9F9",
    borderBottomWidth: 1,
    borderBottomColor: "#EFF1F5",
  },
  dayNamesContainerDark: {
    flexDirection: "row",
    paddingVertical: 8,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dayName: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "#777",
  },
  dayNameDark: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter-Medium",
    color: "#AAA",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    backgroundColor: "#FFFFFF",
  },
  calendarGridDark: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    backgroundColor: "#121212",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    position: "relative",
  },
  dayCellDark: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    position: "relative",
  },
  dayText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#333",
  },
  dayTextDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#E0E0E0",
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  otherMonthDayDark: {
    opacity: 0.5,
  },
  otherMonthDayText: {
    color: "#999",
  },
  otherMonthDayTextDark: {
    color: "#777",
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayDark: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: "#ccc",
  },
  disabledDayTextDark: {
    color: "#555",
  },
  selectedDay: {
    backgroundColor: "#006400",
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  selectedDayDark: {
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1.5,
  },
  selectedDayText: {
    color: "#fff",
    fontFamily: "Inter-Medium",
  },
  today: {
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
  },
  todayDark: {
    backgroundColor: "#1E3320",
    borderRadius: 20,
  },
  todayText: {
    color: "#006400",
    fontFamily: "Inter-Medium",
  },
  todayTextDark: {
    color: "#4CAF50",
    fontFamily: "Inter-Medium",
  },
  todayDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#006400",
  },
  todayDotDark: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4CAF50",
  },
  selectedDateContainer: {
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 16,
  },
  selectedDateCard: {
    backgroundColor: "#F0F8F0",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D0E8D0",
  },
  selectedDateCardDark: {
    backgroundColor: "#1E3320",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2E4A2E",
  },
  selectedDateLabel: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#555",
  },
  selectedDateLabelDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#AAA",
  },
  selectedDateText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    flex: 1,
    marginLeft: 8,
  },
  selectedDateTextDark: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    flex: 1,
    marginLeft: 8,
  },
  selectedDateIcon: {
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginHorizontal: 16,
    marginBottom: 4,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#006400",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonDark: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2E7D32",
    backgroundColor: "#121212",
  },
  cancelButtonText: {
    color: "#006400",
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  cancelButtonTextDark: {
    color: "#4CAF50",
    fontSize: 16,
    fontFamily: "Inter-Medium",
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#006400",
  },
  confirmButtonDark: {
    flex: 2,
    flexDirection: "row",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#2E7D32",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginRight: 8,
  },
  confirmIcon: {
    marginLeft: 4,
  },
})

export default Calendar
