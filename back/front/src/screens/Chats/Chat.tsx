"use client"

import type { StackScreenProps } from "@react-navigation/stack"
import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native"
import type { RootParamList } from "../../navigation/RootParamList"
import { Ionicons } from "@expo/vector-icons"
import { useFonts } from "expo-font"
import ChatService from "../../services/Chats/ChatService"
import UserService from "../../services/User/UserService"
import UserSearchModal from "../../components/modals/UserSearchModal"
import GroupDetailsModal from "../../components/modals/GroupDetailsModal"
import * as ImagePicker from "expo-image-picker"
import { Dimensions } from "react-native"
import { useGroups } from "../../contexts/GroupsContext"
import { Grupo } from "../../models/Group"
import Mensaje from "../../models/Message"
import ChatHeader from "../../components/headers/ChatHeader"
import { useTheme } from "../../contexts/ThemeContext"

type Props = StackScreenProps<RootParamList, "Chat">

const Chat: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const { grupos, setGrupos } = useGroups();

  const [message, setMessage] = useState("")
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hayMasMensajes, setHayMasMensajes] = useState(false)
  const [currentSkip, setCurrentSkip] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isUserModalVisible, setIsUserModalVisible] = useState(false)
  const [isGroupDetailsModalVisible, setIsGroupDetailsModalVisible] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)
  const processedMessageIdsRef = useRef<Set<string>>(new Set())
  const unsubscribeRef = useRef<() => void>(() => {})
  const [grupoActualizado, setGrupoActualizado] = useState(route.params.grupo)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const screenWidth = Dimensions.get("window").width
  const unsubscribeGroupUpdatesRef = useRef<() => void>(() => {})

  const grupo = grupos.find((grupo: any) => grupo.id === route.params?.grupo.id)

  const chatData: Grupo = grupo ||
  {
    id: 0,
      imagen: '',
      nombre: '',
      descripcion: '',
      usuariogrupo: [
        {
          id: 0,
          usuario: {
            id: 0,
            foto_perfil: '',
            nombre: '',
            correo: '',
            contrasena: '',
            numero_telefono: 0,
            puntuacion_competitiva: 0,
            premium: false
          }
        }
    ]}

  // Función para manejar nuevos mensajes recibidos por WebSocket
  const handleNewMessage = useCallback((nuevoMensaje: Mensaje) => {
    console.log("Nuevo mensaje recibido:", nuevoMensaje)

    // Verificar si ya tenemos este mensaje
    if (!processedMessageIdsRef.current.has(String(nuevoMensaje.id))) {
      // Añadir el ID al conjunto de mensajes procesados
      processedMessageIdsRef.current.add(String(nuevoMensaje.id))

      // Añadir el mensaje a la lista
      setMensajes((prevMensajes) => [...prevMensajes, nuevoMensaje])

      // Hacer scroll al final para mostrar el nuevo mensaje
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [])

  // Configurar WebSocket y cargar mensajes iniciales
  useEffect(() => {
    console.log("Mis grupos son", grupos[0].usuariogrupo)

    let isMounted = true

    const setupChat = async () => {
      try {
        // Check if user is logged in using UserService
        const isLoggedIn = await UserService.isLoggedIn()
        if (!isLoggedIn) {
          // Redirect to login if not authenticated
          navigation.navigate("Login")
          return
        }

        // Obtener el usuario actual
        const user = await UserService.getCurrentUser()
        if (isMounted) {
          setCurrentUser(user)
        }
        console.log("current_user", user?.id)

        // Cargar mensajes iniciales
        await fetchMensajes()

        // Conectar WebSocket y unirse a la sala
        if (user && route.params.grupo) {
          const joined = await ChatService.joinChatRoom(user.id, route.params.grupo.id)
          if (joined && isMounted) {
            setIsConnected(true)
            console.log("Conectado a la sala de chat")
          }
        }

        // Suscribirse a nuevos mensajes
        const unsubscribe = await ChatService.subscribeToNewMessages(handleNewMessage)
        unsubscribeRef.current = unsubscribe
      } catch (error) {
        console.error("Error configurando el chat:", error)
        Alert.alert("Error", "No se pudo conectar al chat. Inténtalo de nuevo.")
      }
    }

    setupChat()

    // Limpiar al desmontar
    return () => {
      isMounted = false
      // Salir de la sala y cancelar suscripción
      if (currentUser && route.params.grupo) {
        ChatService.leaveChatRoom(currentUser.id, route.params.grupo.id)
      }
      unsubscribeRef.current()
      unsubscribeGroupUpdatesRef.current()
    }
  }, [navigation, route.params.grupo, handleNewMessage])

  useEffect(() => {
    if (!currentUser) return

    console.log("USUARIOOOOO", currentUser, "GRUPOOOOOOOOOO", grupo?.usuariogrupo)
    if(grupo?.usuariogrupo && grupo?.usuariogrupo.some((ug: any) => {
      return ug.usuario && String(ug.usuario.id) === String(currentUser.id)
    })){
      console.log("SIIIIIIIIIII")
    } else {
      console.log("NOOOOOOOOOOO")
      console.log("El usuario ya no pertenece al grupo, redirigiendo...")
      Alert.alert("Grupo actualizado", "Ya no eres miembro de este grupo.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    }
  }, [currentUser, grupos])

  // Añadir este nuevo useEffect para manejar las actualizaciones de grupos
  // useEffect(() => {
  //   let isMounted = true

  //   const setupGroupUpdatesListener = async () => {
  //     try {
  //       if (!currentUser) return

  //       console.log("Configurando listener para actualizaciones de grupo...")

  //       // Suscribirse a actualizaciones de grupos
  //       const unsubscribe = await SocialGroupsService.subscribeToGroupUpdates(
  //         () => {}, // No necesitamos manejar nuevos grupos
  //         (grupoActualizado) => {
  //           // Solo nos interesa si es el grupo actual
  //           if (String(grupoActualizado.id) === String(route.params.grupo.id)) {
  //             console.log("Grupo actual actualizado:", grupoActualizado.nombre)

  //             // Verificar si el usuario actual sigue perteneciendo al grupo
  //             const userInGroup =
  //               grupoActualizado.usuariogrupo &&
  //               grupoActualizado.usuariogrupo.some((ug: any) => {
  //                 return ug.usuario && String(ug.usuario.id) === String(currentUser.id)
  //               })

  //             if (!userInGroup) {
  //               console.log("El usuario ya no pertenece al grupo, redirigiendo...")
  //               Alert.alert("Grupo actualizado", "Ya no eres miembro de este grupo.", [
  //                 { text: "OK", onPress: () => navigation.goBack() },
  //               ])
  //             } else {
  //               // Actualizar el grupo en el estado
  //               setGrupoActualizado(grupoActualizado)
  //             }
  //           }
  //         },
  //         () => {}, // No necesitamos manejar eliminaciones de grupos
  //       )

  //       if (isMounted) {
  //         unsubscribeGroupUpdatesRef.current = unsubscribe
  //         setIsSubscribedToGroupUpdates(true)
  //       }
  //     } catch (error) {
  //       console.error("Error configurando listener de actualizaciones de grupo:", error)
  //     }
  //   }

  //   setupGroupUpdatesListener()

  //   return () => {
  //     isMounted = false
  //     // Cancelar suscripción a actualizaciones de grupos
  //     unsubscribeGroupUpdatesRef.current()
  //   }
  // }, [currentUser, route.params.grupo.id])

  const fetchMensajes = async (loadMore = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true)
      }

      const skip = loadMore ? currentSkip + 5 : 0
      const take = 5

      console.log("Obteniendo mensajes del grupo:", route.params.grupo.id, "skip:", skip, "take:", take)
      const response = await ChatService.mensajes(route.params.grupo, skip, take)

      let newMensajes: Mensaje[] = []

      if (loadMore) {
        // Añadir los mensajes más antiguos al principio de la lista
        newMensajes = [...response.mensajes, ...mensajes]
      } else {
        newMensajes = response.mensajes

        // Reiniciar el conjunto de mensajes procesados
        processedMessageIdsRef.current = new Set()
      }

      // Actualizar el conjunto de mensajes procesados con todos los mensajes actuales
      newMensajes.forEach((msg) => {
        processedMessageIdsRef.current.add(String(msg.id))
      })

      // Actualizar el estado
      setMensajes(newMensajes)

      // Actualizar el estado con la información de paginación
      setCurrentSkip(skip)
      setHayMasMensajes(response.hayMas)

      console.log("mensajes obtenidos:", response.mensajes.length, "hayMas:", response.hayMas)
    } catch (error) {
      console.error("Error fetching mensajes:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const loadMoreMessages = () => {
    if (hayMasMensajes && !isLoadingMore) {
      fetchMensajes(true)
    }
  }

  // Load Inter font
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../../assets/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../../assets/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/Inter_18pt-SemiBold.ttf"),
  })

  // Scroll to bottom when messages change (only for new messages, not when loading more)
  useEffect(() => {
    if (!isLoadingMore && mensajes.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [mensajes, isLoadingMore])

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a tus fotos")
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo seleccionar la imagen")
    }
  }

  const sendMessage = async () => {
    if ((!message.trim() && !selectedImage) || !currentUser || isSending) return

    try {
      setIsSending(true)

      // Enviar mensaje al servidor
      await ChatService.enviarMensaje(message.trim(), currentUser, route.params.grupo, selectedImage || undefined)

      // Limpiar el campo de mensaje y la imagen seleccionada
      setMessage("")
      setSelectedImage(null)
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      Alert.alert("Error", "No se pudo enviar el mensaje. Inténtalo de nuevo.")
    } finally {
      setIsSending(false)
    }
  }

  // Formatear fecha y hora para mostrar
  const formatDateTime = (fecha: string, hora: string) => {
    hora = hora.split(":").slice(0, 2).join(":")
    return `${fecha} ${hora}`
  }

  const handleUserAdded = (usuarioGrupo: any) => {
    // Actualizar la lista local de usuarios del grupo
    setGrupoActualizado((prevGrupo) => {
      // Crear una copia profunda del grupo
      const grupoActualizado = JSON.parse(JSON.stringify(prevGrupo))

      // Añadir el nuevo usuario al grupo
      if (!grupoActualizado.usuariogrupo) {
        grupoActualizado.usuariogrupo = []
      }
      grupoActualizado.usuariogrupo.push(usuarioGrupo)

      return grupoActualizado
    })
  }

  const handleUserRemoved = (usuarioId: string) => {
    // Actualizar la lista local de usuarios del grupo
    setGrupoActualizado((prevGrupo) => {
      // Crear una copia profunda del grupo
      const grupoActualizado = JSON.parse(JSON.stringify(prevGrupo))

      // Filtrar el usuario eliminado
      if (grupoActualizado.usuariogrupo) {
        grupoActualizado.usuariogrupo = grupoActualizado.usuariogrupo.filter((ug: any) => ug.usuario.id !== usuarioId)
      }

      return grupoActualizado
    })
  }

  if (!fontsLoaded) {
    return <View style={styles.container} />
  }

  return (
    <SafeAreaView style={[styles.container, isDark ? stylesDark.container : stylesLight.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#fff"} />

      <ChatHeader 
        text={chatData.nombre} 
        setIsGroupDetailsModalVisible={setIsGroupDetailsModalVisible} 
        setIsUserModalVisible={setIsUserModalVisible} 
        isDark={isDark}
      />
      
      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={[styles.messagesContainer, isDark ? stylesDark.messagesContainer : stylesLight.messagesContainer]}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {mensajes.length === 0 && !isLoadingMore && (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Text style={isDark ? stylesDark.emptyMessageText : stylesLight.emptyMessageText}>
                Aún no hay mensajes. ¡Sé el primero en escribir!
              </Text>
            </View>
          )}

          {/* Botón para cargar más mensajes */}
          {hayMasMensajes && (
            <TouchableOpacity 
              style={[styles.loadMoreButton, isDark ? stylesDark.loadMoreButton : stylesLight.loadMoreButton]} 
              onPress={loadMoreMessages} 
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <ActivityIndicator size="small" color={isDark ? "#4CAF50" : "#006400"} />
              ) : (
                <Text style={[styles.loadMoreText, isDark ? stylesDark.loadMoreText : stylesLight.loadMoreText]}>
                  Cargar mensajes anteriores
                </Text>
              )}
            </TouchableOpacity>
          )}

          {mensajes.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                currentUser && msg.usuario.id === currentUser.id ? styles.myMessageRow : styles.otherMessageRow,
              ]}
            >
              {!(currentUser && msg.usuario.id === currentUser.id) && (
                <View style={styles.avatarContainer}>
                  {msg.usuario.foto_perfil ? (
                    <Image source={{ uri: msg.usuario.foto_perfil }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.defaultAvatar, isDark ? stylesDark.defaultAvatar : stylesLight.defaultAvatar]}>
                      <Text style={[styles.defaultAvatarText, isDark ? stylesDark.defaultAvatarText : stylesLight.defaultAvatarText]}>
                        {msg.usuario.nombre ? msg.usuario.nombre.charAt(0).toUpperCase() : "?"}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {!(currentUser && msg.usuario.id === currentUser.id) && msg.usuario.avatar && (
                <Image source={{ uri: msg.usuario.avatar }} style={styles.avatar} />
              )}
              <View
                style={[
                  styles.messageBubble,
                  currentUser && msg.usuario.id === currentUser.id 
                    ? [styles.myMessage, isDark ? stylesDark.myMessage : stylesLight.myMessage] 
                    : [styles.otherMessage, isDark ? stylesDark.otherMessage : stylesLight.otherMessage],
                ]}
              >
                {!(currentUser && msg.usuario.id === currentUser.id) && (
                  <Text style={[styles.senderName, isDark ? stylesDark.senderName : stylesLight.senderName]}>
                    {msg.usuario.nombre}
                  </Text>
                )}

                {/* Renderizar según el tipo de mensaje */}
                {!msg.tipomensaje || msg.tipomensaje.id === 1 ? (
                  // Mensaje de texto
                  <Text
                    style={[
                      styles.messageText,
                      currentUser && msg.usuario.id === currentUser.id 
                        ? [styles.myMessageText, isDark ? stylesDark.myMessageText : stylesLight.myMessageText]
                        : isDark ? stylesDark.messageText : stylesLight.messageText,
                    ]}
                  >
                    {msg.texto}
                  </Text>
                ) : msg.tipomensaje.id === 2 ? (
                  // Mensaje de imagen
                  <TouchableOpacity
                    onPress={() => {
                      // Aquí podrías implementar una vista ampliada de la imagen
                      console.log("Imagen presionada:", msg.texto)
                    }}
                  >
                    <Image
                      source={{ uri: msg.texto }}
                      style={[styles.messageImage, { width: screenWidth * 0.6, height: screenWidth * 0.4 }]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : (
                  // Tipo de mensaje desconocido
                  <Text
                    style={[
                      styles.messageText,
                      currentUser && msg.usuario.id === currentUser.id 
                        ? [styles.myMessageText, isDark ? stylesDark.myMessageText : stylesLight.myMessageText]
                        : isDark ? stylesDark.messageText : stylesLight.messageText,
                    ]}
                  >
                    {msg.texto}
                  </Text>
                )}

                <Text 
                  style={[
                    styles.timeText, 
                    currentUser && msg.usuario.id === currentUser.id 
                      ? [styles.myTimeText, isDark ? stylesDark.myTimeText : stylesLight.myTimeText]
                      : isDark ? stylesDark.timeText : stylesLight.timeText
                  ]}
                >
                  {formatDateTime(msg.fecha, msg.hora)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Message Input */}
        <View style={[styles.inputContainer, isDark ? stylesDark.inputContainer : stylesLight.inputContainer]}>
          {selectedImage && (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)}>
                <Ionicons name="close-circle" size={24} color={isDark ? "#FF5252" : "#d32f2f"} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.attachButton} 
              onPress={pickImage} 
              disabled={isSending}
            >
              <Ionicons 
                name="image-outline" 
                size={24} 
                color={isDark ? stylesDark.attachButton.color : stylesLight.attachButton.color} 
              />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, isDark ? stylesDark.input : stylesLight.input]}
              placeholder="Escribe tu mensaje"
              placeholderTextColor={isDark ? "#8A8A8A" : "#999"}
              value={message}
              onChangeText={setMessage}
              multiline
              editable={!isSending}
            />

            <TouchableOpacity
              style={[
                styles.sendButton, 
                isDark ? stylesDark.sendButton : stylesLight.sendButton,
                (isSending || (!message.trim() && !selectedImage)) && 
                  (isDark ? stylesDark.sendingButton : stylesLight.sendingButton)
              ]}
              onPress={sendMessage}
              disabled={isSending || (!message.trim() && !selectedImage)}
            >
              <Ionicons name={isSending ? "time-outline" : "arrow-up"} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de búsqueda de usuarios */}
      <UserSearchModal
        visible={isUserModalVisible}
        onClose={() => setIsUserModalVisible(false)}
        grupo={grupoActualizado}
        onUserAdded={handleUserAdded}
        onUserRemoved={handleUserRemoved}
      />

      {/* Modal de detalles del grupo */}
      <GroupDetailsModal
        visible={isGroupDetailsModalVisible}
        onClose={() => setIsGroupDetailsModalVisible(false)}
        grupo={grupo}
        onGroupUpdated={(updatedGroup) => setGrupoActualizado(updatedGroup)}
      />
    </SafeAreaView>
  )
}

// Estilos generales (compartidos entre ambos temas)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
  },
  addPersonButton: {
    padding: 4,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connected: {
    backgroundColor: "#4CAF50",
  },
  disconnected: {
    backgroundColor: "#F44336",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  myMessage: {
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontFamily: "Inter-Medium",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  timeText: {
    fontSize: 10,
    fontFamily: "Inter-Regular",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myTimeText: {
    color: "#e0e0e0",
  },
  inputContainer: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendingButton: {
    backgroundColor: "#999",
  },
  loadMoreButton: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loadMoreText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  messageImage: {
    borderRadius: 12,
    marginVertical: 4,
  },
  selectedImageContainer: {
    padding: 8,
    position: "relative",
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
})

// Estilos para modo claro
const stylesLight = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  messagesContainer: {
    backgroundColor: "#fff",
  },
  header: {
    borderBottomColor: "#eee",
  },
  headerTitle: {
    color: "#006400",
  },
  defaultAvatar: {
    backgroundColor: '#C0C0C0',
  },
  defaultAvatarText: {
    color: 'white',
  },
  myMessage: {
    backgroundColor: "#0A8A0A",
  },
  otherMessage: {
    backgroundColor: "#f0f0f0",
  },
  senderName: {
    color: "#555",
  },
  messageText: {
    color: "#333",
  },
  myMessageText: {
    color: "#fff",
  },
  timeText: {
    color: "#777",
  },
  myTimeText: {
    color: "#e0e0e0",
  },
  inputContainer: {
    borderTopColor: "#eee",
  },
  input: {
    backgroundColor: "#f0f0f0",
    color: "#333",
  },
  sendButton: {
    backgroundColor: "#006400",
  },
  sendingButton: {
    backgroundColor: "#999",
  },
  loadMoreButton: {
    backgroundColor: "transparent",
  },
  loadMoreText: {
    color: "#006400",
  },
  emptyMessageText: {
    color: "#777",
    fontFamily: "Inter-Regular",
    fontSize: 14,
  },
  attachButton: {
    color: "#006400",
  },
})

// Estilos para modo oscuro
const stylesDark = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  messagesContainer: {
    backgroundColor: "#121212",
  },
  header: {
    borderBottomColor: "#2A2A2A",
  },
  headerTitle: {
    color: "#4CAF50",
  },
  defaultAvatar: {
    backgroundColor: '#444',
  },
  defaultAvatarText: {
    color: '#E0E0E0',
  },
  myMessage: {
    backgroundColor: "#2E7D32",
  },
  otherMessage: {
    backgroundColor: "#2A2A2A",
  },
  senderName: {
    color: "#AAA",
  },
  messageText: {
    color: "#E0E0E0",
  },
  myMessageText: {
    color: "#fff",
  },
  timeText: {
    color: "#AAA",
  },
  myTimeText: {
    color: "#CCC",
  },
  inputContainer: {
    borderTopColor: "#2A2A2A",
  },
  input: {
    backgroundColor: "#2A2A2A",
    color: "#E0E0E0",
  },
  sendButton: {
    backgroundColor: "#2E7D32",
  },
  sendingButton: {
    backgroundColor: "#555",
  },
  loadMoreButton: {
    backgroundColor: "transparent",
  },
  loadMoreText: {
    color: "#4CAF50",
  },
  emptyMessageText: {
    color: "#AAA",
    fontFamily: "Inter-Regular",
    fontSize: 14,
  },
  attachButton: {
    color: "#4CAF50",
  },
})

export default Chat
