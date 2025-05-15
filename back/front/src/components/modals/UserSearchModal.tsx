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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import UsuarioGrupoService from "../../services/Components/UserSearchModalService"
import { Usuario } from "../../models/User"

interface UsuarioGrupo {
  id: string
  usuario: Usuario
  grupo: any
}

interface UserSearchModalProps {
  visible: boolean
  onClose: () => void
  grupo: any
  onUserAdded: (usuarioGrupo: UsuarioGrupo) => void
  onUserRemoved: (usuarioId: string) => void
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ visible, onClose, grupo, onUserAdded, onUserRemoved }) => {
  const [searchText, setSearchText] = useState("")
  const [searchResults, setSearchResults] = useState<Usuario[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showingGroupUsers, setShowingGroupUsers] = useState(true)
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());

  // Resetear los resultados de búsqueda cuando se cierra el modal
  useEffect(() => {
    if (!visible) {
      setSearchResults([])
      setSearchText("")
      setShowingGroupUsers(true)
    } else {
      // Cuando se abre el modal, mostrar los usuarios del grupo
      showGroupUsers()
    }
  }, [visible, grupo])

  // Función para mostrar los usuarios del grupo
  const showGroupUsers = () => {
    if (grupo && grupo.usuariogrupo && grupo.usuariogrupo.length > 0) {
      // Extraer los usuarios del grupo
      const usuariosDelGrupo = grupo.usuariogrupo.map((ug: UsuarioGrupo) => ug.usuario)
      setSearchResults(usuariosDelGrupo)
      setShowingGroupUsers(true)
    } else {
      setSearchResults([])
      setShowingGroupUsers(true)
    }
  }

  const handleSearch = async () => {
    if (!searchText.trim()) {
      // Si el campo de búsqueda está vacío, mostrar los usuarios del grupo
      showGroupUsers()
      return
    }

    setIsSearching(true)
    setShowingGroupUsers(false)
    try {
      const results = await UsuarioGrupoService.buscarUsuarios(searchText.trim())
      setSearchResults(results)
    } catch (error) {
      console.error("Error en la búsqueda:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Cuando el texto de búsqueda cambia a vacío, mostrar los usuarios del grupo
  useEffect(() => {
    if (searchText === "") {
      showGroupUsers()
    }
  }, [searchText])

  const isUserInGroup = (userId: string) => {
    return grupo.usuariogrupo.some((ug: UsuarioGrupo) => ug.usuario.id === userId)
  }

  const handleAddUser = async (user: Usuario) => {
    setLoadingUserIds((prev) => new Set(prev).add(user.id));
    try {
      const success = await UsuarioGrupoService.anadirUsuarioGrupo(user.id, grupo.id)
      if (success) {
        // Crear un nuevo objeto usuariogrupo para añadirlo localmente
        const newUsuarioGrupo: UsuarioGrupo = {
          id: `temp-${Date.now()}`, // ID temporal hasta que se actualice la vista
          usuario: user,
          grupo: grupo,
        }
        onUserAdded(newUsuarioGrupo)

        // Si estamos mostrando los usuarios del grupo, actualizar la lista
        if (showingGroupUsers) {
          showGroupUsers()
        }
      }
    } catch (error) {
      console.error("Error al añadir usuario:", error)
    } finally {
      setLoadingUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  }

  const handleRemoveUser = async (userId: string) => {
    setLoadingUserIds((prev) => new Set(prev).add(userId));
    try {
      const success = await UsuarioGrupoService.eliminarUsuarioGrupo(userId, grupo.id)
      if (success) {
        onUserRemoved(userId)

        // Si estamos mostrando los usuarios del grupo, actualizar la lista
        if (showingGroupUsers) {
          // Filtrar el usuario eliminado de los resultados actuales
          setSearchResults((prev) => prev.filter((user) => user.id !== userId))
        }
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
    } finally {
      setLoadingUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }

  const renderUserItem = ({ item }: { item: Usuario }) => {
    const inGroup = isUserInGroup(item.id);
    const isLoading = loadingUserIds.has(item.id);

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          {item.foto_perfil ? (
            <Image source={{ uri: item.foto_perfil }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.nombre.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.nombre}</Text>
            <Text style={styles.userEmail}>{item.correo}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, inGroup ? styles.removeButton : styles.addButton]}
          onPress={() => (inGroup ? handleRemoveUser(item.id) : handleAddUser(item))}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name={inGroup ? "person-remove" : "person-add"} size={16} color="#fff" />
              <Text style={styles.buttonText}>{inGroup ? "Eliminar" : "Añadir"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{showingGroupUsers ? "Usuarios del grupo" : "Resultados de búsqueda"}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

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

          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#006400" />
              <Text style={styles.loadingText}>Buscando usuarios...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => ""+item.id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {showingGroupUsers
                    ? "No hay usuarios en este grupo"
                    : "No se encontraron resultados para esta búsqueda"}
                </Text>
              }
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                showingGroupUsers && searchResults.length > 0 ? (
                  <Text style={styles.sectionHeader}>Miembros del grupo ({searchResults.length})</Text>
                ) : null
              }
            />
          )}
        </View>
      </View>
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
    maxHeight: "80%",
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
  searchContainer: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  listContent: {
    padding: 12,
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
  buttonText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 12,
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
    padding: 20,
    textAlign: "center",
    color: "#666",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#006400",
    marginBottom: 12,
  },
})

export default UserSearchModal
