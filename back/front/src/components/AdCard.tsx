"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"

export interface Ad {
  id: number
  nombre: string
  descripcion: string
  imagenes: string[]
  video: string
}

interface AdCardProps {
  ad: Ad
  onClose: (adId: number) => void
  theme?: "light" | "dark"
}

const AdCard: React.FC<AdCardProps> = ({ ad, onClose, theme = "light" }) => {
  const { theme: contextTheme } = useTheme()
  const isDark = theme === "dark" || contextTheme === "dark"
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [fadeAnim] = useState(new Animated.Value(1))

  // Asegurarse de que siempre haya al menos una imagen
  const images =
    ad.imagenes && ad.imagenes.length > 0
      ? ad.imagenes
      : ["https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000"]

  // Efecto para cambiar automáticamente las imágenes
  useEffect(() => {
    if (images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 3000) // Cambiar cada 3 segundos

    return () => clearInterval(interval)
  }, [images.length])

  // Efecto para animar la salida del anuncio cuando se cierra
  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose(ad.id)
    })
  }

  return (
    <Animated.View style={[styles.container, isDark ? styles.containerDark : null, { opacity: fadeAnim }]}>
      {/* Etiqueta de Anuncio */}
      <View style={styles.adLabelContainer}>
        <Ionicons name="megaphone-outline" size={12} color="#FFFFFF" style={styles.adIcon} as any />
      </View>

      {/* Botón de cerrar */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
        <Ionicons name="close-circle" size={24} color={isDark ? "#E0E0E0" : "#FFFFFF"} as any />
      </TouchableOpacity>

      {/* Imagen del anuncio */}
      <Animated.Image source={{ uri: images[currentImageIndex] }} style={styles.adImage} resizeMode="cover" />

      {/* Indicadores de imagen */}
      {images.length > 1 && (
        <View style={styles.indicators}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentImageIndex && styles.activeIndicator,
                isDark && index === currentImageIndex && styles.activeIndicatorDark,
              ]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  )
}

const { width } = Dimensions.get("window")
const cardHeight = 180

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
    height: cardHeight,
  },
  containerDark: {
    backgroundColor: "#1E1E1E",
  },
  adLabelContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 100, 0, 0.7)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  adIcon: {
    marginRight: 0,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
  },
  adImage: {
    width: "100%",
    height: "100%",
  },
  indicators: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#FFFFFF",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeIndicatorDark: {
    backgroundColor: "#4CAF50",
  },
})

export default AdCard