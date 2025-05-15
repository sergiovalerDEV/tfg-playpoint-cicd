import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    type OnGatewayConnection,
    type OnGatewayDisconnect,
  } from "@nestjs/websockets"
  import type { Server, Socket } from "socket.io"
  import { Logger } from "@nestjs/common"
  
  @WebSocketGateway({
    cors: {
      origin: "*",
    },
  })

  export class GrupoGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server
    private logger: Logger = new Logger("GrupoGateway")

    private connectedUsers = new Map<string, string>()
  
    handleConnection(client: Socket) {
      this.logger.log(`Cliente conectado a GrupoGateway: ${client.id}`)
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Cliente desconectado de GrupoGateway: ${client.id}`)
      this.connectedUsers.delete(client.id)
    }
  
    @SubscribeMessage("registerForGroupUpdates")
    handleRegisterForGroupUpdates(client: Socket, payload: { userId: string }) {
      this.connectedUsers.set(client.id, payload.userId)
      this.logger.log(`Usuario ${payload.userId} registrado para actualizaciones de grupos`)
    }
  
    @SubscribeMessage("unregisterFromGroupUpdates")
    handleUnregisterFromGroupUpdates(client: Socket) {
      this.connectedUsers.delete(client.id)
      this.logger.log(`Usuario desregistrado de actualizaciones de grupos`)
    }

    emitNewGroup(grupo: any) {
      this.server.emit("newGroup", grupo)
      this.logger.log(`Nuevo grupo emitido a todos los usuarios conectados`)
    }

    emitUpdatedGroup(grupo: any) {
      this.server.emit("updatedGroup", grupo)
      this.logger.log(`Grupo actualizado emitido a todos los usuarios conectados`)
    }

    emitDeletedGroup(grupoId: string) {
      this.server.emit("deletedGroup", { id: grupoId })
      this.logger.log(`Eliminación de grupo emitida a todos los usuarios conectados`)
    }
  }
  