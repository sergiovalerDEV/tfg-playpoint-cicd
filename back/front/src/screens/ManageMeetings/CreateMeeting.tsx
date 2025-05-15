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
  FlatList,
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
import SportsList from "../../components/SportsList"
import EstablishmentsList from "../../components/EstablishmentsList"
import SearchMeetingsService from "../../services/ManageMeetings/SearchMeetingsService"
import { showAlert, AlertProvider } from "../../components/Alert"
import { useTheme } from "../../contexts/ThemeContext"
import MainPageHeader from "../../components/headers/MainPageHeader"

type Props = StackScreenProps<RootParamList, "CreateMeeting">

// Definir los tipos de secciones para el renderizado
type FormSection = {
  id: string
  type: "meetingName" | "sport" | "establishment" | "date" | "timeRow" | "location" | "competitive" | "button"
}

const CreateMeeting: React.FC<Props> = ({ navigation, route }) => {
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
  
  // Número máximo de deportes a mostrar en la vista principal
  const MAX_VISIBLE_SPORTS = 6

  // Definir las secciones del formulario para FlatList
  const formSections: FormSection[] = [
    { id: "meetingName", type: "meetingName" },
    { id: "sport", type: "sport" },
    { id: "establishment", type: "establishment" },
    { id: "date", type: "date" },
    { id: "timeRow", type: "timeRow" },
    { id: "location", type: "location" },
    { id: "competitive", type: "competitive" },
    { id: "button", type: "button" },
  ]

  // Cargar fuentes
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Verificar si hay un deporte seleccionado desde la pantalla AllSports
  useEffect(() => {
    if (route.params?.selectedSport) {
      setSelectedSport(route.params.selectedSport)
    }
  }, [route.params])

  // Funciones para limpiar campos individuales
  const clearMeetingName = () => {
    setMeetingName("")
  }

  const clearLocation = () => {
    setLocation("")
  }

  const clearSport = () => {
    setSelectedSport(null)
  }

  const clearEstablishment = () => {
    setSelectedEstablishment(null)
  }

  const clearDate = () => {
    setSelectedDay(null)
    setSelectedMonth(null)
    setSelectedYear(null)
    setFormattedDate("")
  }

  const clearStartTime = () => {
    setStartHour(null)
    setStartMinute(null)
    setFormattedStartTime("")
  }

  const clearEndTime = () => {
    setEndHour(null)
    setEndMinute(null)
    setFormattedEndTime("")
  }

  // Función para resetear todos los campos del formulario
  const resetForm = () => {
    clearMeetingName()
    clearLocation()
    setIsCompetitive(false)
    clearDate()
    clearStartTime()
    clearEndTime()
    clearEstablishment()
    clearSport()
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

  // Función para navegar a la pantalla de todos los deportes
  const navigateToAllSports = () => {
    navigation.navigate("AllSports", {
      sports: sports,
      selectedSportId: selectedSport?.id,
      theme: theme
    })
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

  // Renderizar cada sección del formulario
  const renderFormSection = ({ item }: { item: FormSection }) => {
    switch (item.type) {
      case "meetingName":
        return (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre de la Quedada</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Introduce el nombre de la quedada"
                placeholderTextColor="#BDBBC7"
                value={meetingName}
                onChangeText={setMeetingName}
              />
              {meetingName.trim() !== "" && (
                <TouchableOpacity style={styles.clearInputButton} onPress={clearMeetingName}>
                  <Ionicons name="close-circle" size={16} color="#BDBBC7" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )

      case "sport":
        return (
          <View style={styles.formGroup}>
            <View style={styles.sportHeaderContainer}>
              <Text style={styles.label}>Deporte</Text>
              {selectedSport && (
                <TouchableOpacity style={styles.clearSportButton} onPress={clearSport}>
                  <Text style={styles.clearSportText}>Limpiar</Text>
                  <Ionicons name="close-circle" size={16} color="#BDBBC7" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Mostrar SportsList con número limitado de deportes */}
            <View>
              <SportsList
                sports={sports.slice(0, MAX_VISIBLE_SPORTS)}
                selectedSport={selectedSport}
                onSelectSport={(sport) => setSelectedSport(sport)}
                getSportIcon={SearchMeetingsService.getSportIcon}
                theme={theme}
              />
              
              {/* Botón "+" para ver todos los deportes si hay más del máximo */}
              {sports.length > MAX_VISIBLE_SPORTS && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={navigateToAllSports}
                >
                  <Ionicons name="add-circle" size={20} color="#006400" />
                  <Text style={styles.viewAllText}>
                    Ver todos los deportes
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )

      case "establishment":
        return (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Establecimiento</Text>
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowEstablishmentDropdown(!showEstablishmentDropdown)}
                >
                  <Text
                    style={
                      selectedEstablishment
                        ? styles.dropdownTextSelected
                        : styles.dropdownText
                    }
                  >
                    {selectedEstablishment ? selectedEstablishment.nombre : "Seleccionar establecimiento"}
                  </Text>
                  {!selectedEstablishment && (
                    <Ionicons name="chevron-down" size={16} color="#BDBBC7" />
                  )}
                </TouchableOpacity>
                {selectedEstablishment && (
                  <TouchableOpacity style={styles.clearInputButton} onPress={clearEstablishment}>
                    <Ionicons name="close-circle" size={16} color="#BDBBC7" />
                  </TouchableOpacity>
                )}
              </View>
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
          </>
        )

      case "date":
        return (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Fecha</Text>
            <View style={styles.inputWrapper}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  initializeDate()
                  setShowDateModal(true)
                }}
              >
                <Text
                  style={
                    formattedDate
                      ? styles.dropdownTextSelected
                      : styles.dropdownText
                  }
                >
                  {formattedDate || "Seleccionar fecha"}
                </Text>
                {!formattedDate && (
                  <Ionicons name="calendar-outline" size={16} color="#BDBBC7" />
                )}
              </TouchableOpacity>
              {formattedDate !== "" && (
                <TouchableOpacity style={styles.clearInputButton} onPress={clearDate}>
                  <Ionicons name="close-circle" size={16} color="#BDBBC7" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )

      case "timeRow":
        return (
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Hora de Inicio</Text>
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    initializeTime(true)
                    setShowStartTimeModal(true)
                  }}
                >
                  <Text
                    style={
                      formattedStartTime
                        ? styles.dropdownTextSelected
                        : styles.dropdownText
                    }
                  >
                    {formattedStartTime || "Seleccionar"}
                  </Text>
                  {!formattedStartTime && (
                    <Ionicons name="time-outline" size={16} color="#BDBBC7" />
                  )}
                </TouchableOpacity>
                {formattedStartTime !== "" && (
                  <TouchableOpacity style={styles.clearInputButton} onPress={clearStartTime}>
                    <Ionicons name="close-circle" size={16} color="#BDBBC7" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Hora de Fin</Text>
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    initializeTime(false)
                    setShowEndTimeModal(true)
                  }}
                >
                  <Text
                    style={
                      formattedEndTime
                        ? styles.dropdownTextSelected
                        : styles.dropdownText
                    }
                  >
                    {formattedEndTime || "Seleccionar"}
                  </Text>
                  {!formattedEndTime && (
                    <Ionicons name="time-outline" size={16} color="#BDBBC7" />
                  )}
                </TouchableOpacity>
                {formattedEndTime !== "" && (
                  <TouchableOpacity style={styles.clearInputButton} onPress={clearEndTime}>
                    <Ionicons name="close-circle" size={16} color="#BDBBC7" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )

      case "location":
        return (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ubicación</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Introduce la ubicación"
                placeholderTextColor="#BDBBC7"
                value={location}
                onChangeText={setLocation}
              />
              {location.trim() !== "" && (
                <TouchableOpacity style={styles.clearInputButton} onPress={clearLocation}>
                  <Ionicons name="close-circle" size={16} color="#BDBBC7" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )

      case "competitive":
        return (
          <View style={styles.competitiveRow}>
            <Text style={styles.competitiveText}>
              Quedada {isCompetitive ? "Competitiva" : "No Competitiva"}
            </Text>
            <Switch
              trackColor={{ false: "#D9D9D9", true: "#006400" }}
              thumbColor={"#FFFFFF"}
              ios_backgroundColor="#D9D9D9"
              onValueChange={(value) => {
                setIsCompetitive(value)
                console.log("Toggle cambiado a:", value, "Se enviará como:", value ? 1 : 0)
              }}
              value={isCompetitive}
            />
          </View>
        )

      case "button":
        return (
          <View style={styles.buttonRow}>
            {/* Botón Crear Quedada */}
            <TouchableOpacity
              style={[
                styles.createButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleCreateMeeting}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Crear Quedada</Text>
              )}
            </TouchableOpacity>
          </View>
        )

      default:
        return null
    }
  }

  if (!fontsLoaded || loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006400" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <AlertProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <MainPageHeader text="Crear Quedada" isDark={false}></MainPageHeader>

        <FlatList
          data={formSections}
          renderItem={renderFormSection}
          keyExtractor={(item) => item.id}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 20 }} />}
        />

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
  header: {
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
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#006400",
    marginBottom: 6,
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 36, // Espacio para el botón de limpiar
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#333",
  },
  clearInputButton: {
    position: "absolute",
    right: 10,
    padding: 4,
    zIndex: 1,
  },
  dropdown: {
    flex: 1,
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 36, // Espacio para el botón de limpiar
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#BDBBC7",
  },
  dropdownTextSelected: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#333",
  },
  sportHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  clearSportButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  clearSportText: {
    fontFamily: "Inter-Regular",
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  competitiveRow: {
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
  buttonRow: {
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#88B288",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  loadingContainer: {
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
  // Nuevos estilos para el botón "Ver todos"
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  viewAllText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#006400",
    marginLeft: 6,
  },
})

export default CreateMeeting