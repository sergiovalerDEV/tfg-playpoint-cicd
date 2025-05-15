"use client"

import type { StackScreenProps } from "@react-navigation/stack"
import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native"
import type { RootParamList } from "../../../navigation/RootParamList"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTheme } from "../../../contexts/ThemeContext"
import UserService from "../../../services/User/UserService"
// Importar expo-notifications
import * as NotificationsExpo from "expo-notifications"
import SecondaryPageHeader from "../../../components/headers/SecondaryPageHeader"

// Storage key for notification settings
const NOTIFICATION_PERMISSION_KEY = "@notification_permission"
// Key para forzar actualización desde la base de datos
const FORCE_DB_REFRESH = "force_db_refresh"

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
NotificationsExpo.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

type Props = StackScreenProps<RootParamList, "Notifications">

// Definir una interfaz para la configuración
interface Configuracion {
  id: number;
  permitir_notificaciones: boolean;
  color_aplicacion?: string;
  [key: string]: any; // Para otras propiedades que pueda tener
}

const Notifications: React.FC<Props> = ({ navigation }) => {
  // Obtener contexto de tema
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [receiveNotifications, setReceiveNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>()

  // Cargar configuración de notificaciones al montar el componente
  useEffect(() => {
    console.log("=== INICIANDO PANTALLA DE NOTIFICACIONES ===")
    // Primero cargamos la configuración de la base de datos
    loadNotificationSettings()
  }, [])

  // Registrar para notificaciones push
  const registerForPushNotifications = async () => {
    try {
      // Verificar si el dispositivo puede recibir notificaciones
      const { status: existingStatus } = await NotificationsExpo.getPermissionsAsync()
      let finalStatus = existingStatus

      // Si no tenemos permisos, solicitarlos
      if (existingStatus !== "granted") {
        const { status } = await NotificationsExpo.requestPermissionsAsync()
        finalStatus = status
      }

      // Si no se concedieron permisos, no podemos continuar
      if (finalStatus !== "granted") {
        console.log("No se obtuvieron permisos para notificaciones push")
        return
      }

      try {
        // Intentar obtener token de Expo para este dispositivo
        const tokenData = await NotificationsExpo.getExpoPushTokenAsync()
        setExpoPushToken(tokenData.data)
        console.log("Token de notificaciones push:", tokenData.data)
      } catch (tokenError) {
        // Silenciar el error específico sobre projectId
        if (tokenError instanceof Error && !tokenError.message.includes('No "projectId" found')) {
          // Solo registrar errores que no sean sobre projectId
          console.error("Error al obtener token:", tokenError)
        } else {
          // Para el error de projectId, solo registrar un mensaje informativo
          console.log(
            "Nota: No se pudo obtener token de notificaciones push, pero las notificaciones locales seguirán funcionando",
          )
        }
      }

      // Configuración específica para Android
      if (Platform.OS === "android") {
        NotificationsExpo.setNotificationChannelAsync("default", {
          name: "default",
          importance: NotificationsExpo.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        })
      }
    } catch (error) {
      // Silenciar errores generales para evitar que aparezcan en la consola
      if (error instanceof Error && !error.message.includes('No "projectId" found')) {
        console.error("Error al registrar para notificaciones push:", error)
      }
    }
  }

  // Función para obtener la configuración directamente de la base de datos
  const getDirectConfigFromDatabase = async (): Promise<Configuracion | null> => {
    try {
      const currentUser = await UserService.getCurrentUser()
      if (!currentUser || !currentUser.configuracion) {
        console.log("No hay usuario o configuración para consultar en la base de datos")
        return null
      }

      // Obtener el ID de configuración
      let configId: number | null = null
      
      if (typeof currentUser.configuracion === "object" && currentUser.configuracion !== null) {
        configId = currentUser.configuracion.id
      } else if (typeof currentUser.configuracion === "number") {
        configId = currentUser.configuracion
      }

      if (!configId) {
        console.log("No se encontró ID de configuración")
        return null
      }

      // Forzar actualización desde la base de datos
      await AsyncStorage.setItem(FORCE_DB_REFRESH, "true")

      // Obtener instancia autenticada de axios
      const api = await UserService.getAuthenticatedAxios()

      // Consultar directamente a la base de datos
      console.log(`Consultando configuración directamente de la base de datos para ID: ${configId}`)
      const response = await api.get(`/configuracion/${configId}`)

      if (!response.data) {
        console.log("No se recibió respuesta de la base de datos")
        return null
      }

      console.log("Configuración obtenida directamente de la base de datos:", JSON.stringify(response.data))
      return response.data as Configuracion
    } catch (error) {
      console.error("Error al obtener configuración directamente de la base de datos:", error)
      return null
    }
  }

  // Cargar configuración de notificaciones desde la base de datos
  const loadNotificationSettings = async () => {
    try {
      setLoading(true)
      console.log("Cargando configuración de notificaciones desde la base de datos...")

      // Forzar actualización desde la base de datos
      await AsyncStorage.setItem(FORCE_DB_REFRESH, "true")

      // Obtener la configuración directamente de la base de datos
      const directConfig = await getDirectConfigFromDatabase()

      if (directConfig) {
        console.log("✅ Configuración obtenida directamente de la base de datos:", JSON.stringify(directConfig))
        console.log("🔔 Valor de permitir_notificaciones:", directConfig.permitir_notificaciones)

        // Establecer el estado basado en la configuración de la base de datos
        setReceiveNotifications(directConfig.permitir_notificaciones)
        console.log("Toggle establecido a:", directConfig.permitir_notificaciones)

        // Guardar también en AsyncStorage para consistencia
        await AsyncStorage.setItem(
          NOTIFICATION_PERMISSION_KEY,
          directConfig.permitir_notificaciones ? "granted" : "denied",
        )

        // Actualizar la configuración en el objeto de usuario
        const currentUser = await UserService.getCurrentUser()
        if (currentUser) {
          // Crear un objeto de actualización seguro
          const updateData: any = {}
          
          // Si configuracion es un objeto, actualizamos solo la propiedad permitir_notificaciones
          if (typeof currentUser.configuracion === "object" && currentUser.configuracion !== null) {
            updateData.configuracion = {
              ...currentUser.configuracion,
              permitir_notificaciones: directConfig.permitir_notificaciones
            }
          } else {
            // Si configuracion es un ID o no existe, usamos el objeto completo
            updateData.configuracion = directConfig
          }
          
          await UserService.updateUserData(updateData)
          console.log("Configuración actualizada en el objeto de usuario")
        }

        // Si las notificaciones están permitidas, registrar para notificaciones push
        if (directConfig.permitir_notificaciones) {
          console.log("Notificaciones permitidas, registrando para notificaciones push...")
          registerForPushNotifications()
        } else {
          console.log("Notificaciones NO permitidas, no se registrará para notificaciones push")
        }
      } else {
        console.log("⚠️ No se pudo obtener la configuración directamente de la base de datos")

        // Intentar con getUserConfiguration como fallback
        const userConfig = await UserService.getUserConfiguration()

        if (userConfig) {
          console.log("Configuración obtenida mediante getUserConfiguration:", JSON.stringify(userConfig))
          setReceiveNotifications(userConfig.permitir_notificaciones)

          if (userConfig.permitir_notificaciones) {
            registerForPushNotifications()
          }
        } else {
          // Si no hay configuración, usar el valor almacenado localmente como último fallback
          const storedPermission = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY)
          const isGranted = storedPermission === "granted"
          console.log("Usando valor almacenado localmente:", isGranted)
          setReceiveNotifications(isGranted)

          // Si las notificaciones están permitidas localmente, registrar para notificaciones push
          if (isGranted) {
            registerForPushNotifications()
          }
        }
      }
    } catch (error) {
      console.error("❌ Error al cargar configuración de notificaciones:", error)
      // Usar el valor almacenado localmente como fallback
      const storedPermission = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY)
      const isGranted = storedPermission === "granted"
      console.log("Error - Usando valor almacenado localmente:", isGranted)
      setReceiveNotifications(isGranted)

      // Si las notificaciones están permitidas localmente, registrar para notificaciones push
      if (isGranted) {
        registerForPushNotifications()
      }
    } finally {
      setLoading(false)
      console.log("Carga de configuración completada")
    }
  }

  // Handle toggling notifications
  const toggleNotifications = async (value: boolean) => {
    try {
      setLoading(true)
      console.log(`Cambiando estado de notificaciones a: ${value}`)

      if (value) {
        // Usuario quiere activar notificaciones
        Alert.alert(
          "Activar Notificaciones",
          "¿Deseas recibir notificaciones de PlayPoint? Recibirás alertas sobre tus actividades, mensajes y quedadas.",
          [
            {
              text: "Más tarde",
              style: "cancel",
              onPress: async () => {
                // Usuario rechazó
                setReceiveNotifications(false)
                await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "denied")
                setLoading(false)
              },
            },
            {
              text: "Activar",
              onPress: async () => {
                try {
                  // Solicitar permisos de notificación
                  const { status } = await NotificationsExpo.requestPermissionsAsync()

                  if (status !== "granted") {
                    Alert.alert(
                      "Permisos Denegados",
                      "No se pudieron obtener los permisos necesarios. Por favor, activa las notificaciones en la configuración de tu dispositivo.",
                    )
                    setReceiveNotifications(false)
                    setLoading(false)
                    return
                  }

                  // Actualizar estado local PRIMERO para respuesta inmediata en la UI
                  setReceiveNotifications(true)
                  await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "granted")

                  // Registrar para notificaciones push
                  await registerForPushNotifications()

                  // Obtener la configuración del usuario directamente de la base de datos
                  const directConfig = await getDirectConfigFromDatabase()
                  const configId = directConfig ? directConfig.id : null

                  if (!configId) {
                    console.error("No se pudo obtener ID de configuración")
                    setLoading(false)
                    return
                  }

                  // Obtener instancia autenticada de axios
                  const api = await UserService.getAuthenticatedAxios()

                  // Actualizar en la base de datos
                  await api.post("/configuracion/cambiarnotificaciones", {
                    id: configId,
                    permitir_notificaciones: true,
                  })

                  console.log("Notificaciones activadas en la base de datos")

                  // Actualizar la configuración en el objeto de usuario
                  const currentUser = await UserService.getCurrentUser()
                  if (currentUser) {
                    // Crear un objeto de actualización seguro
                    const updateData: any = {}
                    
                    // Si configuracion es un objeto, actualizamos solo la propiedad permitir_notificaciones
                    if (typeof currentUser.configuracion === "object" && currentUser.configuracion !== null) {
                      updateData.configuracion = {
                        ...currentUser.configuracion,
                        permitir_notificaciones: true
                      }
                    } else if (directConfig) {
                      // Si configuracion es un ID o no existe, usamos el objeto completo
                      updateData.configuracion = {
                        ...directConfig,
                        permitir_notificaciones: true
                      }
                    }
                    
                    await UserService.updateUserData(updateData)
                    console.log(
                      "Configuración actualizada en el objeto de usuario:",
                      JSON.stringify(updateData.configuracion),
                    )
                  }

                  // Forzar actualización desde la base de datos para futuras consultas
                  await AsyncStorage.setItem(FORCE_DB_REFRESH, "true")

                  // Mostrar mensaje de éxito
                  Alert.alert("Notificaciones Activadas", "Ahora recibirás notificaciones de PlayPoint.")
                } catch (error) {
                  // Silenciar errores específicos sobre projectId
                  if (error instanceof Error && !error.message.includes('No "projectId" found')) {
                    console.error("Error al activar notificaciones:", error)
                    Alert.alert("Error", "No se pudieron activar las notificaciones. Inténtalo de nuevo.")
                  } else {
                    // Si es el error de projectId, activar las notificaciones de todos modos
                    // ya que las notificaciones locales seguirán funcionando
                    setReceiveNotifications(true)
                    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "granted")
                    Alert.alert("Notificaciones Activadas", "Ahora recibirás notificaciones de PlayPoint.")
                  }
                } finally {
                  setLoading(false)
                }
              },
            },
          ],
          { cancelable: false },
        )
      } else {
        // Usuario quiere desactivar notificaciones
        Alert.alert(
          "Desactivar Notificaciones",
          "¿Estás seguro de que quieres desactivar las notificaciones? No recibirás alertas sobre tus actividades, mensajes o quedadas.",
          [
            {
              text: "Cancelar",
              style: "cancel",
              onPress: () => {
                // Usuario canceló, mantener notificaciones activadas
                setReceiveNotifications(true)
                setLoading(false)
              },
            },
            {
              text: "Desactivar",
              onPress: async () => {
                try {
                  // Actualizar estado local PRIMERO para respuesta inmediata en la UI
                  setReceiveNotifications(false)
                  await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "denied")

                  // Obtener la configuración del usuario directamente de la base de datos
                  const directConfig = await getDirectConfigFromDatabase()
                  const configId = directConfig ? directConfig.id : null

                  if (!configId) {
                    console.error("No se pudo obtener ID de configuración")
                    setLoading(false)
                    return
                  }

                  // Obtener instancia autenticada de axios
                  const api = await UserService.getAuthenticatedAxios()

                  // Actualizar en la base de datos
                  await api.post("/configuracion/cambiarnotificaciones", {
                    id: configId,
                    permitir_notificaciones: false,
                  })

                  console.log("Notificaciones desactivadas en la base de datos")

                  // Actualizar la configuración en el objeto de usuario
                  const currentUser = await UserService.getCurrentUser()
                  if (currentUser) {
                    // Crear un objeto de actualización seguro
                    const updateData: any = {}
                    
                    // Si configuracion es un objeto, actualizamos solo la propiedad permitir_notificaciones
                    if (typeof currentUser.configuracion === "object" && currentUser.configuracion !== null) {
                      updateData.configuracion = {
                        ...currentUser.configuracion,
                        permitir_notificaciones: false
                      }
                    } else if (directConfig) {
                      // Si configuracion es un ID o no existe, usamos el objeto completo
                      updateData.configuracion = {
                        ...directConfig,
                        permitir_notificaciones: false
                      }
                    }
                    
                    await UserService.updateUserData(updateData)
                    console.log(
                      "Configuración actualizada en el objeto de usuario:",
                      JSON.stringify(updateData.configuracion),
                    )
                  }

                  // Forzar actualización desde la base de datos para futuras consultas
                  await AsyncStorage.setItem(FORCE_DB_REFRESH, "true")

                  // Mostrar confirmación
                  Alert.alert(
                    "Notificaciones Desactivadas",
                    "No recibirás notificaciones de PlayPoint. Puedes reactivarlas en cualquier momento desde esta pantalla.",
                  )
                } catch (error) {
                  console.error("Error al desactivar notificaciones:", error)
                  Alert.alert("Error", "No se pudieron desactivar las notificaciones. Inténtalo de nuevo.")

                  // Revertir el cambio local en caso de error
                  setReceiveNotifications(true)
                  await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "granted")
                } finally {
                  setLoading(false)
                }
              },
            },
          ],
          { cancelable: false },
        )
      }
    } catch (error) {
      console.error("Error al cambiar notificaciones:", error)
      Alert.alert("Error", "Hubo un problema al actualizar la configuración de notificaciones.")
      setLoading(false)
    }
  }

  // Función para enviar una notificación push de prueba
  const sendTestNotification = async () => {
    if (!receiveNotifications) {
      Alert.alert("Notificaciones Desactivadas", "Por favor, activa las notificaciones primero para recibir la prueba.")
      return
    }

    try {
      setLoading(true)

      // Verificar permisos directamente en la base de datos
      const directConfig = await getDirectConfigFromDatabase()

      if (!directConfig || !directConfig.permitir_notificaciones) {
        console.log("Verificación en base de datos: notificaciones desactivadas")

        // Si la base de datos dice que están desactivadas pero la UI dice que están activadas,
        // hay una inconsistencia que debemos corregir
        if (receiveNotifications) {
          console.log("Inconsistencia detectada: UI muestra notificaciones activadas pero en BD están desactivadas")
          console.log("Actualizando UI para reflejar el estado real...")
          setReceiveNotifications(false)
          await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, "denied")
          Alert.alert(
            "Notificaciones Desactivadas",
            "Las notificaciones están desactivadas en tu cuenta. Por favor, actívalas primero.",
          )
          setLoading(false)
          return
        }

        Alert.alert("Error", "Las notificaciones no están habilitadas en tu cuenta.")
        setLoading(false)
        return
      }

      console.log("Verificación en base de datos: notificaciones activadas ✅")

      // Enviar notificación local (aparecerá en el teléfono y sonará)
      await NotificationsExpo.scheduleNotificationAsync({
        content: {
          title: "PlayPoint",
          body: "¡Esta es una notificación de prueba de PlayPoint! Tus notificaciones están funcionando correctamente.",
          sound: true, // Reproducir sonido
          badge: 1, // Mostrar badge en el icono de la app
        },
        trigger: null, // Mostrar inmediatamente
      })

      // Simular tiempo de procesamiento
      setTimeout(() => {
        setLoading(false)
        console.log("Notificación de prueba enviada correctamente")
      }, 1000)
    } catch (error) {
      console.error("Error al enviar notificación de prueba:", error)
      setLoading(false)
      Alert.alert("Error", "No se pudo enviar la notificación de prueba. Inténtalo de nuevo.")
    }
  }

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../../assets/Inter_18pt-SemiBold.ttf"),
  })

  if (!fontsLoaded) {
    return <View style={isDark ? styles.containerDark : styles.container} />
  }

  return (
    <SafeAreaView style={isDark ? styles.containerDark : styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      <SecondaryPageHeader text={"Notificaciones"} isDark={isDark}></SecondaryPageHeader>

      <View style={isDark ? styles.contentDark : styles.content}>
        {/* Description */}
        <Text style={isDark ? styles.descriptionDark : styles.description}>
          Activa o desactiva las notificaciones push de PlayPoint. Cuando están activadas, recibirás alertas en tu
          dispositivo sobre tus actividades, mensajes y quedadas, incluso cuando la aplicación esté cerrada.
        </Text>

        {/* Notification Toggle */}
        <View style={isDark ? styles.settingRowDark : styles.settingRow}>
          <Text style={isDark ? styles.settingLabelDark : styles.settingLabel}>Recibir Notificaciones</Text>
          {loading ? (
            <ActivityIndicator size="small" color={isDark ? "#4CAF50" : "#006400"} />
          ) : (
            <Switch
              trackColor={{ false: isDark ? "#555" : "#D9D9D9", true: isDark ? "#2E7D32" : "#006400" }}
              thumbColor={"#FFFFFF"}
              ios_backgroundColor={isDark ? "#555" : "#D9D9D9"}
              onValueChange={toggleNotifications}
              value={receiveNotifications}
            />
          )}
        </View>

        {/* Additional Info */}
        <Text style={isDark ? styles.infoTextDark : styles.infoText}>
          {receiveNotifications
            ? "Recibirás notificaciones push en tiempo real cuando la aplicación esté cerrada. Esto incluye mensajes nuevos, actualizaciones de quedadas y otras alertas importantes."
            : "No recibirás notificaciones push de la aplicación. Activa las notificaciones para mantenerte informado incluso cuando la aplicación esté cerrada."}
        </Text>

        {/* Test notification button */}
        {receiveNotifications && (
          <TouchableOpacity
            style={isDark ? styles.testButtonDark : styles.testButton}
            onPress={sendTestNotification}
            disabled={loading}
          >
            <Text style={styles.testButtonText}>{loading ? "Enviando..." : "Enviar Notificación de Prueba"}</Text>
          </TouchableOpacity>
        )}

        {/* Permission explanation */}
        <View style={isDark ? styles.permissionInfoDark : styles.permissionInfo}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={isDark ? "#aaa" : "#666"}
            style={styles.infoIcon}
          />
          <Text style={isDark ? styles.permissionTextDark : styles.permissionText}>
            {Platform.OS === "ios"
              ? "En iOS, es posible que también debas activar las notificaciones en la configuración de tu dispositivo si las has denegado anteriormente."
              : "En Android, las notificaciones están activadas por defecto. Puedes gestionar la configuración de notificaciones en los ajustes de tu dispositivo."}
          </Text>
        </View>
      </View>
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
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 16
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    textAlign: "center",
  },
  headerTitleDark: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentDark: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    marginBottom: 16,
  },
  titleDark: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#4CAF50",
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#333",
    marginBottom: 24,
  },
  descriptionDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#e0e0e0",
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF1F5",
  },
  settingRowDark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#333",
  },
  settingLabelDark: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: "#e0e0e0",
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666",
    marginTop: 16,
  },
  infoTextDark: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#aaa",
    marginTop: 16,
  },
  testButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 24,
  },
  testButtonDark: {
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 24,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  permissionInfo: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginTop: 24,
    alignItems: "flex-start",
  },
  permissionInfoDark: {
    flexDirection: "row",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 12,
    marginTop: 24,
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  permissionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#666",
  },
  permissionTextDark: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#aaa",
  },
  headerPlaceholder: {
    width: 32,
    height: 32,
  },
})

export default Notifications
