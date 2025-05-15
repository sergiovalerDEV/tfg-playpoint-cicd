import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from '@react-navigation/native';

interface SecondaryPageHeaderProps {
  text: string
  isDark: boolean
}

const SecondaryPageHeader: React.FC<SecondaryPageHeaderProps> = ({ text, isDark }) => {
  const navigation = useNavigation()

  return (
    <View style={isDark ? [styles.header, stylesDark.header]: [styles.header, stylesLight.header]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" style={isDark ? stylesDark.backButton : stylesLight.backButton} />
        </TouchableOpacity>
        <Text style={isDark ? [styles.headerTitle, stylesDark.headerTitle] : [styles.headerTitle, stylesLight.headerTitle]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    paddingVertical: 12,
    gap: 16
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
  },
  backButton: {
    padding: 4,
  },
})

const stylesLight = StyleSheet.create({
  header: {
    backgroundColor: "rgb(255, 255, 255)",
  },
  headerTitle: {
    color: "#006400",
  },
  backButton: {
      color: "rgb(0, 0, 0)",
  },
})

const stylesDark = StyleSheet.create({
  header: {
    backgroundColor: "rgb(0, 0, 0)",
  },
  headerTitle: {
    color: "#4CAF50",
  },
  backButton: {
      color: "rgb(255, 255, 255)",
  },
})

export default SecondaryPageHeader