"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  Alert,
} from "react-native"
import type { StackScreenProps } from "@react-navigation/stack"
import type React from "react"
import type { RootParamList } from "../../navigation/RootParamList"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import SearchMeetingsService, {
  type Quedada,
  type UsuarioQuedada,
} from "../../services/ManageMeetings/SearchMeetingsService"
import { showAlert } from "../../components/Alert"
import { useTheme } from "../../contexts/ThemeContext"
import ReportModal from "../../components/modals/ReportModal"
import SecondaryPageHeader from "../../components/headers/SecondaryPageHeader"

type Props = StackScreenProps<RootParamList, "MeetingDetails">

// Interface for teams
interface Team {
  id: number
  name: string
  players: UsuarioQuedada[]
  maxPlayers: number
}

const MeetingDetails: React.FC<Props> = ({ navigation, route }) => {
  // Get theme context
  const { theme } = useTheme?.() || { theme: "light" }
  const isDark = theme === "dark"

  // Definir colores base para mantener consistencia
  const colors = {
    // Colores claros para modo claro
    light: {
      primary: "#4CAF50", // Verde principal
      secondary: "#8BC34A", // Verde secundario
      background: "#FFFFFF", // Fondo blanco
      card: "#F5F9F5", // Fondo de tarjeta (verde muy claro)
      border: "#E8F5E9", // Borde (verde muy claro)
      text: "#2E7D32", // Texto principal (verde oscuro)
      textSecondary: "#689F38", // Texto secundario (verde medio)
      textLight: "#AED581", // Texto claro (verde claro)
      buttonPrimary: "#4CAF50", // Botón principal
      buttonSecondary: "#8BC34A", // Botón secundario
      buttonDisabled: "#C8E6C9", // Botón deshabilitado
      statusActive: "#4CAF50", // Estado activo
      statusInactive: "#AED581", // Estado inactivo
      statusClosed: "#81C784", // Estado cerrado
    },
    // Colores para modo oscuro (manteniendo tonos verdes claros)
    dark: {
      primary: "#81C784", // Verde principal más claro
      secondary: "#A5D6A7", // Verde secundario más claro
      background: "#F5F9F5", // Fondo verde muy claro
      card: "#E8F5E9", // Fondo de tarjeta (verde muy claro)
      border: "#C8E6C9", // Borde (verde claro)
      text: "#2E7D32", // Texto principal (verde oscuro)
      textSecondary: "#388E3C", // Texto secundario (verde medio)
      textLight: "#66BB6A", // Texto claro (verde)
      buttonPrimary: "#4CAF50", // Botón principal
      buttonSecondary: "#8BC34A", // Botón secundario
      buttonDisabled: "#C8E6C9", // Botón deshabilitado
      statusActive: "#4CAF50", // Estado activo
      statusInactive: "#AED581", // Estado inactivo
      statusClosed: "#81C784", // Estado cerrado
    },
  }

  // Seleccionar el esquema de colores según el tema
  const currentColors = isDark ? colors.dark : colors.light

  const [meeting, setMeeting] = useState<Quedada | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUserJoined, setIsUserJoined] = useState(false)
  const [joiningOrLeaving, setJoiningOrLeaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [isMeetingInProgress, setIsMeetingInProgress] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [userTeamId, setUserTeamId] = useState<number | null>(null)
  const [changingTeam, setChangingTeam] = useState(false)
  const [joiningTeamId, setJoiningTeamId] = useState<number | null>(null)
  const [isMeetingClosed, setIsMeetingClosed] = useState(false)
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [submittingReport, setSubmittingReport] = useState(false)

  // Refs for update intervals
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateTimeRef = useRef<number>(Date.now())

  // Extract meeting ID from route params
  console.log("📝 MeetingDetails: Route params:", JSON.stringify(route.params))
  let meetingId: number | undefined

  // Extract ID with robust fallbacks
  if (typeof route.params === "object" && route.params !== null) {
    console.log("🔑 MeetingDetails: Available keys:", Object.keys(route.params))

    if ("id" in route.params && route.params.id !== undefined && route.params.id !== null) {
      meetingId = Number(route.params.id)
    } else if ("meetingId" in route.params && route.params.meetingId !== undefined && route.params.meetingId !== null) {
      meetingId = Number(route.params.meetingId)
    } else if ("_id" in route.params && route.params._id !== undefined && route.params._id !== null) {
      meetingId = Number(route.params._id)
    } else if (
      "meeting" in route.params &&
      typeof route.params.meeting === "object" &&
      route.params.meeting !== null &&
      "id" in route.params.meeting
    ) {
      meetingId = Number(route.params.meeting.id)
    } else {
      // Try to find any numeric property
      for (const key in route.params) {
        if (
          typeof route.params[key] === "number" ||
          (typeof route.params[key] === "string" && !isNaN(Number(route.params[key])))
        ) {
          meetingId = Number(route.params[key])
          break
        }
      }
    }
  } else if (typeof route.params === "number") {
    meetingId = route.params
  } else if (typeof route.params === "string" && !isNaN(Number(route.params))) {
    meetingId = Number(route.params)
  }

  console.log(`🔑 MeetingDetails: Final extracted ID: ${meetingId}`)

  // Organize users into teams
  const organizeTeams = useCallback((meeting: Quedada): Team[] => {
    if (!meeting || !meeting.deporte || !meeting.usuarioquedada) {
      return []
    }

    const numberOfTeams = meeting.deporte.numero_equipos || 2
    const playersPerTeam = meeting.deporte.numero_jugadores || 5
    const result: Team[] = []

    // Create team structure
    for (let i = 1; i <= numberOfTeams; i++) {
      result.push({
        id: i,
        name: `Equipo ${i}`,
        players: [],
        maxPlayers: playersPerTeam,
      })
    }

    // Distribute players into their teams
    meeting.usuarioquedada.forEach((uq) => {
      const teamId = uq.equipo || 1
      const teamIndex = result.findIndex((t) => t.id === teamId)
      if (teamIndex !== -1) {
        result[teamIndex].players.push(uq)
      }
    })

    return result
  }, [])

  // Check if meeting is closed
  const checkIfMeetingClosed = useCallback((meeting: Quedada): boolean => {
    if (!meeting) return false
    return !meeting.abierta
  }, [])

  // Check if meeting is in progress
  const checkIfMeetingInProgress = useCallback((meeting: Quedada): boolean => {
    try {
      if (!meeting || !meeting.fecha || !meeting.hora_inicio) {
        return false
      }

      const now = new Date()
      let meetingDate: Date

      // Extract date components
      let year, month, day
      if (meeting.fecha.includes("T")) {
        const dateParts = meeting.fecha.split("T")[0].split("-")
        year = Number.parseInt(dateParts[0], 10)
        month = Number.parseInt(dateParts[1], 10) - 1
        day = Number.parseInt(dateParts[2], 10)
      } else {
        const dateParts = meeting.fecha.split("-")
        year = Number.parseInt(dateParts[0], 10)
        month = Number.parseInt(dateParts[1], 10) - 1
        day = Number.parseInt(dateParts[2], 10)
      }

      // Extract time components
      const timeParts = meeting.hora_inicio.split(":")
      const hours = Number.parseInt(timeParts[0], 10)
      const minutes = Number.parseInt(timeParts[1], 10)
      const seconds = timeParts.length > 2 ? Number.parseInt(timeParts[2], 10) : 0

      // Create meeting date
      meetingDate = new Date(year, month, day, hours, minutes, seconds)

      // Add one day for comparison
      const adjustedMeetingDate = new Date(meetingDate)
      adjustedMeetingDate.setDate(adjustedMeetingDate.getDate() + 1)

      // Meeting is in progress if current time is after adjusted meeting time
      return now >= adjustedMeetingDate
    } catch (error) {
      console.error("❌ Error checking meeting status:", error)
      return false
    }
  }, [])

  // Fetch meeting details
  const fetchMeetingDetails = useCallback(
    async (showLoadingIndicator = true) => {
      if (!meetingId) {
        setError("ID de quedada no disponible")
        setLoading(false)
        return
      }

      try {
        if (showLoadingIndicator) {
          setLoading(true)
          setError(null)
        }

        const numericMeetingId = Number(meetingId)
        const meetingData = await SearchMeetingsService.getMeetingById(numericMeetingId, true)

        if (meetingData) {
          if (meetingData.id !== numericMeetingId) {
            setError(`Error: Se solicitó la quedada ${numericMeetingId} pero se recibió la ${meetingData.id}`)
            if (showLoadingIndicator) {
              setLoading(false)
            }
            return
          }

          // Check if meeting has started
          const inProgress = checkIfMeetingInProgress(meetingData)
          setIsMeetingInProgress(inProgress)

          setMeeting(meetingData)
          setIsMeetingClosed(!meetingData.abierta)

          // Organize teams
          const organizedTeams = organizeTeams(meetingData)
          setTeams(organizedTeams)

          // Check if user is joined to this meeting
          try {
            const joined = await SearchMeetingsService.isUserJoinedToMeeting(numericMeetingId)
            setIsUserJoined(joined)

            if (joined) {
              const userTeam = (await SearchMeetingsService.getUserTeamInMeeting?.(numericMeetingId)) || null
              setUserTeamId(userTeam)
            } else {
              setUserTeamId(null)
            }
          } catch (joinError) {
            console.error(`❌ Error checking participation:`, joinError)
            setIsUserJoined(false)
            setUserTeamId(null)
          }
        } else {
          throw new Error(`No se encontró la quedada ${meetingId}`)
        }
      } catch (error) {
        console.error(`❌ Error loading meeting details:`, error)
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError("Error al cargar detalles. Inténtalo de nuevo.")
        }
      } finally {
        if (showLoadingIndicator) {
          setLoading(false)
          setRefreshing(false)
        }

        lastUpdateTimeRef.current = Date.now()
      }
    },
    [meetingId, organizeTeams, checkIfMeetingInProgress],
  )

  // Set up update interval
  const setupUpdateInterval = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    updateIntervalRef.current = setInterval(() => {
      const now = Date.now()
      if (now - lastUpdateTimeRef.current >= 5000) {
        fetchMeetingDetails(false)
      }
    }, 10000)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [fetchMeetingDetails])

  // Load meeting details on component mount
  useEffect(() => {
    setMeeting(null)
    setTeams([])
    setUserTeamId(null)
    setIsUserJoined(false)

    fetchMeetingDetails()
    const cleanupInterval = setupUpdateInterval()

    return () => {
      cleanupInterval()
    }
  }, [fetchMeetingDetails, setupUpdateInterval, meetingId])

  // Periodically check meeting status
  useEffect(() => {
    if (!meeting) return

    const checkMeetingStatus = () => {
      if (meeting) {
        const currentlyInProgress = checkIfMeetingInProgress(meeting)
        if (currentlyInProgress !== isMeetingInProgress) {
          setIsMeetingInProgress(currentlyInProgress)
        }
      }
    }

    checkMeetingStatus()
    const intervalId = setInterval(checkMeetingStatus, 10000)

    return () => {
      clearInterval(intervalId)
    }
  }, [meeting, isMeetingInProgress, checkIfMeetingInProgress])

  // Periodically check if meeting has been closed
  useEffect(() => {
    if (!meeting) return

    const checkClosedStatus = () => {
      if (meeting) {
        SearchMeetingsService.getMeetingById(meeting.id, true)
          .then((freshMeeting) => {
            if (freshMeeting) {
              const isClosed = !freshMeeting.abierta
              if (isClosed !== isMeetingClosed) {
                setIsMeetingClosed(isClosed)
                setMeeting(freshMeeting)
              }
            }
          })
          .catch((error) => {
            console.error("❌ Error checking closed status:", error)
          })
      }
    }

    checkClosedStatus()
    const intervalId = setInterval(checkClosedStatus, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [meeting, isMeetingClosed])

  // More frequent status check
  useEffect(() => {
    if (!meeting) return

    const checkStatus = () => {
      if (meeting) {
        const inProgress = checkIfMeetingInProgress(meeting)
        if (inProgress !== isMeetingInProgress) {
          setIsMeetingInProgress(inProgress)
        }
      }
    }

    checkStatus()
    const intervalId = setInterval(checkStatus, 3000)

    return () => {
      clearInterval(intervalId)
    }
  }, [meeting, checkIfMeetingInProgress, isMeetingInProgress])

  // Retry loading data
  const handleRetry = () => {
    setError(null)
    setRefreshing(true)
    fetchMeetingDetails()
  }

  // Find first available team
  const findFirstAvailableTeam = async (): Promise<number | null> => {
    if (!meeting || !meeting.deporte) {
      return null
    }

    const numberOfTeams = meeting.deporte.numero_equipos || 2

    for (let teamId = 1; teamId <= numberOfTeams; teamId++) {
      const isTeamFullFromDB = await SearchMeetingsService.isTeamFull(meeting.id, teamId)
      if (!isTeamFullFromDB) {
        return teamId
      }
    }

    return null
  }

  // Join meeting
  const handleJoinMeeting = async () => {
    if (!meeting) {
      return
    }

    // Don't allow joining if meeting is closed
    if (isMeetingClosed) {
      showAlert("No puedes unirte a una quedada que ya ha sido cerrada.", "error")
      return
    }

    // Don't allow joining if meeting is in progress
    if (isMeetingInProgress) {
      showAlert("No puedes unirte a una quedada que ya ha comenzado.", "error")
      return
    }

    // Check total capacity
    if (meeting.deporte?.numero_jugadores && meeting.deporte?.numero_equipos && meeting.usuarioquedada) {
      const currentParticipants = meeting.usuarioquedada.length
      const playersPerTeam = meeting.deporte.numero_jugadores
      const numberOfTeams = meeting.deporte.numero_equipos
      const totalCapacity = playersPerTeam * numberOfTeams

      if (currentParticipants >= totalCapacity) {
        showAlert(
          `No puedes unirte. Esta quedada ya tiene el máximo de ${totalCapacity} jugadores permitidos.`,
          "error",
        )
        return
      }
    }

    // Find first available team
    const availableTeamId = await findFirstAvailableTeam()

    if (availableTeamId === null) {
      showAlert("No puedes unirte. Todos los equipos están llenos.", "error")
      return
    }

    handleJoinTeam(availableTeamId)
  }

  // Join specific team
  const handleJoinTeam = async (teamId: number) => {
    if (!meeting) {
      return
    }

    setJoiningOrLeaving(true)
    setJoiningTeamId(teamId)

    try {
      // Check if meeting is closed
      if (isMeetingClosed) {
        showAlert("No puedes unirte a una quedada que ya ha sido cerrada.", "error")
        setJoiningOrLeaving(false)
        setJoiningTeamId(null)
        return
      }

      // Check if meeting is in progress
      if (isMeetingInProgress) {
        showAlert("No puedes unirte a una quedada que ya ha comenzado.", "error")
        setJoiningOrLeaving(false)
        setJoiningTeamId(null)
        return
      }

      // Check if team is full
      const isTeamFullFromDB = await SearchMeetingsService.isTeamFull(meeting.id, teamId)
      if (isTeamFullFromDB) {
        showAlert(
          `No puedes unirte al Equipo ${teamId}. Este equipo ya tiene el máximo de jugadores permitidos.`,
          "error",
        )
        setJoiningOrLeaving(false)
        setJoiningTeamId(null)
        return
      }

      try {
        // Try to join team
        const success = await SearchMeetingsService.joinMeetingWithTeam?.(meeting.id, teamId)

        if (success) {
          setIsUserJoined(true)
          setUserTeamId(teamId)
          showAlert(`¡Te has unido al Equipo ${teamId}!`, "success")
          fetchMeetingDetails()
        } else {
          // Try general join method as fallback
          const fallbackSuccess = await SearchMeetingsService.joinMeeting(meeting.id)

          if (fallbackSuccess) {
            setIsUserJoined(true)
            fetchMeetingDetails()
            showAlert("¡Te has unido a la quedada!", "success")
          } else {
            throw new Error("No se pudo unir a la quedada")
          }
        }
      } catch (joinError) {
        if (joinError instanceof Error && joinError.message.includes("equipo completo")) {
          showAlert(
            `No puedes unirte al Equipo ${teamId}. Otro usuario acaba de ocupar el último lugar disponible.`,
            "error",
          )
          fetchMeetingDetails()
        } else {
          showAlert("No se pudo unir a la quedada. Inténtalo de nuevo.", "error")
        }
        throw joinError
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ya ha comenzado")) {
          showAlert("No puedes unirte a una quedada que ya ha comenzado.", "error")
          setIsMeetingInProgress(true)
        } else if (!error.message.includes("equipo completo")) {
          showAlert("Ocurrió un error. Inténtalo de nuevo.", "error")
        }
      } else {
        showAlert("Ocurrió un error inesperado. Inténtalo de nuevo.", "error")
      }
    } finally {
      setJoiningOrLeaving(false)
      setJoiningTeamId(null)
    }
  }

  // Change team
  const handleChangeTeam = async (newTeamId: number) => {
    if (!meeting || !isUserJoined) {
      return
    }

    // If already in this team, do nothing
    if (userTeamId === newTeamId) {
      return
    }

    // Check if meeting is closed
    if (isMeetingClosed) {
      showAlert("No puedes cambiar de equipo en una quedada que ya ha sido cerrada.", "error")
      return
    }

    // Check if meeting is in progress
    if (isMeetingInProgress) {
      showAlert("No puedes cambiar de equipo en una quedada que ya está en curso.", "error")
      return
    }

    setChangingTeam(true)

    try {
      // Check if team is full
      const isTeamFullFromDB = await SearchMeetingsService.isTeamFull(meeting.id, newTeamId)
      if (isTeamFullFromDB) {
        showAlert(
          `No puedes unirte al Equipo ${newTeamId}. Este equipo ya tiene el máximo de jugadores permitidos.`,
          "error",
        )
        setChangingTeam(false)
        return
      }

      // Update local state for UI
      const oldTeamId = userTeamId
      setUserTeamId(newTeamId)

      try {
        // Change team
        const success = (await SearchMeetingsService.changeTeam?.(meeting.id, newTeamId)) || false

        if (success) {
          showAlert(`¡Has cambiado al Equipo ${newTeamId}!`, "success")
          await fetchMeetingDetails()
        } else {
          // Revert local state if failed
          setUserTeamId(oldTeamId)
          throw new Error("No se pudo cambiar de equipo")
        }
      } catch (error) {
        // Revert local state if error
        setUserTeamId(oldTeamId)

        if (error instanceof Error && error.message.includes("equipo completo")) {
          showAlert("No puedes unirte a este equipo porque ya está completo.", "error")
        } else {
          showAlert("No se pudo cambiar de equipo. Inténtalo de nuevo.", "error")
        }

        await fetchMeetingDetails()
      }
    } catch (error) {
      showAlert("Ocurrió un error. Inténtalo de nuevo.", "error")
      await fetchMeetingDetails()
    } finally {
      setChangingTeam(false)
    }
  }

  // Leave meeting - FUNCIÓN CORREGIDA
  const handleLeaveMeeting = async () => {
    if (!meeting) return

    // Check if meeting is closed
    if (isMeetingClosed) {
      showAlert("No puedes salir de una quedada que ya ha sido cerrada.", "error")
      return
    }

    // Check if meeting is in progress
    if (isMeetingInProgress) {
      showAlert("No puedes salir de una quedada que ya está en curso. Debes completar la actividad.", "error")
      return
    }

    // Confirm before leaving
    Alert.alert(
      "Salir de la quedada",
      "¿Estás seguro de que quieres salir de esta quedada?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            setJoiningOrLeaving(true)

            try {
              console.log(`🔄 Intentando salir de la quedada ${meeting.id}...`)

              // Llamar al servicio para salir de la quedada
              const success = await SearchMeetingsService.leaveMeeting(meeting.id)

              if (success) {
                console.log(`✅ Usuario ha salido exitosamente de la quedada ${meeting.id}`)

                // Actualizar el estado local para reflejar que el usuario ya no está en la quedada
                setIsUserJoined(false)
                setUserTeamId(null)

                // Mostrar mensaje de éxito
                showAlert("Has salido de la quedada correctamente.", "success")

                // Refrescar los datos
                fetchMeetingDetails()

                // Navegar hacia atrás después de un breve retraso
                setTimeout(() => {
                  navigation.goBack()
                }, 1500)
              } else {
                // Si el servicio devuelve false, verificar si el usuario realmente está en la quedada
                try {
                  const isStillJoined = await SearchMeetingsService.isUserJoinedToMeeting(meeting.id)

                  if (!isStillJoined) {
                    // Si el usuario ya no está en la quedada, consideramos que la operación fue exitosa
                    console.log(`✅ Usuario ya no está en la quedada ${meeting.id}`)
                    setIsUserJoined(false)
                    setUserTeamId(null)
                    showAlert("Has salido de la quedada correctamente.", "success")

                    // Navegar hacia atrás después de un breve retraso
                    setTimeout(() => {
                      navigation.goBack()
                    }, 1500)
                  } else {
                    // Si el usuario sigue en la quedada, mostrar error
                    console.error(`❌ Error al salir de la quedada ${meeting.id}`)
                    showAlert("No se pudo salir de la quedada. Inténtalo de nuevo.", "error")
                  }
                } catch (verificationError) {
                  console.error("Error al verificar estado de participación:", verificationError)
                  showAlert("Ocurrió un error al verificar tu estado. Inténtalo de nuevo.", "error")
                }
              }
            } catch (error) {
              console.error("Error al salir de la quedada:", error)

              // Verificar si el usuario sigue en la quedada después del error
              try {
                const isStillJoined = await SearchMeetingsService.isUserJoinedToMeeting(meeting.id)

                if (!isStillJoined) {
                  // Si el usuario ya no está en la quedada a pesar del error, consideramos que la operación fue exitosa
                  setIsUserJoined(false)
                  setUserTeamId(null)
                  showAlert("Has salido de la quedada correctamente.", "success")

                  // Navegar hacia atrás después de un breve retraso
                  setTimeout(() => {
                    navigation.goBack()
                  }, 1500)
                } else {
                  // Si el usuario sigue en la quedada, mostrar error
                  showAlert("Ocurrió un error al intentar salir de la quedada. Inténtalo de nuevo.", "error")
                }
              } catch (verificationError) {
                // Si no podemos verificar, asumimos que hubo un error
                showAlert("Ocurrió un error al intentar salir de la quedada. Inténtalo de nuevo.", "error")
              }
            } finally {
              setJoiningOrLeaving(false)
            }
          },
        },
      ],
      { cancelable: true },
    )
  }

  // Show report modal
  const handleShowReportModal = async () => {
    if (!meeting) {
      return
    }

    try {
      // Check if user is joined before allowing report
      const isJoined = await SearchMeetingsService.isUserJoinedToMeeting(meeting.id)

      if (!isJoined) {
        showAlert("Debes unirte a la quedada antes de poder reportarla.", "error")
        return
      }

      setReportModalVisible(true)
    } catch (error) {
      showAlert("No se pudo verificar si puedes reportar esta quedada.", "error")
    }
  }

  // Close report modal
  const handleCloseReportModal = () => {
    setReportModalVisible(false)
  }

  // Submit report
  const handleSubmitReport = async (reason: string) => {
    if (!meeting) return

    setSubmittingReport(true)

    try {
      // Verify user is joined
      const isJoined = await SearchMeetingsService.isUserJoinedToMeeting(meeting.id)

      if (!isJoined) {
        setReportModalVisible(false)
        showAlert("Debes unirte a la quedada antes de poder reportarla.", "error")
        return
      }

      // Send report
      const success = await SearchMeetingsService.reportMeeting(meeting.id, reason)

      if (success) {
        setReportModalVisible(false)
        showAlert("Gracias por tu reporte. Lo revisaremos pronto.", "success")
      } else {
        throw new Error("No se pudo enviar el reporte")
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("unirte")) {
        showAlert("Debes unirte a la quedada antes de poder reportarla.", "error")
      } else {
        showAlert("No se pudo enviar el reporte. Inténtalo de nuevo.", "error")
      }
    } finally {
      setSubmittingReport(false)
    }
  }

  // Get sport image URL
  const getSportImageUrl = (deporte: any): string => {
    // Si el deporte tiene una imagen definida en la base de datos, usarla
    if (deporte && deporte.imagen) {
      return deporte.imagen
    }

    // Imagen genérica para deportes si no hay imagen en la base de datos
    return "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000"
  }

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: currentColors.background }} />
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: currentColors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={currentColors.background} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={currentColors.primary} />
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 16,
              color: currentColors.text,
              marginTop: 12,
            }}
          >
            Cargando detalles de la quedada...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !meeting) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: currentColors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={currentColors.background} />
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
          <TouchableOpacity style={{ padding: 4 }} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={currentColors.text} as any />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color={currentColors.text} as any />
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 16,
              color: currentColors.text,
              marginTop: 12,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            {error || "Quedada no encontrada"}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "center", width: "100%" }}>
            <TouchableOpacity
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                backgroundColor: currentColors.primary,
                borderRadius: 8,
                marginRight: 10,
              }}
              onPress={handleRetry}
            >
              <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: "#FFFFFF" }}>Reintentar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                backgroundColor: currentColors.secondary,
                borderRadius: 8,
                marginLeft: 10,
              }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ fontFamily: "Inter-Medium", fontSize: 14, color: "#FFFFFF" }}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // Get sport icon
  const sportIcon = meeting.deporte?.nombre
    ? (SearchMeetingsService.getSportIcon(meeting.deporte.nombre) as string)
    : ("basketball-outline" as const)

  // Get sport image URL
  const sportImageUrl = getSportImageUrl(meeting.deporte)

  // Calculate total capacity
  const totalCapacity =
    meeting.deporte?.numero_jugadores && meeting.deporte?.numero_equipos
      ? meeting.deporte.numero_jugadores * meeting.deporte.numero_equipos
      : 0

  // Find current team
  const currentTeam = teams.find((team) => team.id === userTeamId)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentColors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={currentColors.background} />

      {/* Header with meeting name */}
      <SecondaryPageHeader
        text={meeting.nombre || `${meeting.deporte?.nombre || "Sport"} en ${meeting.localizacion || "Location"}`}
        isDark={false} // Siempre usar modo claro para mantener la estética minimalista
      />

      {/* Header Image with Overlay */}
      <ImageBackground source={{ uri: sportImageUrl }} style={{ height: 180, width: "100%" }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.6)", // Overlay más claro y sutil
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          {/* Report Button */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              padding: 8,
              backgroundColor: "rgba(255,255,255,0.8)",
              borderRadius: 20,
              zIndex: 10,
            }}
            onPress={handleShowReportModal}
          >
            <Ionicons name="flag-outline" size={24} color={currentColors.text} as any />
          </TouchableOpacity>

          {/* Sport Badge */}
          <View style={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.9)",
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: currentColors.border,
              }}
            >
              <Ionicons name={sportIcon as any} size={20} color={currentColors.text} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter-Medium",
                  color: currentColors.text,
                  marginLeft: 6,
                }}
              >
                {meeting.deporte?.nombre || "Deporte"}
              </Text>
            </View>
          </View>

          {/* Capacity Indicator */}
          {meeting.usuarioquedada && totalCapacity > 0 && (
            <View style={{ position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  alignSelf: "flex-start",
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: currentColors.border,
                }}
              >
                <Ionicons name="people" size={18} color={currentColors.text} as any />
                <Text
                  style={{
                    color: currentColors.text,
                    fontSize: 14,
                    fontFamily: "Inter-Medium",
                    marginLeft: 8,
                  }}
                >
                  {meeting.usuarioquedada.length}/{totalCapacity}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderRadius: 4,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: currentColors.border,
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${Math.min(100, (meeting.usuarioquedada.length / totalCapacity) * 100)}%`,
                    backgroundColor: currentColors.primary,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </ImageBackground>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {/* Action Buttons */}
        <View style={{ marginBottom: 24 }}>
          {/* Show closed status with priority */}
          {isMeetingClosed && (
            <View
              style={{
                backgroundColor: currentColors.statusClosed,
                borderRadius: 8,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: currentColors.border,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Inter-Medium",
                  fontSize: 16,
                  marginRight: 8,
                }}
              >
                Quedada cerrada
              </Text>
              <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" as any />
            </View>
          )}

          {/* Show in progress status if not closed */}
          {!isMeetingClosed && isMeetingInProgress && (
            <View
              style={{
                backgroundColor: currentColors.statusActive,
                borderRadius: 8,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: currentColors.border,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Inter-Medium",
                  fontSize: 16,
                  marginRight: 8,
                }}
              >
                Quedada en curso
              </Text>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" as any />
            </View>
          )}

          {/* Show loading status */}
          {joiningOrLeaving && (
            <View
              style={{
                backgroundColor: currentColors.buttonDisabled,
                borderRadius: 8,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: currentColors.border,
              }}
            >
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Inter-Medium",
                  fontSize: 16,
                  marginLeft: 8,
                }}
              >
                {isUserJoined ? "Saliendo..." : "Procesando..."}
              </Text>
            </View>
          )}

          {/* Show join button if user is not joined, meeting is not in progress, not closed, and not loading */}
          {!isUserJoined && !joiningOrLeaving && !isMeetingInProgress && !isMeetingClosed && (
            <TouchableOpacity
              style={{
                backgroundColor: currentColors.buttonPrimary,
                borderRadius: 8,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: currentColors.border,
              }}
              onPress={handleJoinMeeting}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Inter-Medium",
                  fontSize: 16,
                  marginRight: 8,
                }}
              >
                Unirse a la quedada
              </Text>
              <Ionicons name="enter-outline" size={20} color="#FFFFFF" as any />
            </TouchableOpacity>
          )}

          {/* Show leave button only if user is joined, meeting is not in progress, not closed, and not loading */}
          {isUserJoined && !joiningOrLeaving && !isMeetingInProgress && !isMeetingClosed && (
            <TouchableOpacity
              style={{
                backgroundColor: currentColors.buttonSecondary,
                borderRadius: 8,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: currentColors.border,
              }}
              onPress={handleLeaveMeeting}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Inter-Medium",
                  fontSize: 16,
                  marginRight: 8,
                }}
              >
                Salir de la quedada
              </Text>
              <Ionicons name="exit-outline" size={20} color="#FFFFFF" as any />
            </TouchableOpacity>
          )}
        </View>

        {/* Meeting Details */}
        <View
          style={{
            marginBottom: 24,
            backgroundColor: currentColors.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: currentColors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter-SemiBold",
              color: currentColors.text,
              marginBottom: 16,
            }}
          >
            Detalles de la quedada
          </Text>

          {/* Date and Time */}
          <View style={{ flexDirection: "row", marginBottom: 16, alignItems: "flex-start" }}>
            <View style={{ width: 40, alignItems: "center", marginTop: 2 }}>
              <Ionicons name="calendar" size={20} color={currentColors.text} as any />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter-Medium",
                  color: currentColors.text,
                  marginBottom: 4,
                }}
              >
                Fecha y hora
              </Text>
              <Text style={{ fontSize: 16, fontFamily: "Inter-Regular", color: currentColors.textSecondary }}>
                {SearchMeetingsService.formatDateForDisplay(meeting.fecha)} •{" "}
                {SearchMeetingsService.formatTimeForDisplay(meeting.hora_inicio)} -{" "}
                {SearchMeetingsService.formatTimeForDisplay(meeting.hora_finalizacion)}
              </Text>
            </View>
          </View>

          {/* Location */}
          {meeting.localizacion && (
            <View style={{ flexDirection: "row", marginBottom: 16, alignItems: "flex-start" }}>
              <View style={{ width: 40, alignItems: "center", marginTop: 2 }}>
                <Ionicons name="location" size={20} color={currentColors.text} as any />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter-Medium",
                    color: currentColors.text,
                    marginBottom: 4,
                  }}
                >
                  Ubicación
                </Text>
                <Text style={{ fontSize: 16, fontFamily: "Inter-Regular", color: currentColors.textSecondary }}>
                  {meeting.localizacion}
                </Text>
              </View>
            </View>
          )}

          {/* Establishment */}
          {meeting.local && (
            <View style={{ flexDirection: "row", marginBottom: 16, alignItems: "flex-start" }}>
              <View style={{ width: 40, alignItems: "center", marginTop: 2 }}>
                <Ionicons name="business" size={20} color={currentColors.text} as any />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter-Medium",
                    color: currentColors.text,
                    marginBottom: 4,
                  }}
                >
                  Establecimiento
                </Text>
                <Text style={{ fontSize: 16, fontFamily: "Inter-Regular", color: currentColors.textSecondary }}>
                  {meeting.local.nombre || "No especificado"}
                </Text>
              </View>
            </View>
          )}

          {/* Creator */}
          {meeting.creador && (
            <View style={{ flexDirection: "row", marginBottom: 16, alignItems: "flex-start" }}>
              <View style={{ width: 40, alignItems: "center", marginTop: 2 }}>
                <Ionicons name="person" size={20} color={currentColors.text} as any />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter-Medium",
                    color: currentColors.text,
                    marginBottom: 4,
                  }}
                >
                  Creado por
                </Text>
                <Text style={{ fontSize: 16, fontFamily: "Inter-Regular", color: currentColors.textSecondary }}>
                  {meeting.creador.nombre || "Desconocido"}
                </Text>
              </View>
            </View>
          )}

          {/* Competitive Meeting */}
          <View style={{ flexDirection: "row", marginBottom: 16, alignItems: "flex-start" }}>
            <View style={{ width: 40, alignItems: "center", marginTop: 2 }}>
              <Ionicons name="trophy" size={20} color={currentColors.text} as any />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter-Medium",
                  color: currentColors.text,
                  marginBottom: 4,
                }}
              >
                Competitivo
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {meeting.competitividad ? (
                  <Text style={{ color: currentColors.text, fontFamily: "Inter-Medium", fontSize: 16 }}>Sí</Text>
                ) : (
                  <Text style={{ color: currentColors.textSecondary, fontFamily: "Inter-Medium", fontSize: 16 }}>
                    No
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Current Team - Only show if user is joined */}
          {isUserJoined && userTeamId !== null && (
            <View style={{ flexDirection: "row", marginBottom: 16, alignItems: "flex-start" }}>
              <View style={{ width: 40, alignItems: "center", marginTop: 2 }}>
                <Ionicons name="people" size={20} color={currentColors.text} as any />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter-Medium",
                    color: currentColors.text,
                    marginBottom: 4,
                  }}
                >
                  Tu equipo
                </Text>
                <Text style={{ fontSize: 16, fontFamily: "Inter-Regular", color: currentColors.textSecondary }}>
                  {currentTeam?.name || `Equipo ${userTeamId}`}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Teams Section */}
        {teams.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter-SemiBold",
                color: currentColors.text,
                marginBottom: 12,
              }}
            >
              Equipos
            </Text>
            <View style={{ flexDirection: "column", gap: 16 }}>
              {teams.map((team) => (
                <View
                  key={team.id}
                  style={[
                    {
                      backgroundColor: currentColors.card,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: currentColors.border,
                      marginBottom: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    },
                    userTeamId === team.id && {
                      borderColor: currentColors.primary,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter-SemiBold",
                        color: currentColors.text,
                      }}
                    >
                      Equipo {team.id}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: currentColors.primary,
                        paddingVertical: 2,
                        paddingHorizontal: 6,
                        borderRadius: 12,
                      }}
                    >
                      <Ionicons name="people" size={14} color="#FFFFFF" as any />
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Inter-Medium",
                          color: "#FFFFFF",
                          marginLeft: 4,
                        }}
                      >
                        {team.players.length}/{team.maxPlayers}
                      </Text>
                    </View>
                  </View>

                  {/* Team capacity bar */}
                  <View
                    style={{
                      height: 6,
                      backgroundColor: "#F5F5F5",
                      borderRadius: 3,
                      overflow: "hidden",
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: currentColors.border,
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${Math.min(100, (team.players.length / team.maxPlayers) * 100)}%`,
                        backgroundColor: currentColors.primary,
                        borderRadius: 3,
                      }}
                    />
                  </View>

                  {/* Players list */}
                  <View style={{ marginTop: 8 }}>
                    {team.players.length > 0 ? (
                      team.players.map((player) => (
                        <View
                          key={player.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 6,
                            borderBottomWidth: 1,
                            borderBottomColor: currentColors.border,
                          }}
                        >
                          <View
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: "#F5F5F5",
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 8,
                              borderWidth: 1,
                              borderColor: currentColors.border,
                            }}
                          >
                            <Ionicons name="person" size={16} color={currentColors.text} as any />
                          </View>
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: "Inter-Regular",
                              color: currentColors.textSecondary,
                            }}
                          >
                            {player.usuario.nombre || "Desconocido"}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Inter-Regular",
                          color: currentColors.textLight,
                          fontStyle: "italic",
                          textAlign: "center",
                          paddingVertical: 8,
                        }}
                      >
                        No hay jugadores en este equipo todavía
                      </Text>
                    )}
                  </View>

                  {/* Team Action Button */}
                  {isMeetingClosed ? (
                    <View
                      style={{
                        backgroundColor: currentColors.statusClosed,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginTop: 12,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: currentColors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontFamily: "Inter-Medium",
                          fontSize: 14,
                        }}
                      >
                        Quedada cerrada
                      </Text>
                    </View>
                  ) : isMeetingInProgress ? (
                    <View
                      style={{
                        backgroundColor: currentColors.statusActive,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginTop: 12,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: currentColors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontFamily: "Inter-Medium",
                          fontSize: 14,
                        }}
                      >
                        Quedada en curso
                      </Text>
                    </View>
                  ) : isUserJoined ? (
                    userTeamId !== team.id ? (
                      team.players.length >= team.maxPlayers ? (
                        <View
                          style={{
                            backgroundColor: currentColors.buttonDisabled,
                            borderRadius: 8,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            marginTop: 12,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: currentColors.border,
                          }}
                        >
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontFamily: "Inter-Medium",
                              fontSize: 14,
                            }}
                          >
                            Equipo lleno
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={{
                            backgroundColor: currentColors.buttonSecondary,
                            borderRadius: 8,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            marginTop: 12,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: currentColors.border,
                          }}
                          onPress={() => handleChangeTeam(team.id)}
                          disabled={changingTeam}
                        >
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontFamily: "Inter-Medium",
                              fontSize: 14,
                            }}
                          >
                            {changingTeam ? "Cambiando..." : "Cambiar a este equipo"}
                          </Text>
                        </TouchableOpacity>
                      )
                    ) : (
                      <View
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: 8,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          marginTop: 12,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: currentColors.primary,
                        }}
                      >
                        <Text
                          style={{
                            color: currentColors.text,
                            fontFamily: "Inter-Medium",
                            fontSize: 14,
                          }}
                        >
                          Tu equipo
                        </Text>
                      </View>
                    )
                  ) : team.players.length >= team.maxPlayers ? (
                    <View
                      style={{
                        backgroundColor: currentColors.buttonDisabled,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginTop: 12,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: currentColors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontFamily: "Inter-Medium",
                          fontSize: 14,
                        }}
                      >
                        Equipo lleno
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={{
                        backgroundColor: currentColors.buttonPrimary,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginTop: 12,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: currentColors.border,
                      }}
                      onPress={() => handleJoinTeam(team.id)}
                      disabled={joiningOrLeaving}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontFamily: "Inter-Medium",
                          fontSize: 14,
                        }}
                      >
                        {joiningOrLeaving && joiningTeamId === team.id ? "Uniéndose..." : "Unirse a este equipo"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Participants List */}
        {meeting.usuarioquedada && meeting.usuarioquedada.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter-SemiBold",
                color: currentColors.text,
                marginBottom: 12,
              }}
            >
              Todos los participantes
            </Text>
            <View
              style={{
                backgroundColor: currentColors.card,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: currentColors.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              {meeting.usuarioquedada.map((uq) => (
                <View
                  key={uq.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: currentColors.border,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#F5F5F5",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                      borderWidth: 1,
                      borderColor: currentColors.border,
                    }}
                  >
                    <Ionicons name="person" size={20} color={currentColors.text} as any />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter-Regular",
                      color: currentColors.textSecondary,
                      flex: 1,
                    }}
                  >
                    {uq.usuario.nombre || "Desconocido"}
                  </Text>
                  <View
                    style={{
                      backgroundColor: "rgba(76,175,80,0.1)",
                      paddingVertical: 2,
                      paddingHorizontal: 6,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: currentColors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter-Medium",
                        color: currentColors.text,
                      }}
                    >
                      Equipo {uq.equipo || 1}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Report Modal */}
      <ReportModal
        visible={reportModalVisible}
        onClose={handleCloseReportModal}
        onSubmit={handleSubmitReport}
        title={`Reportar: ${meeting.nombre || "Quedada"}`}
        theme="light" // Siempre usar modo claro para mantener la estética minimalista
      />
    </SafeAreaView>
  )
}

export default MeetingDetails