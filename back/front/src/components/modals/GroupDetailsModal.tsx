"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import SocialGroupsService from "../../services/Chats/SocialGroupsService"
import { useGroups } from "../../contexts/GroupsContext"

interface GroupDetailsModalProps {
  visible: boolean
  onClose: () => void
  grupo: any
  onGroupUpdated?: (updatedGroup: any) => void
}

const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ visible, onClose, grupo, onGroupUpdated }) => {
  const {grupos, setGrupos} = useGroups()

  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [localGrupo, setLocalGrupo] = useState<any>(null)

  const grupoId = grupo?.id

  grupo = grupos.find((grupo) => grupo.id === grupoId)

  useEffect(() => {
    if (grupo) {
      setLocalGrupo(grupo)
      setNewName(grupo.nombre || "")
      setNewDescription(grupo.descripcion || "")
    }
  }, [grupo])

  if (!localGrupo) return null

  const handleSaveName = async () => {
    if (newName.trim() === "") {
      Alert.alert("Error", "El nombre no puede estar vacío")
      return
    }

    setIsLoading(true)
    try {
      await SocialGroupsService.cambiarNombreGrupo(localGrupo.id, newName.trim())

      // Actualizar el grupo local
      setLocalGrupo((prev: any) => ({
        ...prev,
        nombre: newName.trim(),
      }))

      // Notificar al componente padre
      if (onGroupUpdated) {
        onGroupUpdated({
          ...localGrupo,
          nombre: newName.trim(),
        })
      }

      setEditingName(false)
      Alert.alert("Éxito", "Nombre del grupo actualizado correctamente")
    } catch (error) {
      console.error("Error al guardar el nombre:", error)
      Alert.alert("Error", "No se pudo actualizar el nombre del grupo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDescription = async () => {
    setIsLoading(true)
    try {
      await SocialGroupsService.cambiarDescripcionGrupo(localGrupo.id, newDescription.trim())

      // Actualizar el grupo local
      setLocalGrupo((prev: any) => ({
        ...prev,
        descripcion: newDescription.trim(),
      }))

      // Notificar al componente padre
      if (onGroupUpdated) {
        onGroupUpdated({
          ...localGrupo,
          descripcion: newDescription.trim(),
        })
      }

      setEditingDescription(false)
      Alert.alert("Éxito", "Descripción del grupo actualizada correctamente")
    } catch (error) {
      console.error("Error al guardar la descripción:", error)
      Alert.alert("Error", "No se pudo actualizar la descripción del grupo")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePickImage = async () => {
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
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleUploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo seleccionar la imagen")
    }
  }

  const handleTakePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a tu cámara")
        return
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleUploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error al tomar foto:", error)
      Alert.alert("Error", "No se pudo tomar la foto")
    }
  }

  const handleUploadImage = async (imageUri: string) => {
    setIsLoading(true)
    try {
      await SocialGroupsService.cambiarFotoGrupo(localGrupo.id, imageUri)

      // Actualizar el grupo local
      setLocalGrupo((prev: any) => ({
        ...prev,
        imagen: imageUri, // Temporalmente usamos la URI local hasta que se actualice desde el servidor
      }))

      // Notificar al componente padre
      if (onGroupUpdated) {
        onGroupUpdated({
          ...localGrupo,
          imagen: imageUri, // Temporalmente usamos la URI local hasta que se actualice desde el servidor
        })
      }

      Alert.alert("Éxito", "Foto del grupo actualizada correctamente")
    } catch (error) {
      console.error("Error al subir la imagen:", error)
      Alert.alert("Error", "No se pudo actualizar la foto del grupo")
    } finally {
      setIsLoading(false)
    }
  }

  const showImageOptions = () => {
    Alert.alert(
      "Cambiar foto de grupo",
      "Selecciona una opción",
      [
        {
          text: "Tomar foto",
          onPress: handleTakePhoto,
        },
        {
          text: "Seleccionar de la galería",
          onPress: handlePickImage,
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
      { cancelable: true },
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del grupo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailsContainer}>
            {/* Imagen del grupo con opción de editar */}
            <View style={styles.imageContainer}>
              <TouchableOpacity onPress={showImageOptions} style={styles.imageWrapper}>
                {localGrupo.imagen ? (
                  <Image source={{ uri: localGrupo.imagen }} style={styles.groupImage} />
                ) : (
                  <View style={styles.groupImagePlaceholder}>
                    <Text style={styles.groupImageText}>{localGrupo.nombre.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.editImageButton}>
                  <Ionicons name="camera" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Nombre del grupo con opción de editar */}
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>Nombre</Text>
                <TouchableOpacity onPress={() => setEditingName(true)} style={styles.editButton}>
                  <Ionicons name="pencil" size={18} color="#006400" />
                </TouchableOpacity>
              </View>

              {editingName ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Nombre del grupo"
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setNewName(localGrupo.nombre)
                        setEditingName(false)
                      }}
                      style={[styles.editActionButton, styles.cancelButton]}
                      disabled={isLoading}
                    >
                      <Text style={styles.editActionButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveName}
                      style={[styles.editActionButton, styles.saveButton]}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.editActionButtonText}>Guardar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.detailValue}>{localGrupo.nombre}</Text>
              )}
            </View>

            {/* Descripción del grupo con opción de editar */}
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailLabel}>Descripción</Text>
                <TouchableOpacity onPress={() => setEditingDescription(true)} style={styles.editButton}>
                  <Ionicons name="pencil" size={18} color="#006400" />
                </TouchableOpacity>
              </View>

              {editingDescription ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[styles.editInput, styles.editTextArea]}
                    value={newDescription}
                    onChangeText={setNewDescription}
                    placeholder="Descripción del grupo"
                    multiline
                    numberOfLines={3}
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setNewDescription(localGrupo.descripcion || "")
                        setEditingDescription(false)
                      }}
                      style={[styles.editActionButton, styles.cancelButton]}
                      disabled={isLoading}
                    >
                      <Text style={styles.editActionButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveDescription}
                      style={[styles.editActionButton, styles.saveButton]}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.editActionButtonText}>Guardar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.detailValue}>{localGrupo.descripcion || "Sin descripción"}</Text>
              )}
            </View>

            {/* Miembros del grupo */}
            <View style={styles.membersSection}>
              <Text style={styles.membersTitle}>Miembros ({localGrupo.usuariogrupo?.length || 0})</Text>
              {localGrupo.usuariogrupo && localGrupo.usuariogrupo.length > 0 ? (
                localGrupo.usuariogrupo.map((ug: any) => (
                  <View key={ug.id} style={styles.memberItem}>
                    {ug.usuario.foto_perfil ? (
                      <Image source={{ uri: ug.usuario.foto_perfil }} style={styles.memberAvatar} />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberAvatarText}>{ug.usuario.nombre.charAt(0)}</Text>
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{ug.usuario.nombre}</Text>
                      <Text style={styles.memberEmail}>{ug.usuario.correo}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay miembros en este grupo</Text>
              )}
            </View>
          </ScrollView>
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
  detailsContainer: {
    padding: 16,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageWrapper: {
    position: "relative",
  },
  groupImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  groupImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0f0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  groupImageText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#006400",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#006400",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  detailItem: {
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  editButton: {
    padding: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },
  editContainer: {
    marginTop: 4,
  },
  editInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  editTextArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  editActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  saveButton: {
    backgroundColor: "#006400",
  },
  editActionButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  membersSection: {
    marginTop: 16,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#006400",
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
  },
  memberEmail: {
    fontSize: 14,
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

export default GroupDetailsModal
