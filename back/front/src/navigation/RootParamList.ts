import { Grupo } from "../models/Group"
import type { Meeting } from "../models/Meeting"
import type { Sport } from "../services/ManageMeetings/CreateMeetingService"

export type RootParamList = {
  // Auth screens
  Login: undefined
  Register: undefined

  // Meeting management screens
  SearchMeetings: undefined
  MeetingDetails: {
    _id: any
    meeting: Meeting
  }
  CreateMeeting: undefined
  PuntuarEquipos: { quedadaId: number } // Nueva pantalla para puntuar equipos
  AllSports: { sports: Sport[], selectedSportId?: number, theme: string } // Nueva pantalla para ver todos los deportes

  // User account screens
  MyAccount: undefined
  MyMeetings: undefined
  Stats: undefined
  Settings: undefined
  ChangeUsername: undefined
  ChangeEmail: undefined
  ChangePhoneNumber: undefined
  ChangeTheme: undefined
  Notifications: undefined
  GoPremium: undefined

  // Chat screens
  Chat: {
    grupo: Grupo
  }
  SocialGroups: undefined

  // Commented screens (keeping for reference)
  // VideoList: undefined;
  // Favoritos: undefined;
  // MeetingDetails: {
  //     quedada: Quedada
  //   }
  // PerfilUsuario: undefined
  // Privacidad: undefined
  // AcercaDe: undefined
}