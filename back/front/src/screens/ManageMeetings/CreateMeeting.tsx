"use client"

import type { StackScreenProps } from "@react-navigation/stack"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  ActivityIndicator,
} from "react-native"
import type { RootParamList } from "../../navigation/RootParamList"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import Calendar from "../../components/Calendar"
import Clock from "../../components/Clock"
import CreateMeetingService, {
  type Sport,
  type Establishment,
} from "../../services/ManageMeetings/CreateMeetingService"
import UserService from "../../services/User/UserService"
import EstablishmentsList from "../../components/EstablishmentsList"
import SearchMeetingsService from "../../services/ManageMeetings/SearchMeetingsService"
import { showAlert, AlertProvider } from "../../components/Alert"
import { useTheme } from "../../contexts/ThemeContext"
import MainPageHeader from "../../components/headers/MainPageHeader"
import SportsList from "../../components/SportsList"

type Props = StackScreenProps<RootParamList, "CreateMeeting">

const CreateMeeting: React.FC<Props> = ({ navigation }) => {
  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Ref para controlar si el componente está montado
  const isMounted = useRef(true)

  // Ref para controlar si ya se ha verificado la autenticación
  const authChecked = useRef(false)

  // Estados para los campos del formulario
  const [meetingName, setMeetingName] = useState("")
  const [location, setLocation] = useState("")
  const [isCompetitive, setIsCompetitive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Estados para fecha y hora
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [formattedDate, setFormattedDate] = useState("")
  const [showDateModal, setShowDateModal] = useState(false)

  const [startHour, setStartHour] = useState<number | null>(null)
  const [startMinute, setStartMinute] = useState<number | null>(null)
  const [formattedStartTime, setFormattedStartTime] = useState("")
  const [showStartTimeModal, setShowStartTimeModal] = useState(false)

  const [endHour, setEndHour] = useState<number | null>(null)
  const [endMinute, setEndMinute] = useState<number | null>(null)
  const [formattedEndTime, setFormattedEndTime] = useState("")
  const [showEndTimeModal, setShowEndTimeModal] = useState(false)

  // Estados para establecimientos y deportes
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null)
  const [showEstablishmentDropdown, setShowEstablishmentDropdown] = useState(false)

  // Cargar fuentes
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Función para resetear todos los campos del formulario
  const resetForm = () => {
    setMeetingName("")
    setLocation("")
    setIsCompetitive(false)
    setSelectedDay(null)
    setSelectedMonth(null)
    setSelectedYear(null)
    setFormattedDate("")
    setStartHour(null)
    setStartMinute(null)
    setFormattedStartTime("")
    setEndHour(null)
    setEndMinute(null)
    setFormattedEndTime("")
    setSelectedEstablishment(null)
    setSelectedSport(null)
    setShowEstablishmentDropdown(false)
  }

  // Efecto para limpiar la referencia cuando el componente se desmonta
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Verificar autenticación y cargar datos al montar el componente
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // Si ya verificamos la autenticación, no lo hacemos de nuevo
        if (authChecked.current) {
          return
        }

        setLoadingData(true)

        // Verificar si el usuario está autenticado
        const isLoggedIn = await UserService.isLoggedIn()

        // Marcar que ya verificamos la autenticación
        authChecked.current = true

        if (!isLoggedIn) {
          console.log("Usuario no autenticado, redirigiendo a login")
          if (isMounted.current) {
            navigation.replace("Login")
          }
          return
        }

        console.log("Usuario autenticado, cargando datos")

        // Cargar establecimientos y deportes
        try {
          const establishmentsData = await CreateMeetingService.getEstablishments()
          if (isMounted.current) {
            setEstablishments(establishmentsData)
          }
          console.log(`Cargados ${establishmentsData.length} establecimientos`)
        } catch (establishmentsError) {
          console.error("Error al cargar establecimientos:", establishmentsError)
        }

        try {
          const sportsData = await CreateMeetingService.getSports()
          if (isMounted.current) {
            setSports(sportsData)
          }
          console.log(`Cargados ${sportsData.length} deportes`)
        } catch (sportsError) {
          console.error("Error al cargar deportes:", sportsError)
        }
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        if (isMounted.current) {
          showAlert("No se pudieron cargar los datos necesarios. Por favor, inténtalo de nuevo.", "error")
        }
      } finally {
        if (isMounted.current) {
          setLoadingData(false)
        }
      }
    }

    checkAuthAndLoadData()
  }, [navigation])

  // Inicializar fecha con la fecha actual si no está establecida
  const initializeDate = () => {
    const now = new Date()
    if (!selectedDay) setSelectedDay(now.getDate())
    if (selectedMonth === null) setSelectedMonth(now.getMonth())
    if (!selectedYear) setSelectedYear(now.getFullYear())
  }

  // Inicializar hora si no está establecida
  const initializeTime = (isStartTime: boolean) => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = Math.floor(now.getMinutes() / 5) * 5

    if (isStartTime) {
      if (startHour === null) setStartHour(currentHour)
      if (startMinute === null) setStartMinute(currentMinute)
    } else {
      if (endHour === null) setEndHour(currentHour)
      if (endMinute === null) setEndMinute(currentMinute)
    }
  }

  // Función auxiliar para convertir a formato 24 horas para comparaciones
  const convertTo24Hour = (hour: number, minute: number): number => {
    // Ya estamos en formato 24 horas, solo convertimos a minutos totales
    return hour * 60 + minute
  }

  // Función para verificar si una fecha/hora está en el pasado
  const isDateTimeInPast = (
    selectedDay: number | null,
    selectedMonth: number | null,
    selectedYear: number | null,
    hour: number | null,
    minute: number | null,
  ): boolean => {
    if (!selectedDay || selectedMonth === null || !selectedYear || hour === null || minute === null) {
      return false // Si no hay fecha/hora completa, no podemos validar
    }

    const now = new Date()
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay, hour, minute)

    return selectedDate < now
  }

  // Función para manejar la selección de fecha
  const handleDateSelection = (day: number, month: number, year: number) => {
    // Verificar si la fecha seleccionada es anterior a la fecha actual
    const selectedDate = new Date(year, month, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Resetear la hora para comparar solo fechas

    if (selectedDate < today) {
      showAlert("No puedes seleccionar una fecha pasada.", "warning")
      return
    }

    setSelectedDay(day)
    setSelectedMonth(month)
    setSelectedYear(year)

    // Formatear la fecha para mostrar
    const formattedDate = `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
    setFormattedDate(formattedDate)
  }

  // Función para manejar la selección de hora de inicio
  const handleStartTimeSelection = (hour: number, minute: number) => {
    // Verificar si la fecha y hora seleccionadas son anteriores al momento actual
    if (isDateTimeInPast(selectedDay, selectedMonth, selectedYear, hour, minute)) {
      showAlert("No puedes seleccionar una hora que ya ha pasado.", "warning")
      return
    }

    // Verificar si la hora de inicio seleccionada es posterior o igual a la hora de fin
    if (endHour !== null && endMinute !== null) {
      const startTime24 = convertTo24Hour(hour, minute)
      const endTime24 = convertTo24Hour(endHour, endMinute)

      if (startTime24 > endTime24) {
        showAlert("La hora de inicio no puede ser posterior a la hora de fin.", "warning")
        return
      }

      if (startTime24 === endTime24) {
        showAlert("La hora de inicio no puede ser igual a la hora de fin.", "warning")
        return
      }
    }

    setStartHour(hour)
    setStartMinute(minute)

    // Formatear la hora para mostrar
    const formattedTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    setFormattedStartTime(formattedTime)
  }

  // Función para manejar la selección de hora de fin
  const handleEndTimeSelection = (hour: number, minute: number) => {
    // Verificar si la hora de fin seleccionada es anterior o igual a la hora de inicio
    if (startHour !== null && startMinute !== null) {
      const startTime24 = convertTo24Hour(startHour, startMinute)
      const endTime24 = convertTo24Hour(hour, minute)

      if (endTime24 < startTime24) {
        showAlert("La hora de fin no puede ser anterior a la hora de inicio.", "warning")
        return
      }

      if (endTime24 === startTime24) {
        showAlert("La hora de fin no puede ser igual a la hora de inicio.", "warning")
        return
      }
    }

    setEndHour(hour)
    setEndMinute(minute)

    // Formatear la hora para mostrar
    const formattedTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    setFormattedEndTime(formattedTime)
  }

  // Función para crear la quedada
  const handleCreateMeeting = async () => {
    // Validar campos requeridos
    if (!meetingName.trim()) {
      showAlert("Por favor introduce un nombre para la quedada", "error")
      return
    }

    if (!selectedSport) {
      showAlert("Por favor selecciona un deporte", "error")
      return
    }

    if (!selectedEstablishment) {
      showAlert("Por favor selecciona un establecimiento", "error")
      return
    }

    if (!selectedDay || selectedMonth === null || !selectedYear) {
      showAlert("Por favor selecciona una fecha", "error")
      return
    }

    if (startHour === null || startMinute === null) {
      showAlert("Por favor selecciona una hora de inicio", "error")
      return
    }

    if (endHour === null || endMinute === null) {
      showAlert("Por favor selecciona una hora de fin", "error")
      return
    }

    if (!location.trim()) {
      showAlert("Por favor introduce una ubicación", "error")
      return
    }

    // Validar que la fecha y hora no sean pasadas
    if (isDateTimeInPast(selectedDay, selectedMonth, selectedYear, startHour, startMinute)) {
      showAlert("No puedes crear una quedada con fecha y hora que ya han pasado", "error")
      return
    }

    // Validar que la hora de inicio no sea posterior o igual a la hora de fin
    const startTime24 = convertTo24Hour(startHour, startMinute)
    const endTime24 = convertTo24Hour(endHour, endMinute)

    if (startTime24 > endTime24) {
      showAlert("La hora de inicio debe ser anterior a la hora de fin", "error")
      return
    }

    if (startTime24 === endTime24) {
      showAlert("La hora de inicio no puede ser igual a la hora de fin", "error")
      return
    }

    try {
      setIsLoading(true)

      // Formatear fecha y horas para la API
      const formattedDate = CreateMeetingService.formatDateForApi(selectedDay, selectedMonth, selectedYear)
      const formattedStartTime = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}:00`
      const formattedEndTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}:00`

      // Obtener el usuario actual para el ID del creador
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser) {
        throw new Error("No se pudo obtener la información del usuario.")
      }

      console.log("Creando quedada con usuario:", currentUser.id)
      console.log("Competitividad (booleano):", isCompetitive)

      const createdMeeting = await CreateMeetingService.createMeeting({
        nombre: meetingName.trim(),
        creador: currentUser.id,
        localizacion: location.trim(),
        fecha: formattedDate,
        hora_inicio: formattedStartTime,
        hora_finalizacion: formattedEndTime,
        competitividad: isCompetitive,
        local: selectedEstablishment.id,
        deporte: selectedSport.id,
      })

      // Resetear el formulario después de crear la quedada exitosamente
      resetForm()

      // Mostrar alerta de éxito
      showAlert("Quedada creada correctamente. Has sido inscrito automáticamente.", "success", 3000)

      // Opcional: navegar a otra pantalla después de un breve retraso
      setTimeout(() => {
        if (isMounted.current) {
          navigation.navigate("SearchMeetings")
        }
      }, 1500)
    } catch (error) {
      console.error("Error al crear quedada:", error)

      let errorMessage = "Error al crear la quedada. Por favor inténtalo de nuevo."
      if (error instanceof Error) {
        errorMessage = error.message
      }

      showAlert(errorMessage, "error")
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }

  if (!fontsLoaded || loadingData) {
    return (
      <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />
        <View style={isDark ? styles.loadingContainerDark : styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#4CAF50" : "#006400"} />
          <Text style={isDark ? styles.loadingTextDark : styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <AlertProvider>
      <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

        <MainPageHeader text="Crear Quedada" isDark={isDark}></MainPageHeader>

        <ScrollView style={isDark ? styles.contentDark : styles.content} showsVerticalScrollIndicator={false}>

          {/* Nombre de la Quedada */}
          <View style={isDark ? styles.formGroupDark : styles.formGroup}>
            <Text style={isDark ? styles.labelDark : styles.label}>Nombre de la Quedada</Text>
            <TextInput
              style={isDark ? styles.inputDark : styles.input}
              placeholder="Introduce el nombre de la quedada"
              placeholderTextColor={isDark ? "#8A8A8A" : "#BDBBC7"}
              value={meetingName}
              onChangeText={setMeetingName}
            />
          </View>

          {/* Deporte - Ahora mostramos directamente la lista de deportes */}
          <View style={isDark ? styles.formGroupDark : styles.formGroup}>
            {/* Mostrar SportsList directamente sin toggle */}
            <SportsList
              sports={sports}
              selectedSport={selectedSport}
              onSelectSport={(sport) => setSelectedSport(sport)}
              getSportIcon={SearchMeetingsService.getSportIcon}
              theme={theme}
            />
          </View>

          {/* Establecimiento */}
          <View style={isDark ? styles.formGroupDark : styles.formGroup}>
            <Text style={isDark ? styles.labelDark : styles.label}>Establecimiento</Text>
            <TouchableOpacity
              style={isDark ? styles.dropdownDark : styles.dropdown}
              onPress={() => setShowEstablishmentDropdown(!showEstablishmentDropdown)}
            >
              <Text
                style={
                  selectedEstablishment
                    ? isDark
                      ? styles.dropdownTextSelectedDark
                      : styles.dropdownTextSelected
                    : isDark
                      ? styles.dropdownTextDark
                      : styles.dropdownText
                }
              >
                {selectedEstablishment ? selectedEstablishment.nombre : "Seleccionar establecimiento"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} />
            </TouchableOpacity>
          </View>

          {/* Establishments List Dropdown */}
          {showEstablishmentDropdown && (
            <EstablishmentsList
              establishments={establishments}
              selectedEstablishment={selectedEstablishment}
              onSelectEstablishment={setSelectedEstablishment}
              onClose={() => setShowEstablishmentDropdown(false)}
              theme={theme}
            />
          )}

          {/* Fecha */}
          <View style={isDark ? styles.formGroupDark : styles.formGroup}>
            <Text style={isDark ? styles.labelDark : styles.label}>Fecha</Text>
            <TouchableOpacity
              style={isDark ? styles.dropdownDark : styles.dropdown}
              onPress={() => {
                initializeDate()
                setShowDateModal(true)
              }}
            >
              <Text
                style={
                  formattedDate
                    ? isDark
                      ? styles.dropdownTextSelectedDark
                      : styles.dropdownTextSelected
                    : isDark
                      ? styles.dropdownTextDark
                      : styles.dropdownText
                }
              >
                {formattedDate || "Seleccionar fecha"}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} />
            </TouchableOpacity>
          </View>

          {/* Hora de Inicio y Fin */}
          <View style={isDark ? styles.formRowDark : styles.formRow}>
            <View style={[isDark ? styles.formGroupDark : styles.formGroup, { flex: 1 }]}>
              <Text style={isDark ? styles.labelDark : styles.label}>Hora de Inicio</Text>
              <TouchableOpacity
                style={isDark ? styles.dropdownDark : styles.dropdown}
                onPress={() => {
                  initializeTime(true)
                  setShowStartTimeModal(true)
                }}
              >
                <Text
                  style={
                    formattedStartTime
                      ? isDark
                        ? styles.dropdownTextSelectedDark
                        : styles.dropdownTextSelected
                      : isDark
                        ? styles.dropdownTextDark
                        : styles.dropdownText
                  }
                >
                  {formattedStartTime || "Seleccionar"}
                </Text>
                <Ionicons name="time-outline" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} />
              </TouchableOpacity>
            </View>

            <View style={[isDark ? styles.formGroupDark : styles.formGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={isDark ? styles.labelDark : styles.label}>Hora de Fin</Text>
              <TouchableOpacity
                style={isDark ? styles.dropdownDark : styles.dropdown}
                onPress={() => {
                  initializeTime(false)
                  setShowEndTimeModal(true)
                }}
              >
                <Text
                  style={
                    formattedEndTime
                      ? isDark
                        ? styles.dropdownTextSelectedDark
                        : styles.dropdownTextSelected
                      : isDark
                        ? styles.dropdownTextDark
                        : styles.dropdownText
                  }
                >
                  {formattedEndTime || "Seleccionar"}
                </Text>
                <Ionicons name="time-outline" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ubicación */}
          <View style={isDark ? styles.formGroupDark : styles.formGroup}>
            <Text style={isDark ? styles.labelDark : styles.label}>Ubicación</Text>
            <TextInput
              style={isDark ? styles.inputDark : styles.input}
              placeholder="Introduce la ubicación"
              placeholderTextColor={isDark ? "#8A8A8A" : "#BDBBC7"}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Quedada Competitiva */}
          <View style={isDark ? styles.competitiveRowDark : styles.competitiveRow}>
            <Text style={isDark ? styles.competitiveTextDark : styles.competitiveText}>
              Quedada {isCompetitive ? "Competitiva" : "No Competitiva"}
            </Text>
            <Switch
              trackColor={{ false: isDark ? "#555" : "#D9D9D9", true: isDark ? "#2E7D32" : "#006400" }}
              thumbColor={"#FFFFFF"}
              ios_backgroundColor={isDark ? "#555" : "#D9D9D9"}
              onValueChange={(value) => {
                setIsCompetitive(value)
                console.log("Toggle cambiado a:", value, "Se enviará como:", value ? 1 : 0)
              }}
              value={isCompetitive}
            />
          </View>

          {/* Botones de acción */}
          <View style={isDark ? styles.buttonRowDark : styles.buttonRow}>
            {/* Botón Crear Quedada */}
            <TouchableOpacity
              style={[
                isDark ? styles.createButtonDark : styles.createButton,
                isLoading && (isDark ? styles.disabledButtonDark : styles.disabledButton),
              ]}
              onPress={handleCreateMeeting}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={isDark ? styles.createButtonTextDark : styles.createButtonText}>Crear Quedada</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Añadir padding al final para mejor desplazamiento */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Componente Calendario */}
        <Calendar
          visible={showDateModal}
          onClose={() => setShowDateModal(false)}
          onSelectDate={handleDateSelection}
          initialDay={selectedDay}
          initialMonth={selectedMonth}
          initialYear={selectedYear}
          theme={theme}
        />

        {/* Componentes Reloj */}
        <Clock
          visible={showStartTimeModal}
          onClose={() => setShowStartTimeModal(false)}
          onSelectTime={handleStartTimeSelection}
          initialHour={startHour}
          initialMinute={startMinute}
          title="Seleccionar Hora de Inicio"
          theme={theme}
        />

        <Clock
          visible={showEndTimeModal}
          onClose={() => setShowEndTimeModal(false)}
          onSelectTime={handleEndTimeSelection}
          initialHour={endHour}
          initialMinute={endMinute}
          title="Seleccionar Hora de Fin"
          theme={theme}
        />
      </SafeAreaView>
    </AlertProvider>
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
    marginBottom: 20,
  },
  headerDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerPlaceholder: {
    width: 32,
    height: 32,
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
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentDark: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formGroupDark: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  formRowDark: {
    flexDirection: "row",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#006400",
    marginBottom: 6,
  },
  labelDark: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#4CAF50",
    marginBottom: 6,
  },
  input: {
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#333",
  },
  inputDark: {
    height: 40,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#E0E0E0",
  },
  dropdown: {
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownDark: {
    height: 40,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#BDBBC7",
  },
  dropdownTextDark: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#8A8A8A",
  },
  dropdownTextSelected: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#333",
  },
  dropdownTextSelectedDark: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#E0E0E0",
  },
  competitiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  competitiveRowDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  competitiveText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#333",
  },
  competitiveTextDark: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#E0E0E0",
  },
  buttonRow: {
    marginBottom: 24,
  },
  buttonRowDark: {
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonDark: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#88B288",
  },
  disabledButtonDark: {
    backgroundColor: "#1B5E20",
    opacity: 0.7,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  createButtonTextDark: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
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
    backgroundColor: "#121212",
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
    color: "#BBBBBB",
    marginTop: 12,
  },
})

export default CreateMeeting