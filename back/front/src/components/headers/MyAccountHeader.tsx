import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

interface MyAccountHeaderProps {
    isDark: boolean
    userPremium: boolean
}

const MyAccountHeader: React.FC<MyAccountHeaderProps> = ({ isDark, userPremium }) => {
    const navigation = useNavigation()

    return (
        <View style={isDark ? [styles.header, stylesDark.header] : [styles.header, stylesLight.header]}>
            <Text style={isDark ? [styles.headerTitle, stylesDark.headerTitle] : [styles.headerTitle, stylesLight.headerTitle]}>Mi Cuenta</Text>
            <TouchableOpacity style={styles.premiumIconButton} onPress={() => { navigation.navigate("GoPremium") }} activeOpacity={0.7}>
                <Ionicons
                    name="diamond"
                    size={24}
                    color={userPremium ? (isDark ? "#FFD700" : "#FFD700") : isDark ? "#4CAF50" : "#006400"}
                />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent:"space-between",
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

export default MyAccountHeader