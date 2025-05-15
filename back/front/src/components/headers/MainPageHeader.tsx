import { StyleSheet, Text, View } from "react-native"

interface MainPageHeaderProps {
  text: string
  isDark: boolean
}

const MainPageHeader: React.FC<MainPageHeaderProps> = ({ text, isDark }) => {
  return (
    <View style={isDark ? [styles.header, stylesDark.header]: [styles.header, stylesLight.header]}>
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

export default MainPageHeader