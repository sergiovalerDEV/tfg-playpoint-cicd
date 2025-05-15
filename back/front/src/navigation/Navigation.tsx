"use client"

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import type { RootParamList } from "./RootParamList"
import { StyleSheet, View } from "react-native"
import Login from "../screens/LoginRegister/Login"
import Register from "../screens/LoginRegister/Register"
import SearchMeetings from "../screens/ManageMeetings/SearchMeetings"
import CreateMeeting from "../screens/ManageMeetings/CreateMeeting"
import SocialGroups from "../screens/Chats/SocialGroups"
import MyAccount from "../screens/User/MyAccount"
import MeetingDetails from "../screens/ManageMeetings/MeetingDetails"
import GoPremium from "../screens/User/GoPremium"
import Chat from "../screens/Chats/Chat"
import MyMeetings from "../screens/User/MyMeetings"
import Stats from "../screens/User/Stats"
import Settings from "../screens/User/Settings"
import ChangeUsername from "../screens/User/Settings/ChangeUsername"
import ChangeEmail from "../screens/User/Settings/ChangeEmail"
import ChangePhoneNumber from "../screens/User/Settings/ChangePhoneNumber"
import ChangeTheme from "../screens/User/Settings/ChangeTheme"
import Notifications from "../screens/User/Settings/Notifications"
import PuntuarEquipos from "../screens/ManageMeetings/PuntuarEquiposScreen" // Importar la pantalla de puntuar equipos
import AllSportsScreen from "../screens/ManageMeetings/AllSportsScreen" // Importar la nueva pantalla de deportes
import { Search, Plus, User, MessageCircle } from "lucide-react-native"
import { useTheme } from "../contexts/ThemeContext" // Importar el contexto de tema
import { GroupsProvider } from "../contexts/GroupsContext"

const Tab = createBottomTabNavigator<RootParamList>()
const Stack = createStackNavigator<RootParamList>()

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={AuthStack} />
        <Stack.Screen name="SearchMeetings" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const AuthStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

const TabNavigator = () => {
  // Usar el contexto de tema
  const { theme } = useTheme()

  // Determinar colores basados en el tema
  const backgroundColor = theme === "dark" ? "#121212" : "white"
  const borderTopColor = theme === "dark" ? "#333333" : "#f0f0f0"
  const activeColor = theme === "dark" ? "#4CAF50" : "#333"
  const inactiveColor = theme === "dark" ? "#666666" : "#bbb"

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: backgroundColor, // Usar color basado en tema
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 0.5,
          borderTopColor: borderTopColor, // Usar color basado en tema
          height: 52,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: activeColor, // Usar color basado en tema
        tabBarInactiveTintColor: inactiveColor, // Usar color basado en tema
        tabBarShowLabel: false,
        tabBarIcon: ({ focused, color, size }) => renderTabIcon(route.name, color, focused),
      })}
    >
      <Tab.Screen name="SearchMeetings" component={SearchMeetingsStack} options={{ headerShown: false }} />
      <Tab.Screen name="CreateMeeting" component={CreateMeetingStack} options={{ headerShown: false }} />
      <Tab.Screen name="MyAccount" component={MyAccountStack} options={{ headerShown: false }} />
      <Tab.Screen name="SocialGroups" component={SocialGroupsStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  )
}

// Nuevo stack para CreateMeeting que incluye AllSports
const CreateMeetingStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#000",
        headerTitleAlign: "left",
      }}
    >
      <Stack.Screen name="CreateMeeting" component={CreateMeeting} options={{ headerShown: false }} />
      <Stack.Screen name="AllSports" component={AllSportsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

const SearchMeetingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#000",
        headerTitleAlign: "left",
      }}
    >
      <Stack.Screen name="SearchMeetings" component={SearchMeetings} options={{ headerShown: false }} />
      <Stack.Screen name="MeetingDetails" component={MeetingDetails} options={{ headerShown: false }} />
      <Stack.Screen name="PuntuarEquipos" component={PuntuarEquipos} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

const MyAccountStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#000",
        headerTitleAlign: "left",
      }}
    >
      <Stack.Screen name="MyAccount" component={MyAccount} options={{ headerShown: false }} />
      <Stack.Screen name="MyMeetings" component={MyMeetingsStack} options={{ headerShown: false }} />
      <Stack.Screen name="Stats" component={StatsStack} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsStack} options={{ headerShown: false }} />
      <Stack.Screen name="GoPremium" component={GoPremium} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

const MyMeetingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#000",
        headerTitleAlign: "left",
      }}
    >
      <Stack.Screen name="MyMeetings" component={MyMeetings} options={{ headerShown: false }} />
      <Stack.Screen name="MeetingDetails" component={MeetingDetails} options={{ headerShown: false }} />
      <Stack.Screen name="PuntuarEquipos" component={PuntuarEquipos} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

const StatsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#000",
        headerTitleAlign: "left",
      }}
    >
      <Stack.Screen name="Stats" component={Stats} options={{ headerShown: false }} />
      <Stack.Screen name="MeetingDetails" component={MeetingDetails} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#000",
        headerTitleAlign: "left",
      }}
    >
      <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
      <Stack.Screen name="ChangeUsername" component={ChangeUsername} options={{ headerShown: false }} />
      <Stack.Screen name="ChangeEmail" component={ChangeEmail} options={{ headerShown: false }} />
      <Stack.Screen name="ChangePhoneNumber" component={ChangePhoneNumber} options={{ headerShown: false }} />
      <Stack.Screen name="ChangeTheme" component={ChangeTheme} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={Notifications} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

const SocialGroupsStack = () => {
  return (
    <GroupsProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: "#000",
          headerTitleAlign: "left",
        }}
      >
        <Stack.Screen name="SocialGroups" component={SocialGroups} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={Chat} options={{ headerShown: false }} />
      </Stack.Navigator>
    </GroupsProvider>
  )
}

export default RootNavigator

const renderTabIcon = (routeName: string, color: string, focused: boolean) => {
  const size = 26 // Increased from 22 to 26
  const strokeWidth = focused ? 1.5 : 1

  return (
    <View style={styles.iconContainer}>
      {routeName === "SearchMeetings" && <Search size={size} color={color} strokeWidth={strokeWidth} />}
      {routeName === "CreateMeeting" && <Plus size={size} color={color} strokeWidth={strokeWidth} />}
      {routeName === "MyAccount" && <User size={size} color={color} strokeWidth={strokeWidth} />}
      {routeName === "SocialGroups" && <MessageCircle size={size} color={color} strokeWidth={strokeWidth} />}
    </View>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
})