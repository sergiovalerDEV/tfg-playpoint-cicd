"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { showAlert } from "../Alert" // Importar showAlert

interface ReportOption {
  id: string
  label: string
  isCustom?: boolean
}

interface ReportModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
  title?: string
  theme?: "light" | "dark"
}

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  onSubmit,
  title = "Report Meeting",
  theme = "light",
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [customReason, setCustomReason] = useState("")
  const [reportOptions, setReportOptions] = useState<ReportOption[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false) // Nuevo estado para controlar el envío
  const isDark = theme === "dark"

  // Constante para el límite de caracteres
  const MAX_CHARS = 250

  // Cargar razones al abrir el modal
  useEffect(() => {
    if (visible) {
      loadReportReasons()
    }
  }, [visible])

  // Función para cargar las razones de reporte
  const loadReportReasons = async () => {
    setLoading(true)
    try {
      // Usar razones estáticas en lugar de cargar desde la base de datos
      const staticReasons = [
        { id: "comportamiento_inadecuado", label: "Comportamiento inadecuado" },
        { id: "no_asistencia", label: "No asistencia a la quedada" },
        { id: "informacion_falsa", label: "Información falsa en la descripción" },
        { id: "incumplimiento_normas", label: "Incumplimiento de las normas" },
        { id: "contenido_inapropiado", label: "Contenido inapropiado" },
      ]

      setReportOptions([...staticReasons, { id: "otro", label: "Otro (especificar)", isCustom: true }])
      console.log("✅ Razones de reporte estáticas cargadas correctamente")
    } catch (error) {
      console.error("❌ Error al cargar razones de reporte:", error)
      // Usar razones por defecto en caso de error
      setReportOptions([
        { id: "Spam en el chat", label: "Spam en el chat" },
        { id: "Lenguaje ofensivo", label: "Lenguaje ofensivo" },
        { id: "Incumplimiento de normas", label: "Incumplimiento de normas" },
        { id: "Publicidad no autorizada", label: "Publicidad no autorizada" },
        { id: "Comportamiento inapropiado", label: "Comportamiento inapropiado" },
        { id: "otro", label: "Otro (especificar)", isCustom: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Función para manejar el cambio de texto con límite
  const handleCustomReasonChange = (text: string) => {
    // Limitar a MAX_CHARS caracteres
    if (text.length <= MAX_CHARS) {
      setCustomReason(text)
    }
  }

  const handleSubmit = () => {
    if (selectedReason === "otro") {
      if (customReason.trim()) {
        setSubmitting(true) // Indicar que se está enviando
        
        // Enviar la razón personalizada
        onSubmit(customReason.trim())
        
        // Mostrar alerta de éxito y cerrar el modal
        showAlert("Reporte enviado correctamente", "success", 2000, () => {
          // Limpiar estados y cerrar modal después de mostrar la alerta
          setSelectedReason(null)
          setCustomReason("")
          onClose()
        })
      }
    } else if (selectedReason) {
      setSubmitting(true) // Indicar que se está enviando
      
      // Encontrar la etiqueta correspondiente al ID seleccionado
      const selectedOption = reportOptions.find((option) => option.id === selectedReason)
      
      // Enviar la razón seleccionada
      onSubmit(selectedOption?.label || selectedReason)
      
      // Mostrar alerta de éxito y cerrar el modal
      showAlert("Reporte enviado correctamente", "success", 2000, () => {
        // Limpiar estados y cerrar modal después de mostrar la alerta
        setSelectedReason(null)
        setCustomReason("")
        onClose()
      })
    }
  }

  const handleClose = () => {
    // Solo permitir cerrar si no se está enviando un reporte
    if (!submitting) {
      setSelectedReason(null)
      setCustomReason("")
      onClose()
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={isDark ? styles.modalContainerDark : styles.modalContainer}>
              <Text style={isDark ? styles.titleDark : styles.title}>{title}</Text>

              {loading ? (
                <ActivityIndicator size="small" color={isDark ? "#4CAF50" : "#006400"} style={styles.loader} />
              ) : submitting ? (
                // Mostrar indicador de carga durante el envío
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="small" color={isDark ? "#4CAF50" : "#006400"} />
                  <Text style={isDark ? styles.submittingTextDark : styles.submittingText}>
                    Enviando reporte...
                  </Text>
                </View>
              ) : (
                <>
                  {reportOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.optionRow}
                      onPress={() => setSelectedReason(option.id)}
                    >
                      <Text style={isDark ? styles.optionTextDark : styles.optionText}>{option.label}</Text>
                      <View style={styles.radioButton}>
                        {selectedReason === option.id ? (
                          <Ionicons name="checkmark-circle" size={24} color={isDark ? "#4CAF50" : "#006400"} />
                        ) : (
                          <Ionicons name="ellipse-outline" size={24} color={isDark ? "#4CAF50" : "#006400"} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Campo de texto para razón personalizada */}
                  {selectedReason === "otro" && (
                    <View style={styles.customReasonContainer}>
                      <TextInput
                        style={isDark ? styles.customReasonInputDark : styles.customReasonInput}
                        placeholder="Describe la razón..."
                        placeholderTextColor={isDark ? "#777" : "#999"}
                        value={customReason}
                        onChangeText={handleCustomReasonChange}
                        multiline={true}
                        numberOfLines={3}
                        maxLength={MAX_CHARS}
                      />
                      <Text style={isDark ? styles.charCountDark : styles.charCount}>
                        {customReason.length}/{MAX_CHARS} caracteres
                      </Text>
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity
                style={[
                  isDark ? styles.submitButtonDark : styles.submitButton,
                  (!selectedReason || (selectedReason === "otro" && !customReason.trim()) || submitting) &&
                    (isDark ? styles.submitButtonDisabledDark : styles.submitButtonDisabled),
                ]}
                onPress={handleSubmit}
                disabled={!selectedReason || (selectedReason === "otro" && !customReason.trim()) || submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? "Enviando..." : "Enviar reporte"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalContainerDark: {
    width: "80%",
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#006400",
    marginBottom: 20,
  },
  titleDark: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  optionTextDark: {
    fontSize: 16,
    color: "#E0E0E0",
  },
  radioButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  customReasonContainer: {
    width: "100%",
  },
  customReasonInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
    backgroundColor: "#F9F9F9",
    minHeight: 80,
    textAlignVertical: "top",
  },
  customReasonInputDark: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 5,
    color: "#E0E0E0",
    backgroundColor: "#2A2A2A",
    minHeight: 80,
    textAlignVertical: "top",
  },
  charCount: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  charCountDark: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#AAA",
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#006400",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    width: "80%",
    alignItems: "center",
  },
  submitButtonDark: {
    backgroundColor: "#2E7D32",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
    width: "80%",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  submitButtonDisabledDark: {
    backgroundColor: "#555555",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loader: {
    marginVertical: 30,
  },
  submittingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
  },
  submittingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  submittingTextDark: {
    marginTop: 10,
    fontSize: 16,
    color: "#E0E0E0",
  },
})

export default ReportModal