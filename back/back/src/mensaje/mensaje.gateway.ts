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
  
  export class MensajeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server
    private logger: Logger = new Logger("MensajeGateway")

    private userRooms = new Map<string, string[]>()
  
    handleConnection(client: Socket) {
      this.logger.log(`Cliente conectado: ${client.id}`)
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Cliente desconectado: ${client.id}`)
      this.userRooms.delete(client.id)
    }
  
    @SubscribeMessage("joinRoom")
    handleJoinRoom(client: Socket, payload: { userId: string; groupId: string }) {
      const roomName = `grupo_${payload.groupId}`

      client.join(roomName)

      if (!this.userRooms.has(client.id)) {
        this.userRooms.set(client.id, [])
      }

      const userRooms = this.userRooms.get(client.id)
      if (userRooms) {
        userRooms.push(roomName)
      }
  
      this.logger.log(`Usuario ${payload.userId} se unió a la sala ${roomName}`)
    }
  
    @SubscribeMessage("leaveRoom")
    handleLeaveRoom(client: Socket, payload: { userId: string; groupId: string }) {
      const roomName = `grupo_${payload.groupId}`
      client.leave(roomName)

      const rooms = this.userRooms.get(client.id) || []
      this.userRooms.set(
        client.id,
        rooms.filter((room) => room !== roomName),
      )
  
      this.logger.log(`Usuario ${payload.userId} salió de la sala ${roomName}`)
    }

    emitNewMessage(groupId: string, message: any) {
      const roomName = `grupo_${groupId}`
      this.server.to(roomName).emit("newMessage", message)
      this.logger.log(`Mensaje emitido a la sala ${roomName}`)
    }
  }
  