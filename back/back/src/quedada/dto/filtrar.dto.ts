export class FiltrarQuedadaDto {
    creador?: number;
    localizacion?: string;
    fecha?: string; // Formato de fecha como string
    hora_inicio?: string;
    hora_finalizacion?: string;
    competitividad?: number;
    local?: string;
    deporte?: string;
    usuarioquedada?: number[];
    abierta?: boolean;
  }