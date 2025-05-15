"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface EmailVerificationModalProps {
  visible: boolean
  email: string
  verificationCode: string
  verificationError: string | null
  onClose: () => void
  onVerify: (code: string) => void
  onResend: () => void
  isResending: boolean
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  visible,
  email,
  verificationCode,
  verificationError,
  onClose,
  onVerify,
  onResend,
  isResending,
}) => {
  const [enteredCode, setEnteredCode] = useState("")

  const handleVerify = () => {
    onVerify(enteredCode)
    // Don't clear the code here - only clear it when verification is successful
  }

  const handleClose = () => {
    setEnteredCode("")
    onClose()
  }

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Verify Your Email</Text>
          <Text style={styles.modalDescription}>
            We've sent a verification code to {email}. Please enter the code below.
          </Text>

          {verificationError ? (
            <View style={styles.verificationErrorContainer}>
              <Text style={styles.verificationErrorText}>{verificationError}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.verificationInput}
            placeholder="Enter verification code"
            placeholderTextColor="#9e9e9e"
            value={enteredCode}
            onChangeText={setEnteredCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity style={styles.resendContainer} onPress={onResend} disabled={isResending}>
            {isResending ? (
              <ActivityIndicator size="small" color="#006400" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color="#006400" />
                <Text style={styles.resendText}>Resend code</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, !enteredCode && styles.confirmButtonDisabled]}
              onPress={handleVerify}
              disabled={!enteredCode}
            >
              <Text style={styles.confirmButtonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#006400",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#666",
    marginBottom: 16,
  },
  verificationErrorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#D32F2F",
  },
  verificationErrorText: {
    color: "#D32F2F",
    fontFamily: "Inter-Regular",
    fontSize: 14,
  },
  verificationInput: {
    height: 50,
    backgroundColor: "#EFF1F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: "Inter-Medium",
    color: "#333",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 16,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  resendText: {
    color: "#006400",
    fontSize: 14,
    fontFamily: "Inter-Medium",
    marginLeft: 4,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    height: 44,
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  confirmButton: {
    height: 44,
    flex: 1,
    backgroundColor: "#006400",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: "#6B8E6B",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
})

export default EmailVerificationModal
