import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// Tipos de alerta
export type AlertType = 'success' | 'error' | 'info' | 'warning'

// Props del componente
interface AlertProps {
  visible: boolean
  type?: AlertType
  message: string
  duration?: number
  onClose?: () => void
}

// Singleton para gestionar alertas globalmente
export class AlertManager {
  private static instance: AlertManager
  private callback: ((props: Omit<AlertProps, 'visible'>) => void) | null = null

  private constructor() {}

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  public register(callback: (props: Omit<AlertProps, 'visible'>) => void): void {
    this.callback = callback
  }

  public unregister(): void {
    this.callback = null
  }

  public show(props: Omit<AlertProps, 'visible'>): void {
    if (this.callback) {
      this.callback(props)
    }
  }
}

// Componente de alerta
const Alert: React.FC<AlertProps> = ({
  visible,
  type = 'info',
  message,
  duration = 3000,
  onClose,
}) => {
  const [slideAnim] = useState(new Animated.Value(-100))
  const [opacityAnim] = useState(new Animated.Value(0))
  const [isVisible, setIsVisible] = useState(visible)

  // Configuración de colores según el tipo de alerta
  const getAlertStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#006400', // Verde oscuro para éxito
          iconName: 'checkmark-circle-outline',
          iconColor: '#FFFFFF',
        }
      case 'error':
        return {
          backgroundColor: '#D32F2F', // Rojo para error
          iconName: 'alert-circle-outline',
          iconColor: '#FFFFFF',
        }
      case 'warning':
        return {
          backgroundColor: '#FF9800', // Naranja para advertencia
          iconName: 'warning-outline',
          iconColor: '#FFFFFF',
        }
      case 'info':
      default:
        return {
          backgroundColor: '#2196F3', // Azul para información
          iconName: 'information-circle-outline',
          iconColor: '#FFFFFF',
        }
    }
  }

  const alertStyle = getAlertStyle()

  useEffect(() => {
    if (visible) {
      setIsVisible(true)
      // Animación de entrada
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      // Configurar temporizador para cerrar automáticamente
      const timer = setTimeout(() => {
        hideAlert()
      }, duration)

      return () => clearTimeout(timer)
    } else {
      hideAlert()
    }
  }, [visible])

  const hideAlert = () => {
    // Animación de salida
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false)
      if (onClose) onClose()
    })
  }

  if (!isVisible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.alertContainer, { backgroundColor: alertStyle.backgroundColor }]}>
        <Ionicons name={alertStyle.iconName as any} size={24} color={alertStyle.iconColor} />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={hideAlert}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

// Componente contenedor para usar globalmente
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertProps, setAlertProps] = useState<Omit<AlertProps, 'visible'> | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const alertManager = AlertManager.getInstance()
    
    alertManager.register((props) => {
      setAlertProps(props)
      setVisible(true)
    })

    return () => {
      alertManager.unregister()
    }
  }, [])

  const handleClose = () => {
    setVisible(false)
    if (alertProps?.onClose) {
      alertProps.onClose()
    }
  }

  return (
    <>
      {children}
      {alertProps && (
        <Alert
          visible={visible}
          type={alertProps.type}
          message={alertProps.message}
          duration={alertProps.duration}
          onClose={handleClose}
        />
      )}
    </>
  )
}

// Función de utilidad para mostrar alertas desde cualquier parte de la app
export const showAlert = (
  message: string,
  type: AlertType = 'info',
  duration: number = 3000,
  onClose?: () => void
) => {
  const alertManager = AlertManager.getInstance()
  alertManager.show({ message, type, duration, onClose })
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  alertContainer: {
    width: width - 32,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
})

export default Alert