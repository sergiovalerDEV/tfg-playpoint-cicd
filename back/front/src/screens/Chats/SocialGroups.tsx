"use client"

import type { StackScreenProps } from "@react-navigation/stack"
import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native"
import type { RootParamList } from "../../navigation/RootParamList"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import SocialGroupsService from "../../services/Chats/SocialGroupsService"
import CreateGroupModal from "../../components/modals/CreateGroupModal"
import UserService from "../../services/User/UserService"
import { useGroups } from "../../contexts/GroupsContext"
import type { Grupo } from "../../models/Group"
import SocialGroupsHeader from "../../components/headers/SocialGroupsHeader"
import { useTheme } from "../../contexts/ThemeContext"

type Props = StackScreenProps<RootParamList, "SocialGroups">

const SocialGroups: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const { grupos, setGrupos } = useGroups()
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const userRef = useRef<any>(null)
  const unsubscribeRef = useRef<() => void>(() => {})
  const processedGroupIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const checkAuthAndLoadGroups = async () => {
      try {
        const isLoggedIn = await UserService.isLoggedIn()

        if (!isLoggedIn) {
          navigation.navigate("Login")
          return
        }

        const user = await UserService.getCurrentUser()
        userRef.current = user
        console.log("Usuario actual:", user)

        await fetchGrupos()

        setConnectionStatus("connecting")
        await setupGroupWebSocket(user.id)
      } catch (error) {
        console.error("Error in initial load:", error)
        setConnectionStatus("disconnected")
      }
    }
    checkAuthAndLoadGroups()

    return () => {
      unsubscribeRef.current()

      if (connectionStatus === "connected") {
        SocialGroupsService.unregisterFromGroupUpdates().catch(console.error)
      }
    }
  }, [navigation])

  const setupGroupWebSocket = async (userId: number) => {
    try {
      console.log("Configurando WebSocket para grupos...")

      const registered = await SocialGroupsService.registerForGroupUpdates(userId)
      if (registered) {
        setConnectionStatus("connected")
        console.log("Registrado para actualizaciones de grupos")
      } else {
        setConnectionStatus("disconnected")
        console.error("No se pudo registrar para actualizaciones de grupos")
      }

      const unsubscribe = await SocialGroupsService.subscribeToGroupUpdates(
        handleNewGroup,
        handleUpdatedGroup,
        handleDeletedGroup,
      )

      unsubscribeRef.current = unsubscribe
      console.log("Suscrito a eventos de grupos")
    } catch (error) {
      console.error("Error configurando WebSocket de grupos:", error)
      setConnectionStatus("disconnected")
    }
  }

  // Manejadores de eventos WebSocket
  const handleNewGroup = useCallback(
    (nuevoGrupo: Grupo) => {
      console.log("Nuevo grupo recibido:", nuevoGrupo)

      // Verificar si ya tenemos este grupo
      if (!processedGroupIdsRef.current.has(String(nuevoGrupo.id))) {
        // Añadir el ID al conjunto de grupos procesados
        processedGroupIdsRef.current.add(String(nuevoGrupo.id))

        // Usar userRef.current para acceso inmediato al usuario
        const user = userRef.current

        // Verificar si el usuario actual pertenece a este grupo
        const userInGroup =
          nuevoGrupo.usuariogrupo &&
          nuevoGrupo.usuariogrupo.some((ug: any) => {
            console.log("Verificando usuario en grupo:", ug.usuario?.id, "vs", user?.id)
            return ug.usuario && String(ug.usuario.id) === String(user?.id)
          })

        console.log("¿Usuario en grupo?", userInGroup, "ID usuario:", user?.id)

        if (userInGroup) {
          // Añadir el grupo a la lista
          setGrupos((prevGrupos) => {
            // Verificar si el grupo ya existe en la lista
            const exists = prevGrupos.some((g) => String(g.id) === String(nuevoGrupo.id))
            if (exists) {
              console.log("El grupo ya existe en la lista, no se añade")
              return prevGrupos
            }
            console.log("Añadiendo nuevo grupo a la lista:", nuevoGrupo.nombre)
            return [...prevGrupos, nuevoGrupo]
          })
        } else {
          console.log("El usuario no pertenece a este grupo, no se añade a la lista")
        }
      } else {
        console.log("Grupo ya procesado, ignorando")
      }
    },
    [], // Eliminamos la dependencia de currentUser
  )

  const handleUpdatedGroup = useCallback(
    (grupoActualizado: Grupo) => {
      console.log("Grupo actualizado recibido:", grupoActualizado)

      // Usar userRef.current para acceso inmediato al usuario
      const user = userRef.current

      // Verificar si el usuario actual pertenece a este grupo
      const userInGroup =
        grupoActualizado.usuariogrupo &&
        grupoActualizado.usuariogrupo.some((ug: any) => {
          return ug.usuario && String(ug.usuario.id) === String(user?.id)
        })

      console.log("¿Usuario en grupo actualizado?", userInGroup)

      if (userInGroup) {
        // Actualizar el grupo en la lista
        setGrupos((prevGrupos) => {
          // Si el grupo ya existe, actualizarlo
          if (prevGrupos.some((g) => String(g.id) === String(grupoActualizado.id))) {
            console.log("Actualizando grupo existente:", grupoActualizado.nombre)
            return prevGrupos.map((grupo) =>
              String(grupo.id) === String(grupoActualizado.id) ? grupoActualizado : grupo,
            )
          }
          // Si el grupo no existe pero el usuario pertenece a él, añadirlo
          else {
            console.log("Añadiendo grupo actualizado que no existía:", grupoActualizado.nombre)
            return [...prevGrupos, grupoActualizado]
          }
        })
      } else {
        // Si el usuario ya no pertenece al grupo, eliminarlo de la lista
        console.log("El usuario ya no pertenece al grupo, eliminándolo de la lista")
        setGrupos((prevGrupos) => prevGrupos.filter((grupo) => String(grupo.id) !== String(grupoActualizado.id)))
      }
    },
    [], // Eliminamos la dependencia de currentUser
  )

  const handleDeletedGroup = useCallback((grupoId: string) => {
    console.log("Eliminación de grupo recibida:", grupoId)

    // Eliminar el grupo de la lista
    setGrupos((prevGrupos) => prevGrupos.filter((grupo) => String(grupo.id) !== String(grupoId)))

    // Eliminar el ID del conjunto de grupos procesados
    processedGroupIdsRef.current.delete(grupoId)
  }, [])

  const fetchGrupos = async () => {
    setIsLoading(true)
    try {
      // Usar el usuario de la referencia si está disponible, o obtenerlo de nuevo
      const user = userRef.current || (await UserService.getCurrentUser())
      if (!userRef.current) {
        userRef.current = user
      }

      console.log("Obteniendo grupos para usuario:", user.id)
      const data = await SocialGroupsService.groups(user)

      // Reiniciar el conjunto de grupos procesados
      processedGroupIdsRef.current = new Set()

      // Actualizar el conjunto de grupos procesados con todos los grupos actuales
      data.forEach((grupo: Grupo) => {
        processedGroupIdsRef.current.add(String(grupo.id))
      })

      console.log("Grupos obtenidos:", data.length)
      setGrupos(data)
    } catch (error) {
      console.error("Error fetching grupos:", error)
      Alert.alert("Error", "No se pudieron cargar los grupos. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para recargar manualmente los grupos
  const handleRefresh = async () => {
    try {
      console.log("Recargando grupos manualmente...")
      await fetchGrupos()

      // Reconectar WebSocket si es necesario
      if (connectionStatus !== "connected" && userRef.current) {
        console.log("Reconectando WebSocket...")
        await setupGroupWebSocket(userRef.current.id)
      }

      Alert.alert("Éxito", "Grupos actualizados correctamente")
    } catch (error) {
      console.error("Error al recargar grupos:", error)
      Alert.alert("Error", "No se pudieron recargar los grupos. Inténtalo de nuevo.")
    }
  }

  // Filtrar grupos por búsqueda
  const filteredGroups = searchQuery
    ? grupos.filter(
        (grupo) =>
          grupo.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grupo.descripcion.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : grupos

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Función para manejar la creación de un grupo
  const handleGroupCreated = async (newGroup: Grupo) => {
    console.log("Grupo creado, actualizando lista manualmente:", newGroup)

    // Usar userRef.current para acceso inmediato al usuario
    const user = userRef.current

    // Verificar si el usuario actual pertenece a este grupo
    const userInGroup =
      newGroup.usuariogrupo &&
      newGroup.usuariogrupo.some((ug: any) => {
        return ug.usuario && String(ug.usuario.id) === String(user?.id)
      })

    if (userInGroup) {
      // Añadir el grupo a la lista manualmente
      processedGroupIdsRef.current.add(String(newGroup.id))
      setGrupos((prevGrupos) => {
        // Verificar si el grupo ya existe en la lista
        const exists = prevGrupos.some((g) => String(g.id) === String(newGroup.id))
        if (exists) {
          return prevGrupos
        }
        return [...prevGrupos, newGroup]
      })
    }
  }

  if (!fontsLoaded) {
    return <View style={styles.container} />
  }

  return (
    <SafeAreaView style={[styles.container, isDark ? stylesDark.container : stylesLight.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      <SocialGroupsHeader
        connectionStatus={connectionStatus}
        handleRefresh={handleRefresh}
        isDark={isDark}
      ></SocialGroupsHeader>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isDark ? stylesDark.searchContainer : stylesLight.searchContainer]}>
        <TextInput
          style={[styles.searchInput, isDark ? stylesDark.searchInput : stylesLight.searchInput]}
          placeholder="Buscar"
          placeholderTextColor={isDark ? "#8A8A8A" : "#999"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchIcon}>
          <Ionicons
            name="search"
            size={20}
            color={isDark ? stylesDark.searchIcon.color : stylesLight.searchIcon.color}
          />
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? "#4CAF50" : "#006400"} />
          <Text style={[styles.loadingText, isDark ? stylesDark.loadingText : stylesLight.loadingText]}>
            Cargando grupos...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => "" + item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.groupItem, isDark ? stylesDark.groupItem : stylesLight.groupItem]}
              onPress={() => navigation.navigate("Chat", { grupo: item })}
            >
              {item.imagen ? (
                <Image source={{ uri: item.imagen }} style={styles.groupAvatar} />
              ) : (
                <View
                  style={[
                    styles.groupAvatarPlaceholder,
                    isDark ? stylesDark.groupAvatarPlaceholder : stylesLight.groupAvatarPlaceholder,
                  ]}
                >
                  <Text
                    style={[styles.groupAvatarText, isDark ? stylesDark.groupAvatarText : stylesLight.groupAvatarText]}
                  >
                    {item.nombre.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, isDark ? stylesDark.groupName : stylesLight.groupName]}>
                  {item.nombre}
                </Text>
                <Text
                  style={[styles.groupDescription, isDark ? stylesDark.groupDescription : stylesLight.groupDescription]}
                >
                  {item.descripcion || "Sin descripción"}
                </Text>
                <Text style={[styles.groupMembers, isDark ? stylesDark.groupMembers : stylesLight.groupMembers]}>
                  {item.usuariogrupo?.length || 0} miembros
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.groupsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={48} color={isDark ? "#555" : "#ccc"} />
              <Text style={[styles.emptyText, isDark ? stylesDark.emptyText : stylesLight.emptyText]}>
                {searchQuery
                  ? "No se encontraron grupos que coincidan con tu búsqueda"
                  : "No perteneces a ningún grupo todavía"}
              </Text>
              <TouchableOpacity
                style={[
                  styles.createGroupButton,
                  isDark ? stylesDark.createGroupButton : stylesLight.createGroupButton,
                ]}
                onPress={() => setIsCreateModalVisible(true)}
              >
                <Text
                  style={[
                    styles.createGroupButtonText,
                    isDark ? stylesDark.createGroupButtonText : stylesLight.createGroupButtonText,
                  ]}
                >
                  Crear un grupo
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Group Button */}
      <TouchableOpacity
        style={[styles.addButton, isDark ? stylesDark.addButton : stylesLight.addButton]}
        onPress={() => setIsCreateModalVisible(true)}
      >
        <Ionicons
          name="add"
          size={24}
          color={isDark ? stylesDark.addButtonIcon.color : stylesLight.addButtonIcon.color}
        />
      </TouchableOpacity>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onGroupCreated={handleGroupCreated}
      />
    </SafeAreaView>
  )
}

// Estilos generales (compartidos entre ambos temas)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  searchIcon: {
    padding: 4,
  },
  groupsList: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  groupAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  groupAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontFamily: "Inter-Regular",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    textAlign: "center",
    fontFamily: "Inter-Regular",
    fontSize: 14,
  },
  createGroupButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createGroupButtonText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
})

// Estilos para modo claro
const stylesLight = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  searchContainer: {
    backgroundColor: "#f0f0f0",
  },
  searchInput: {
    color: "#333",
  },
  searchIcon: {
    color: "#777",
  },
  groupItem: {
    borderBottomColor: "#f0f0f0",
  },
  groupAvatarPlaceholder: {
    backgroundColor: "#e0f0e0",
  },
  groupAvatarText: {
    color: "#006400",
  },
  groupName: {
    color: "#006400",
  },
  groupDescription: {
    color: "#999",
  },
  groupMembers: {
    color: "#666",
  },
  addButton: {
    backgroundColor: "#e0f0e0",
  },
  addButtonIcon: {
    color: "#006400",
  },
  loadingText: {
    color: "#666",
  },
  emptyText: {
    color: "#666",
  },
  createGroupButton: {
    backgroundColor: "#006400",
  },
  createGroupButtonText: {
    color: "#fff",
  },
})

// Estilos para modo oscuro
const stylesDark = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  searchContainer: {
    backgroundColor: "#2A2A2A",
  },
  searchInput: {
    color: "#E0E0E0",
  },
  searchIcon: {
    color: "#8A8A8A",
  },
  groupItem: {
    borderBottomColor: "#2A2A2A",
  },
  groupAvatarPlaceholder: {
    backgroundColor: "#2E7D32",
  },
  groupAvatarText: {
    color: "#E0E0E0",
  },
  groupName: {
    color: "#4CAF50",
  },
  groupDescription: {
    color: "#8A8A8A",
  },
  groupMembers: {
    color: "#AAA",
  },
  addButton: {
    backgroundColor: "#2E7D32",
  },
  addButtonIcon: {
    color: "#E0E0E0",
  },
  loadingText: {
    color: "#AAA",
  },
  emptyText: {
    color: "#AAA",
  },
  createGroupButton: {
    backgroundColor: "#2E7D32",
  },
  createGroupButtonText: {
    color: "#FFFFFF",
  },
})

export default SocialGroups
