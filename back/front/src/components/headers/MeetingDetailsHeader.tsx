import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from '@react-navigation/native';

interface MeetingDetailsHeaderProps {
  text: string
  isDark: boolean
}

const MeetingDetailsHeader: React.FC<MeetingDetailsHeaderProps> = ({ text, isDark }) => {
  const navigation = useNavigation()

  return (
    <View style={isDark ? [styles.header, stylesDark.header]: [styles.header, stylesLight.header]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
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
})

const stylesDark = StyleSheet.create({
  header: {
    backgroundColor: "rgb(0, 0, 0)",
  },
  headerTitle: {
    color: "#4CAF50",
  },
})

export default MeetingDetailsHeader