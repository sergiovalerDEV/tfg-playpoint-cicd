"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import SocialGroupsService from "../../services/Chats/SocialGroupsService"
import UserService from "../../services/User/UserService"
import UsuarioGrupoService from "../../services/Components/UserSearchModalService"
import { Grupo } from "../../models/Group"

interface Usuario {
  id: string
  nombre: string
  correo: string
  avatar?: string
}

interface CreateGroupModalProps {
  visible: boolean
  onClose: () => void
  onGroupCreated: (newGroup: Grupo) => Promise<void>
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ visible, onClose, onGroupCreated }) => {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [searchText, setSearchText] = useState("")
  const [searchResults, setSearchResults] = useState<Usuario[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null)

  // Cargar el usuario actual cuando se abre el modal
  useEffect(() => {
    if (visible) {
      loadCurrentUser()
    }
  }, [visible])

  // Cargar el usuario actual
  const loadCurrentUser = async () => {
    try {
      const user = await UserService.getCurrentUser()
      if (user) {
        console.log("Usuario actual cargado:", user.id)
        const currentUserData = {
          id: String(user.id),
          nombre: user.nombre,
          correo: user.correo,
          avatar: user.foto_perfil,
        }
        setCurrentUser(currentUserData)

        // Añadir al usuario actual a la lista de seleccionados si no está ya
        setSelectedUsers((prev) => {
          if (prev.some((u) => String(u.id) === String(user.id))) {
            return prev
          }
          return [currentUserData, ...prev]
        })
      }
    } catch (error) {
      console.error("Error al cargar el usuario actual:", error)
    }
  }

  // Resetear el estado cuando se cierra el modal
  useEffect(() => {
    if (!visible) {
      setNombre("")
      setDescripcion("")
      setSearchText("")
      setSearchResults([])
      setSelectedUsers([])
    }
  }, [visible])

  const handleSearch = async () => {
    if (!searchText.trim()) return

    setIsSearching(true)
    try {
      const results = await UsuarioGrupoService.buscarUsuarios(searchText.trim())
      console.log("Resultados de búsqueda:", results.length)
      setSearchResults(results)
    } catch (error) {
      console.error("Error en la búsqueda:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const isUserSelected = (userId: string) => {
    return selectedUsers.some((user) => String(user.id) === String(userId))
  }

  const handleAddUser = (user: Usuario) => {
    if (!isUserSelected(user.id)) {
      setSelectedUsers((prev) => [...prev, user])
    }
  }

  const handleRemoveUser = (userId: string) => {
    // No permitir eliminar al usuario actual
    if (currentUser && String(userId) === String(currentUser.id)) {
      Alert.alert("Aviso", "No puedes eliminarte a ti mismo del grupo")
      return
    }

    setSelectedUsers((prev) => prev.filter((user) => String(user.id) !== String(userId)))
  }

  const handleCreateGroup = async () => {
    // Validar formulario
    if (!nombre.trim()) {
      Alert.alert("Error", "El nombre del grupo es obligatorio")
      return
    }

    if (selectedUsers.length === 0) {
      Alert.alert("Error", "Debes añadir al menos un usuario al grupo")
      return
    }

    setIsCreating(true)
    try {
      // Extraer IDs de usuarios seleccionados
      const userIds = selectedUsers.map((user) => user.id)
      console.log("Creando grupo con usuarios:", userIds)

      // Llamar al servicio para crear el grupo
      const createdGroup = await SocialGroupsService.crearGrupo(nombre, descripcion, userIds)
      console.log("Grupo creado:", createdGroup)

      // Notificar éxito y cerrar el modal inmediatamente
      onGroupCreated()
      onClose()

      // Mostrar mensaje de éxito después de cerrar el modal
      setTimeout(() => {
        Alert.alert("Éxito", "Grupo creado correctamente")
      }, 300)
    } catch (error) {
      console.error("Error al crear grupo:", error)
      Alert.alert("Error", "No se pudo crear el grupo. Inténtalo de nuevo.")
    } finally {
      setIsCreating(false)
    }
  }

  const renderUserItem = ({ item }: { item: Usuario }) => {
    const isSelected = isUserSelected(item.id)
    const isCurrentUserItem = currentUser && String(item.id) === String(currentUser.id)

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.nombre.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.nombre} {isCurrentUserItem ? "(Tú)" : ""}
            </Text>
            <Text style={styles.userEmail}>{item.correo}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isSelected ? styles.removeButton : styles.addButton,
            isCurrentUserItem && styles.disabledButton,
          ]}
          onPress={() => (isSelected ? handleRemoveUser(item.id) : handleAddUser(item))}
          disabled={!!isLoading || !!isCurrentUserItem}
        >
          <Ionicons name={isSelected ? "person-remove" : "person-add"} size={16} color="#fff" />
          <Text style={styles.buttonText}>{isSelected ? "Quitar" : "Añadir"}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderSelectedUserItem = ({ item }: { item: Usuario }) => {
    const isCurrentUserItem = currentUser && String(item.id) === String(currentUser.id)

    return (
      <View style={styles.selectedUserItem}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.selectedUserAvatar} />
        ) : (
          <View style={styles.selectedUserAvatarPlaceholder}>
            <Text style={styles.selectedUserAvatarText}>{item.nombre.charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.selectedUserName} numberOfLines={1}>
          {item.nombre} {isCurrentUserItem ? "(Tú)" : ""}
        </Text>
        {!isCurrentUserItem && (
          <TouchableOpacity style={styles.removeSelectedUserButton} onPress={() => handleRemoveUser(item.id)}>
            <Ionicons name="close-circle" size={18} color="#d32f2f" />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear nuevo grupo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Formulario */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del grupo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa el nombre del grupo"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ingresa una descripción para el grupo"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Usuarios seleccionados */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Usuarios seleccionados ({selectedUsers.length})</Text>
              {selectedUsers.length > 0 ? (
                <FlatList
                  data={selectedUsers}
                  renderItem={renderSelectedUserItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedUsersList}
                />
              ) : (
                <Text style={styles.emptyText}>No hay usuarios seleccionados</Text>
              )}
            </View>

            {/* Búsqueda de usuarios */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Añadir usuarios</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar usuarios..."
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="search" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Resultados de búsqueda */}
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#006400" />
                <Text style={styles.loadingText}>Buscando usuarios...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <View style={styles.searchResultsContainer}>
                <Text style={styles.searchResultsTitle}>Resultados de búsqueda</Text>
                <FlatList
                  data={searchResults}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  nestedScrollEnabled={true}
                />
              </View>
            ) : searchText ? (
              <Text style={styles.emptyText}>No se encontraron resultados</Text>
            ) : null}
          </ScrollView>

          {/* Botón de crear */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup} disabled={isCreating}>
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>Crear grupo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#006400",
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#006400",
    justifyContent: "center",
    alignItems: "center",
  },
  searchResultsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#006400",
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: "#006400",
  },
  removeButton: {
    backgroundColor: "#d32f2f",
  },
  disabledButton: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 12,
  },
  selectedUsersList: {
    paddingVertical: 8,
  },
  selectedUserItem: {
    alignItems: "center",
    marginRight: 12,
    width: 70,
  },
  selectedUserAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  selectedUserAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedUserAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#555",
  },
  selectedUserName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  removeSelectedUserButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  createButton: {
    backgroundColor: "#006400",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  emptyText: {
    padding: 12,
    textAlign: "center",
    color: "#666",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
})

export default CreateGroupModal
