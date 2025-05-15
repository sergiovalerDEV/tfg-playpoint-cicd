import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

import { Ionicons } from "@expo/vector-icons"

interface SocialGroupsHeaderProps {
    connectionStatus: string
    handleRefresh: () => {}
    isDark: boolean
}

const SocialGroupsHeader: React.FC<SocialGroupsHeaderProps> = ({ connectionStatus, handleRefresh, isDark }) => {
    return (
        <View style={isDark ? [styles.header, stylesDark.header] : [styles.header, stylesLight.header]}>
            <Text style={isDark ? [styles.headerTitle, stylesDark.headerTitle] : [styles.headerTitle, stylesLight.headerTitle]}>Grupos</Text>
            <View style={styles.headerRight}>
                <View style={styles.connectionStatus}>
                    <View
                        style={[
                            styles.statusDot,
                            connectionStatus === "connected"
                                ? styles.connected
                                : connectionStatus === "connecting"
                                    ? styles.connecting
                                    : styles.disconnected,
                        ]}
                    />
                    <Text
                        style={[
                            styles.statusText,
                            connectionStatus === "connected"
                                ? styles.connectedText
                                : connectionStatus === "connecting"
                                    ? styles.connectingText
                                    : styles.disconnectedText,
                        ]}
                    >
                        {connectionStatus === "connected"
                            ? "En línea"
                            : connectionStatus === "connecting"
                                ? "Conectando..."
                                : "Desconectado"}
                    </Text>
                </View>

                {/* Botón de recargar */}
                <TouchableOpacity style={isDark ? styles.refreshButton : styles.refreshButton} onPress={handleRefresh}>
                    <Ionicons name="refresh" size={20} color="#006400" style={isDark ? stylesDark.refreshButton : stylesLight.refreshButton} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        gap: 16
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: "Inter-SemiBold",
        textAlign: "center",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    connectionStatus: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    connected: {
        backgroundColor: "#4CAF50",
    },
    connecting: {
        backgroundColor: "#FFC107",
    },
    disconnected: {
        backgroundColor: "#F44336",
    },
    statusText: {
        fontSize: 12,
        fontFamily: "Inter-Regular",
    },
    connectedText: {
        color: "#4CAF50",
    },
    connectingText: {
        color: "#FFC107",
    },
    disconnectedText: {
        color: "#F44336",
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
    refreshButton: {
        color: "#006400",
    }
})

const stylesDark = StyleSheet.create({
    header: {
        backgroundColor: "rgb(0, 0, 0)",
    },
    headerTitle: {
        color: "#4CAF50",
    },
    refreshButton: {
        color: "#4CAF50",
    }
})

export default SocialGroupsHeader