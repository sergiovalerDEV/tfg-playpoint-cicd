import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface SearchMeetingsHeaderProps {
    handleManualRefresh: () => Promise<void>
    isDark: boolean
}

const SearchMeetingsHeader: React.FC<SearchMeetingsHeaderProps> = ({ handleManualRefresh, isDark }) => {


    return (
        <View style={isDark ? [styles.header, stylesDark.header] : [styles.header, stylesLight.header]}>
            <Text style={isDark ? [styles.headerTitle, stylesDark.headerTitle] : [styles.headerTitle, stylesLight.headerTitle]}>Search Meetings</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleManualRefresh}>
                <Ionicons name="refresh" size={24} color={isDark ? "#4CAF50" : "#006400"} as any />
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
    refreshButton: {
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

export default SearchMeetingsHeader