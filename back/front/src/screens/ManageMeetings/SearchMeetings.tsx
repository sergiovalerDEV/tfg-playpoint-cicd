"use client"

import type { StackScreenProps } from "@react-navigation/stack"
import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Switch,
  FlatList,
  Alert,
  AppState,
} from "react-native"
import type { RootParamList } from "../../navigation/RootParamList"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import Calendar from "../../components/Calendar"
import Clock from "../../components/Clock"
import SearchMeetingsService, {
  type Quedada,
  type Local,
  type Deporte,
  type FilterParams,
} from "../../services/ManageMeetings/SearchMeetingsService"
import UserService from "../../services/User/UserService"
import EstablishmentsList from "../../components/EstablishmentsList"
import SportsList from "../../components/SportsList"
import MeetingCard from "../../components/MeetingCard"
import AdCard from "../../components/AdCard"
import AdService, { type Ad } from "../../services/AdService"
import { useTheme } from "../../contexts/ThemeContext"
import MainPageHeader from "../../components/headers/MainPageHeader"
import SearchMeetingsHeader from "../../components/headers/SearchMeetingsHeader"

type Props = StackScreenProps<RootParamList, "SearchMeetings">

// Tipo para los elementos que se mostrarán en la lista
type ListItem = {
  id: string
  type: "meeting" | "ad"
  data: Quedada | Ad
}

const SearchMeetings: React.FC<Props> = ({ navigation }) => {
  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [selectedEstablishment, setSelectedEstablishment] = useState<Local | null>(null)
  const [selectedSport, setSelectedSport] = useState<Deporte | null>(null)
  const [isCompetitive, setIsCompetitive] = useState<boolean | undefined>(undefined)
  const [filtersVisible, setFiltersVisible] = useState(false)

  // Date states
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [formattedDate, setFormattedDate] = useState("")

  // Time states
  const [startHour, setStartHour] = useState<number | null>(null)
  const [startMinute, setStartMinute] = useState<number | null>(null)
  const [startAmPm, setStartAmPm] = useState<string | null>(null)
  const [formattedStartTime, setFormattedStartTime] = useState("")

  const [endHour, setEndHour] = useState<number | null>(null)
  const [endMinute, setEndMinute] = useState<number | null>(null)
  const [endAmPm, setEndAmPm] = useState<string | null>(null)
  const [formattedEndTime, setFormattedEndTime] = useState("")

  // Modal visibility states
  const [showDateModal, setShowDateModal] = useState(false)
  const [showStartTimeModal, setShowStartTimeModal] = useState(false)
  const [showEndTimeModal, setShowEndTimeModal] = useState(false)
  const [showEstablishmentDropdown, setShowEstablishmentDropdown] = useState(false)

  // Data states
  const [meetings, setMeetings] = useState<Quedada[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [establishments, setEstablishments] = useState<Local[]>([])
  const [sports, setSports] = useState<Deporte[]>([])
  const [isPremium, setIsPremium] = useState<boolean>(false)

  // Estado para controlar si la app está lista para renderizar
  const [appIsReady, setAppIsReady] = useState(false)

  // Ref para evitar múltiples actualizaciones simultáneas
  const isUpdatingRef = useRef(false)

  // Cargar el estado premium del usuario
  useEffect(() => {
    const loadUserPremiumStatus = async () => {
      try {
        const user = await UserService.getCurrentUser()
        if (user) {
          setIsPremium(user.premium || false)
          console.log(`Usuario premium: ${user.premium ? "Sí" : "No"}`)
        }
      } catch (error) {
        console.error("Error al cargar estado premium:", error)
        setIsPremium(false)
      }
    }

    loadUserPremiumStatus()
  }, [])

  // Cargar anuncios si el usuario no es premium
  useEffect(() => {
    const loadAds = async () => {
      if (!isPremium) {
        try {
          // Obtener anuncios aleatorios (aproximadamente 1 por cada 3 quedadas)
          const adCount = Math.max(1, Math.floor(meetings.length / 3))
          const randomAds = await AdService.getRandomAds(adCount)
          setAds(randomAds)
          console.log(`Cargados ${randomAds.length} anuncios para usuario no premium`)
        } catch (error) {
          console.error("Error al cargar anuncios:", error)
        }
      } else {
        // Si el usuario es premium, limpiar los anuncios
        setAds([])
      }
    }

    loadAds()
  }, [isPremium, meetings.length])

  // Combinar quedadas y anuncios en una sola lista para mostrar
  useEffect(() => {
    const combineItemsForList = () => {
      if (isPremium || ads.length === 0) {
        // Si es usuario premium o no hay anuncios, mostrar solo las quedadas
        const meetingItems: ListItem[] = meetings.map((meeting) => ({
          id: `meeting-${meeting.id}`,
          type: "meeting",
          data: meeting,
        }))
        setListItems(meetingItems)
        return
      }

      // Para usuarios no premium, intercalar anuncios entre las quedadas
      const combined: ListItem[] = []
      const adInterval = Math.max(2, Math.floor(meetings.length / ads.length))

      meetings.forEach((meeting, index) => {
        // Añadir la quedada
        combined.push({
          id: `meeting-${meeting.id}`,
          type: "meeting",
          data: meeting,
        })

        // Añadir un anuncio cada cierto número de quedadas
        const adIndex = Math.floor(index / adInterval)
        if ((index + 1) % adInterval === 0 && adIndex < ads.length) {
          combined.push({
            id: `ad-${ads[adIndex].id}-${index}`,
            type: "ad",
            data: ads[adIndex],
          })
        }
      })

      setListItems(combined)
    }

    combineItemsForList()
  }, [meetings, ads, isPremium])

  // Función para manejar el cierre de un anuncio
  const handleCloseAd = (adId: string) => {
    setListItems((prevItems) => prevItems.filter((item) => item.id !== adId))
  }

  // Función para obtener las quedadas con los filtros aplicados
  const fetchMeetingsWithFilters = useCallback(
    async (silentUpdate = false) => {
      // Evitar múltiples actualizaciones simultáneas
      if (isUpdatingRef.current) {
        console.log("Ya hay una actualización en curso, ignorando esta solicitud")
        return
      }

      isUpdatingRef.current = true

      // Solo mostrar indicador de carga si no es una actualización silenciosa
      if (!silentUpdate) {
        setLoading(true)
      }
      setError(null)

      try {
        // Construir objeto de filtros para enviar al servidor
        const filters: FilterParams = {}

        // CAMBIO 2: Asegurar que solo se muestran quedadas abiertas
        filters.abierta = true

        // CAMBIO 2: Obtener la fecha y hora actual para filtrar
        const now = new Date()

        // Formatear la fecha actual para el filtro
        const formattedToday = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
          .getDate()
          .toString()
          .padStart(2, "0")}`

        // Formatear la hora actual para el filtro
        const currentHour = now.getHours().toString().padStart(2, "0")
        const currentMinute = now.getMinutes().toString().padStart(2, "0")
        const currentTime = `${currentHour}:${currentMinute}:00`

        console.log(`🔍 FILTRADO: Fecha actual: ${formattedToday}, Hora actual: ${currentTime}`)

        // Añadir filtros de fecha y hora actual al objeto de filtros
        // Estos filtros se usarán en el backend para filtrar quedadas pasadas
        filters.fecha_actual = formattedToday
        filters.hora_actual = currentTime

        // Añadir filtro de búsqueda por texto (nombre)
        if (searchQuery.trim()) {
          filters.nombre = searchQuery.trim()
          console.log(`🔍 FILTRADO: Búsqueda por texto: "${searchQuery.trim()}"`)
        }

        // Añadir filtro de localización
        if (location.trim()) {
          filters.localizacion = location.trim()
          console.log(`🔍 FILTRADO: Localización: "${location.trim()}"`)
        }

        // Añadir filtro de establecimiento - MODIFICADO: Ahora enviamos el ID
        if (selectedEstablishment) {
          filters.local = selectedEstablishment.id
          console.log(
            `🔍 FILTRADO: Establecimiento por ID: ${selectedEstablishment.id} (Nombre: "${selectedEstablishment.nombre}")`,
          )
        }

        // Añadir filtro de deporte
        if (selectedSport) {
          filters.deporte = selectedSport.id
          console.log(`🔍 FILTRADO: Deporte por ID: ${selectedSport.id} (Nombre: "${selectedSport.nombre}")`)
        }

        // Añadir filtro de competitividad
        if (isCompetitive !== undefined) {
          filters.competitividad = isCompetitive
          console.log(`🔍 FILTRADO: Competitividad: ${isCompetitive}`)
        }

        // Añadir filtro de fecha
        if (selectedDay && selectedMonth !== null && selectedYear) {
          const formattedApiDate = SearchMeetingsService.formatDateForApi(selectedDay, selectedMonth, selectedYear)
          filters.fecha = formattedApiDate
          console.log(`🔍 FILTRADO: Fecha formateada para API: ${formattedApiDate}`)
        }

        // Añadir filtro de hora de inicio
        if (startHour !== null && startMinute !== null && startAmPm) {
          const formattedApiTime = SearchMeetingsService.formatTimeForApi(startHour, startMinute, startAmPm)
          filters.hora_inicio = formattedApiTime
          console.log(`🔍 FILTRADO: Hora inicio formateada para API: ${formattedApiTime}`)
        }

        // Añadir filtro de hora de finalización
        if (endHour !== null && endMinute !== null && endAmPm) {
          const formattedApiTime = SearchMeetingsService.formatTimeForApi(endHour, endMinute, endAmPm)
          filters.hora_finalizacion = formattedApiTime
          console.log(`🔍 FILTRADO: Hora fin formateada para API: ${formattedApiTime}`)
        }

        console.log("🔍 FILTRADO: Enviando filtros al servidor:", JSON.stringify(filters))

        // Llamar al servicio para obtener las quedadas filtradas
        const data = await SearchMeetingsService.filterMeetings(filters)
        console.log(`✅ Obtenidas ${data.length} quedadas filtradas desde el servidor`)

        // Si el backend no filtra correctamente por fecha y hora, podemos aplicar un filtro adicional aquí
        const filteredData = data.filter((meeting) => {
          // Convertir la fecha y hora de la quedada a un objeto Date
          const meetingDate = new Date(meeting.fecha)
          const [hours, minutes] = meeting.hora_inicio.split(":").map(Number)
          meetingDate.setHours(hours, minutes, 0, 0)

          // Comparar con la fecha y hora actual
          return meetingDate >= now
        })

        console.log(
          `✅ Después de filtrar por fecha y hora: ${filteredData.length} quedadas (eliminadas ${data.length - filteredData.length})`,
        )

        setMeetings(filteredData)

        // Extract unique establishments and sports if API endpoints are not available
        if (filteredData.length > 0 && (sports.length === 0 || establishments.length === 0)) {
          extractEstablishmentsAndSports(filteredData)
        }
      } catch (error) {
        console.error("Error fetching meetings:", error)
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError("Failed to load meetings. Please try again.")
        }

        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes("session has expired")) {
          Alert.alert("Sesión expirada", "Tu sesión ha expirado. Por favor, loguéate de nuevo.", [
            { text: "OK", onPress: () => navigation.navigate("Login") },
          ])
        }
      } finally {
        // Solo cambiar el estado de carga si no es una actualización silenciosa
        if (!silentUpdate) {
          setLoading(false)
        }

        // Permitir nuevas actualizaciones
        isUpdatingRef.current = false
      }
    },
    [
      searchQuery,
      location,
      selectedEstablishment,
      selectedSport,
      isCompetitive,
      selectedDay,
      selectedMonth,
      selectedYear,
      startHour,
      startMinute,
      startAmPm,
      endHour,
      endMinute,
      endAmPm,
      establishments.length,
      sports.length,
      navigation,
    ],
  )

  // Helper functions for MeetingCard since they were removed from the service
  const getSportIcon = (sportName: string): string => {
    if (!sportName) return "fitness-outline"

    const sportName_lower = sportName.toLowerCase()

    if (sportName_lower.includes("tenis") || sportName_lower.includes("padel")) {
      return "tennisball-outline"
    } else if (sportName_lower.includes("futbol") || sportName_lower.includes("fútbol")) {
      return "football-outline"
    } else if (sportName_lower.includes("basket") || sportName_lower.includes("baloncesto")) {
      return "basketball-outline"
    } else if (sportName_lower.includes("volei") || sportName_lower.includes("volley")) {
      return "baseball-outline"
    } else if (sportName_lower.includes("natación") || sportName_lower.includes("swim")) {
      return "water-outline"
    } else if (sportName_lower.includes("running") || sportName_lower.includes("correr")) {
      return "walk-outline"
    } else if (sportName_lower.includes("cicli") || sportName_lower.includes("bici")) {
      return "bicycle-outline"
    } else if (sportName_lower.includes("golf")) {
      return "golf-outline"
    } else if (sportName_lower.includes("rugby")) {
      return "american-football-outline"
    } else if (sportName_lower.includes("hockey")) {
      return "hockey-sticks"
    }

    return "fitness-outline" // Icono de deporte por defecto
  }

  // Replace the checkForPastMeetings function with a stub that does nothing
  const checkForPastMeetings = useCallback(async () => {
    // This function is now a stub that does nothing
    // We're keeping it to maintain compatibility with existing code
    console.log("Verificación de quedadas pasadas desactivada según nuevos requisitos")

    // En su lugar, refrescamos la lista para aplicar los filtros de fecha y hora
    fetchMeetingsWithFilters(true)
  }, [fetchMeetingsWithFilters])

  // Replace with a simple effect that logs the change
  // Configurar un intervalo para verificar periódicamente si hay quedadas que ya han pasado
  useEffect(() => {
    console.log("Configurando verificación periódica de quedadas pasadas")

    // Verificar cada minuto si hay quedadas que ya han pasado
    const intervalId = setInterval(() => {
      console.log("Verificando automáticamente si hay quedadas pasadas...")
      checkForPastMeetings()
    }, 60000) // 60000 ms = 1 minuto

    return () => {
      console.log("Limpiando intervalo de verificación de quedadas pasadas")
      clearInterval(intervalId)
    }
  }, [checkForPastMeetings])

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Registrar callback para actualización automática cuando cambian las quedadas
  useEffect(() => {
    // Función que se ejecutará cuando cambien las quedadas
    const handleMeetingsChanged = () => {
      console.log("Detectado cambio en las quedadas, actualizando vista...")

      // Verificar si hay una actualización en curso
      if (isUpdatingRef.current) {
        console.log("Ya hay una actualización en curso, posponiendo esta actualización")
        return
      }

      // Actualizar silenciosamente sin mostrar indicadores de carga
      checkForPastMeetings()
    }

    // Registrar el callback
    SearchMeetingsService.registerOnMeetingsChangedCallback(handleMeetingsChanged)

    // Limpiar al desmontar
    return () => {
      SearchMeetingsService.unregisterOnMeetingsChangedCallback(handleMeetingsChanged)
    }
  }, [checkForPastMeetings])

  // Efecto para preparar la aplicación y ocultar la pantalla de splash
  useEffect(() => {
    async function prepare() {
      try {
        // Preparar recursos necesarios
        await Promise.all([
          // Verificar autenticación
          UserService.isLoggedIn().then((isLoggedIn) => {
            if (!isLoggedIn) {
              navigation.navigate("Login")
            }
          }),
          // Esperar a que las fuentes se carguen
          new Promise((resolve) => {
            if (fontsLoaded) {
              resolve(true)
            }
          }),
        ])
      } catch (e) {
        console.warn("Error durante la preparación de la app:", e)
      } finally {
        // Marcar la app como lista
        setAppIsReady(true)
      }
    }

    prepare()
  }, [fontsLoaded, navigation])

  // Efecto para ocultar la pantalla de splash cuando la app esté lista
  useEffect(() => {
    if (appIsReady) {
      // Ocultar la pantalla de splash de Expo
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync()
          console.log("Pantalla de splash de Expo ocultada correctamente")
        } catch (e) {
          console.warn("Error al ocultar la pantalla de splash:", e)
        }
      }

      hideSplash()
    }
  }, [appIsReady])

  // Manejar cambios en el estado de la aplicación (primer plano/fondo)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // La app volvió al primer plano, ocultar la pantalla de splash por si acaso
        SplashScreen.hideAsync().catch((e) => console.warn("Error al ocultar splash en cambio de estado:", e))

        // También refrescar las quedadas para asegurarnos de que no se muestran quedadas pasadas
        checkForPastMeetings()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [checkForPastMeetings])

  // Check authentication and load meetings on component mount
  useEffect(() => {
    const checkAuthAndLoadMeetings = async () => {
      try {
        // Check if user is logged in using UserService
        const isLoggedIn = await UserService.isLoggedIn()
        if (!isLoggedIn) {
          // Redirect to login if not authenticated
          navigation.navigate("Login")
          return
        }

        // Load all meetings with empty filters (get all)
        await fetchMeetingsWithFilters()

        // Load sports and establishments from API
        await loadSportsAndEstablishments()
      } catch (error) {
        console.error("Error in initial load:", error)
        setError("Failed to load meetings. Please try again.")
        setLoading(false)
      }
    }

    checkAuthAndLoadMeetings()
  }, [navigation, fetchMeetingsWithFilters])

  // Extract unique establishments and sports from meetings
  const extractEstablishmentsAndSports = (data: Quedada[]) => {
    if (data.length === 0) return

    // Extract unique establishments
    const uniqueEstablishments: Local[] = []
    const establishmentIds = new Set()

    data.forEach((meeting) => {
      if (meeting.local && !establishmentIds.has(meeting.local.id)) {
        establishmentIds.add(meeting.local.id)
        uniqueEstablishments.push(meeting.local)
      }
    })

    // Extract unique sports
    const uniqueSports: Deporte[] = []
    const sportIds = new Set()

    data.forEach((meeting) => {
      if (meeting.deporte && !sportIds.has(meeting.deporte.id)) {
        sportIds.add(meeting.deporte.id)
        uniqueSports.push(meeting.deporte)
      }
    })

    // Only set if we don't already have data from API
    if (establishments.length === 0) {
      setEstablishments(uniqueEstablishments)
    }

    if (sports.length === 0) {
      setSports(uniqueSports)
    }
  }

  // Load sports and establishments from API
  const loadSportsAndEstablishments = async () => {
    try {
      // Load sports from API
      const sportsData = await SearchMeetingsService.getAllSports()
      if (sportsData && sportsData.length > 0) {
        setSports(sportsData)
      }

      // Load establishments from API
      const establishmentsData = await SearchMeetingsService.getAllEstablishments()
      if (establishmentsData && establishmentsData.length > 0) {
        setEstablishments(establishmentsData)
      }
    } catch (error) {
      console.error("Error loading sports and establishments:", error)
    }
  }

  // Handle search button click
  const handleSearch = useCallback(async () => {
    // Usar el método fetchMeetingsWithFilters que ya incluye el searchQuery
    await fetchMeetingsWithFilters()
  }, [fetchMeetingsWithFilters])

  // Añadir un efecto para realizar búsqueda automática cuando cambia el texto
  useEffect(() => {
    // Usar un temporizador para evitar demasiadas búsquedas mientras se escribe
    const searchTimer = setTimeout(() => {
      // Realizar búsqueda con los filtros actuales
      fetchMeetingsWithFilters(false)
    }, 500) // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(searchTimer)
  }, [searchQuery, fetchMeetingsWithFilters])

  // Apply filters
  const applyFilters = () => {
    console.log("🔍 FILTRADO: Iniciando aplicación de filtros...")

    // Mostrar los filtros seleccionados para depuración
    if (selectedDay && selectedMonth !== null && selectedYear) {
      console.log(`🔍 FILTRADO: Fecha seleccionada: ${selectedDay}/${selectedMonth + 1}/${selectedYear}`)
    }

    if (location) console.log(`🔍 FILTRADO: Localización: "${location}"`)
    if (selectedEstablishment)
      console.log(`🔍 FILTRADO: Establecimiento: "${selectedEstablishment.nombre}" (ID: ${selectedEstablishment.id})`)
    if (selectedSport) console.log(`🔍 FILTRADO: Deporte: "${selectedSport.nombre}" (ID: ${selectedSport.id})`)
    if (isCompetitive !== undefined) console.log(`🔍 FILTRADO: Competitivo: ${isCompetitive ? "Sí" : "No"}`)

    // Usar el método fetchMeetingsWithFilters que ya incluye todos los filtros
    fetchMeetingsWithFilters()
    setFiltersVisible(false)
  }

  // Reset filters
  const resetFilters = () => {
    // Resetear todos los estados de filtro
    setSearchQuery("")
    setLocation("")
    setSelectedEstablishment(null)
    setSelectedSport(null)
    setIsCompetitive(undefined)

    // Reset date
    setSelectedDay(null)
    setSelectedMonth(null)
    setSelectedYear(null)
    setFormattedDate("")

    // Reset start time
    setStartHour(null)
    setStartMinute(null)
    setStartAmPm(null)
    setFormattedStartTime("")

    // Reset end time
    setEndHour(null)
    setEndMinute(null)
    setEndAmPm(null)
    setFormattedEndTime("")

    console.log("Filtros reseteados, obteniendo todas las quedadas")

    // Obtener todas las quedadas sin filtros
    fetchMeetingsWithFilters()
  }

  // Funciones para resetear filtros individuales
  const resetLocation = () => {
    setLocation("")
    // Fetch meetings after clearing the filter
    fetchMeetingsWithFilters()
  }

  const resetEstablishment = () => {
    setSelectedEstablishment(null)
    // Fetch meetings after clearing the filter
    fetchMeetingsWithFilters()
  }

  const resetDate = () => {
    setSelectedDay(null)
    setSelectedMonth(null)
    setSelectedYear(null)
    setFormattedDate("")
    // Fetch meetings after clearing the filter
    fetchMeetingsWithFilters()
  }

  const resetStartTime = () => {
    setStartHour(null)
    setStartMinute(null)
    setStartAmPm(null)
    setFormattedStartTime("")
    // Fetch meetings after clearing the filter
    fetchMeetingsWithFilters()
  }

  const resetEndTime = () => {
    setEndHour(null)
    setEndMinute(null)
    setEndAmPm(null)
    setFormattedEndTime("")
    // Fetch meetings after clearing the filter
    fetchMeetingsWithFilters()
  }

  const resetSport = () => {
    setSelectedSport(null)
    // Fetch meetings after clearing the filter
    fetchMeetingsWithFilters()
  }

  const resetCompetitive = () => {
    setIsCompetitive(undefined)
    // Fetch meetings after clearing the filter
    fetchMeetingsWithFilters()
  }

  // Toggle competitive switch
  const toggleSwitch = () => setIsCompetitive((previousState) => (previousState === undefined ? true : !previousState))

  // Toggle filters visibility
  const toggleFilters = () => setFiltersVisible((previousState) => !previousState)

  // Initialize date with current date if not set
  const initializeDate = () => {
    const now = new Date()
    if (!selectedDay) setSelectedDay(now.getDate())
    if (selectedMonth === null) setSelectedMonth(now.getMonth())
    if (!selectedYear) setSelectedYear(now.getFullYear())
  }

  // Initialize time if not set
  const initializeTime = (isStartTime: boolean) => {
    const now = new Date()
    const currentHour = now.getHours() % 12 || 12
    const currentMinute = now.getMinutes()
    const currentAmPm = now.getHours() >= 12 ? "PM" : "AM"

    if (isStartTime) {
      if (!startHour) setStartHour(currentHour)
      if (startMinute === null) setStartMinute(currentMinute)
      if (!startAmPm) setStartAmPm(currentAmPm)
    } else {
      if (!endHour) setEndHour(currentHour)
      if (endMinute === null) setEndMinute(currentMinute)
      if (!endAmPm) setEndAmPm(currentAmPm)
    }
  }

  // Handle date selection
  const handleDateSelection = (day: number, month: number, year: number) => {
    setSelectedDay(day)
    setSelectedMonth(month)
    setSelectedYear(year)

    // Format the date for display
    const formattedDate = `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
    setFormattedDate(formattedDate)
  }

  // Handle time selection
  const handleStartTimeSelection = (hour: number, minute: number, ampm: string) => {
    setStartHour(hour)
    setStartMinute(minute)
    setStartAmPm(ampm)

    // Format the time for display
    const formattedTime = `${hour}:${minute.toString().padStart(2, "0")}${ampm.toLowerCase()}`
    setFormattedStartTime(formattedTime)
  }

  const handleEndTimeSelection = (hour: number, minute: number, ampm: string) => {
    setEndHour(hour)
    setEndMinute(minute)
    setEndAmPm(ampm)

    // Format the time for display
    const formattedTime = `${hour}:${minute.toString().padStart(2, "0")}${ampm.toLowerCase()}`
    setFormattedEndTime(formattedTime)
  }

  // CAMBIO 1: Función para refrescar manualmente las quedadas
  const handleManualRefresh = async () => {
    console.log("Refrescando manualmente las quedadas...")
    await fetchMeetingsWithFilters(false) // Forzar recarga con indicador de carga
  }

  // Función para manejar la navegación a los detalles de la quedada
  const handleMeetingPress = (meetingId: number) => {
    console.log(`🔄 SearchMeetings: Navegando a detalles con ID: ${meetingId}`)
    const meeting = meetings.find((m) => m.id === meetingId)
    if (meeting) {
      navigation.navigate("MeetingDetails", { _id: meetingId, meeting: meeting as any })
    }
  }

  // Si la app no está lista o las fuentes no están cargadas, mostrar un contenedor vacío
  if (!appIsReady || !fontsLoaded) {
    return <View style={isDark ? styles.containerDark : styles.container} />
  }

  // Reemplazar la función getSportImageUrl para que use las imágenes de la base de datos
  const getSportImageUrl = (deporte: any): string => {
    // Si el deporte tiene una imagen definida en la base de datos, usarla
    if (deporte && deporte.imagen) {
      return deporte.imagen
    }

    // Imagen genérica para deportes si no hay imagen en la base de datos
    return "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000"
  }

  // Renderizar elemento de la lista (quedada o anuncio)
  const renderListItem = ({ item }: { item: ListItem }) => {
    if (item.type === "ad") {
      return <AdCard ad={item.data as Ad} onClose={() => handleCloseAd(item.id)} />
    } else {
      return (
        <MeetingCard
          meeting={item.data as Quedada}
          onPress={() => handleMeetingPress((item.data as Quedada).id)}
          formatDateForDisplay={SearchMeetingsService.formatDateForDisplay}
          formatTimeForDisplay={SearchMeetingsService.formatTimeForDisplay}
          getSportIcon={getSportIcon}
          getSportImageUrl={getSportImageUrl}
          theme={theme}
        />
      )
    }
  }

  return (
    <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      <SearchMeetingsHeader handleManualRefresh={handleManualRefresh} isDark={isDark}></SearchMeetingsHeader>
      <MainPageHeader text="Buscar Quedadas" isDark={isDark}></MainPageHeader>

      {/* Fixed Header with Search and Filters */}
      <View style={isDark ? styles.fixedHeaderContainerDark : styles.fixedHeaderContainer}>
        {/* Search Bar */}
        <View style={isDark ? styles.searchContainerDark : styles.searchContainer}>
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="search" size={20} color={isDark ? "#8A8A8A" : "#BDBBC7"} style={styles.searchIcon} as any />
          </TouchableOpacity>
          <TextInput
            style={isDark ? styles.searchInputDark : styles.searchInput}
            placeholder="Search meetings"
            placeholderTextColor={isDark ? "#8A8A8A" : "#BDBBC7"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Filters Header with Toggle Button */}
        <View style={styles.filtersHeader}>
          <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitle}>Filters</Text>
          <TouchableOpacity
            onPress={toggleFilters}
            style={isDark ? styles.filterToggleButtonDark : styles.filterToggleButton}
          >
            <Ionicons name={filtersVisible ? "chevron-up" : "chevron-down"} size={18} color="#FFFFFF" as any />
          </TouchableOpacity>
        </View>

        {/* Collapsible Filters Container */}
        {filtersVisible && (
          <View style={styles.filtersContainer}>
            {/* Location Input */}
            <View style={styles.filterRow}>
              <View style={styles.filterInputWrapper}>
                <TextInput
                  style={isDark ? styles.filterInputDark : styles.filterInput}
                  placeholder="Location"
                  placeholderTextColor={isDark ? "#8A8A8A" : "#BDBBC7"}
                  value={location}
                  onChangeText={setLocation}
                />
                {location.trim() !== "" && (
                  <TouchableOpacity style={styles.clearInputButton} onPress={resetLocation}>
                    <Ionicons name="close-circle" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Sports List Component - Ahora siempre visible */}
            <SportsList
              sports={sports}
              selectedSport={selectedSport}
              onSelectSport={(sport) => setSelectedSport(sport as Deporte | null)}
              getSportIcon={getSportIcon}
              theme={theme}
            />

            {/* Establishment and Date */}
            <View style={styles.filterRow}>
              {/* Establishment Dropdown */}
              <View style={styles.filterInputWrapper}>
                <TouchableOpacity
                  style={isDark ? styles.filterDropdownDark : styles.filterDropdown}
                  onPress={() => setShowEstablishmentDropdown(!showEstablishmentDropdown)}
                >
                  <Text
                    style={
                      selectedEstablishment
                        ? isDark
                          ? styles.filterTextDark
                          : styles.filterText
                        : isDark
                          ? styles.filterPlaceholderDark
                          : styles.filterPlaceholder
                    }
                  >
                    {selectedEstablishment?.nombre || "Establishment"}
                  </Text>
                  {!selectedEstablishment && (
                    <Ionicons name="chevron-down" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
                  )}
                </TouchableOpacity>
                {selectedEstablishment && (
                  <TouchableOpacity style={styles.clearInputButton} onPress={resetEstablishment}>
                    <Ionicons name="close-circle" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
                  </TouchableOpacity>
                )}
              </View>

              {/* Date Picker */}
              <View style={styles.filterInputWrapper}>
                <TouchableOpacity
                  style={isDark ? styles.filterDateDark : styles.filterDate}
                  onPress={() => {
                    initializeDate()
                    setShowDateModal(true)
                  }}
                >
                  <Text
                    style={
                      formattedDate
                        ? isDark
                          ? styles.filterTextDark
                          : styles.filterText
                        : isDark
                          ? styles.filterPlaceholderDark
                          : styles.filterPlaceholder
                    }
                  >
                    {formattedDate || "Date"}
                  </Text>
                  {!formattedDate && (
                    <Ionicons name="calendar-outline" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
                  )}
                </TouchableOpacity>
                {formattedDate !== "" && (
                  <TouchableOpacity style={styles.clearInputButton} onPress={resetDate}>
                    <Ionicons name="close-circle" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
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
                theme={theme} // Pasar el tema actual
              />
            )}

            {/* Start Time and End Time */}
            <View style={styles.filterRow}>
              {/* Start Time Picker */}
              <View style={styles.filterInputWrapper}>
                <TouchableOpacity
                  style={isDark ? styles.filterTimeDark : styles.filterTime}
                  onPress={() => {
                    initializeTime(true)
                    setShowStartTimeModal(true)
                  }}
                >
                  <Text
                    style={
                      formattedStartTime
                        ? isDark
                          ? styles.filterTextDark
                          : styles.filterText
                        : isDark
                          ? styles.filterPlaceholderDark
                          : styles.filterPlaceholder
                    }
                  >
                    {formattedStartTime || "Start time"}
                  </Text>
                  {!formattedStartTime && (
                    <Ionicons name="time-outline" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
                  )}
                </TouchableOpacity>
                {formattedStartTime !== "" && (
                  <TouchableOpacity style={styles.clearInputButton} onPress={resetStartTime}>
                    <Ionicons name="close-circle" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
                  </TouchableOpacity>
                )}
              </View>

              {/* End Time Picker */}
              <View style={styles.filterInputWrapper}>
                <TouchableOpacity
                  style={isDark ? styles.filterTimeDark : styles.filterTime}
                  onPress={() => {
                    initializeTime(false)
                    setShowEndTimeModal(true)
                  }}
                >
                  <Text
                    style={
                      formattedEndTime
                        ? isDark
                          ? styles.filterTextDark
                          : styles.filterText
                        : isDark
                          ? styles.filterPlaceholderDark
                          : styles.filterPlaceholder
                    }
                  >
                    {formattedEndTime || "End time"}
                  </Text>
                  {!formattedEndTime && (
                    <Ionicons name="time-outline" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
                  )}
                </TouchableOpacity>
                {formattedEndTime !== "" && (
                  <TouchableOpacity style={styles.clearInputButton} onPress={resetEndTime}>
                    <Ionicons name="close-circle" size={16} color={isDark ? "#8A8A8A" : "#BDBBC7"} as any />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Competitive Toggle */}
            <View style={isDark ? styles.competitiveRowDark : styles.competitiveRow}>
              <Text style={isDark ? styles.competitiveTextDark : styles.competitiveText}>Competitive meeting</Text>
              <View style={styles.competitiveToggleContainer}>
                <Switch
                  trackColor={{ false: isDark ? "#555" : "#D9D9D9", true: isDark ? "#2E7D32" : "#006400" }}
                  thumbColor={"#FFFFFF"}
                  ios_backgroundColor={isDark ? "#555" : "#D9D9D9"}
                  onValueChange={toggleSwitch}
                  value={isCompetitive === true}
                />
              </View>
            </View>

            {/* Filter Action Buttons */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[isDark ? styles.resetButtonDark : styles.resetButton, { flex: 1 }]}
                onPress={resetFilters}
              >
                <Text style={isDark ? styles.resetButtonTextDark : styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Scrollable Content Area */}
      <FlatList
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollableContentContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.listHeaderContainer}>
            <Text style={isDark ? styles.sectionTitleDark : styles.sectionTitle}>Available Meetings</Text>
            {!isPremium && (
              <View style={styles.premiumBadgeContainer}>
                <Text style={styles.premiumBadgeText}>Free Account</Text>
              </View>
            )}
          </View>
        )}
        data={listItems}
        keyExtractor={(item) => item.id}
        extraData={listItems.length} // Añadir esto para que la lista se actualice cuando cambie el número de elementos
        renderItem={renderListItem}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={isDark ? styles.emptyContainerDark : styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={isDark ? "#555" : "#BDBBC7"} as any />
              <Text style={isDark ? styles.emptyTextDark : styles.emptyText}>No meetings found</Text>
              <Text style={isDark ? styles.emptySubtextDark : styles.emptySubtext}>
                Try adjusting your filters or create a new meeting
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={() => <View style={{ height: 20 }} />}
        refreshing={loading}
        onRefresh={handleManualRefresh} // CAMBIO 1: Usar handleManualRefresh para el pull-to-refresh
        // Añadir estas propiedades para optimizar el rendimiento
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />

      {/* Calendar Component */}
      <Calendar
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelectDate={handleDateSelection}
        initialDay={selectedDay}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
        theme={theme} // Pasar el tema actual
      />

      {/* Clock Components */}
      <Clock
        visible={showStartTimeModal}
        onClose={() => setShowStartTimeModal(false)}
        onSelectTime={handleStartTimeSelection}
        initialHour={startHour}
        initialMinute={startMinute}
        initialAmPm={startAmPm}
        title="Select Start Time"
        theme={theme} // Pasar el tema actual
      />

      <Clock
        visible={showEndTimeModal}
        onClose={() => setShowEndTimeModal(false)}
        onSelectTime={handleEndTimeSelection}
        initialHour={endHour}
        initialMinute={endMinute}
        initialAmPm={endAmPm}
        title="Select End Time"
        theme={theme} // Pasar el tema actual
      />
    </SafeAreaView>
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
  backButton: {
    padding: 4,
  },
  refreshButton: {
    padding: 4,
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
  fixedHeaderContainer: {
    backgroundColor: "#fff",
    zIndex: 10,
    paddingHorizontal: 16,
  },
  fixedHeaderContainerDark: {
    backgroundColor: "#121212",
    zIndex: 10,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
  },
  searchContainerDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
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
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    marginBottom: 12,
  },
  sectionTitleDark: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    marginBottom: 12,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filterToggleButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#006400",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  filterToggleButtonDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
  },
  competitiveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 12,
  },
  competitiveRowDark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    marginBottom: 12,
  },
  competitiveText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#333",
  },
  competitiveTextDark: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#E0E0E0",
  },
  competitiveToggleContainer: {
    marginLeft: 10,
  },
  filtersContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  filterInputWrapper: {
    flex: 1,
    marginRight: 8,
    position: "relative",
  },
  filterInput: {
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#333",
  },
  filterInputDark: {
    height: 40,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#E0E0E0",
  },
  filterDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  filterDropdownDark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  filterDate: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  filterDateDark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  filterTime: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  filterTimeDark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  filterText: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#333",
  },
  filterTextDark: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#E0E0E0",
  },
  filterPlaceholder: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#BDBBC7",
  },
  filterPlaceholderDark: {
    fontFamily: "Inter-Regular",
    fontSize: 14,
    color: "#8A8A8A",
  },
  clearInputButton: {
    position: "absolute",
    right: 10,
    top: 12,
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resetButton: {
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  resetButtonDark: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  resetButtonText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#333",
  },
  resetButtonTextDark: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: "#E0E0E0",
  },
  scrollableContent: {
    flex: 1,
  },
  scrollableContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listHeader: {
    marginBottom: 12,
  },
  premiumPrompt: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#777",
  },
  premiumPromptDark: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyContainerDark: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#777",
    marginTop: 16,
  },
  emptyTextDark: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#777",
    marginTop: 8,
    textAlign: "center",
  },
  emptySubtextDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  premiumBadgeContainer: {
    backgroundColor: "#FFC107",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
    color: "#212121",
  },
})

export default SearchMeetings