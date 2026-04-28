import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SalesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SalesGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_store')
  handleJoinStore(
    @MessageBody() data: { storeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.storeId) {
      client.join(data.storeId);
      this.logger.log(`Client ${client.id} joined store: ${data.storeId}`);
      return { event: 'joined', data: { storeId: data.storeId } };
    }
  }

  @SubscribeMessage('leave_store')
  handleLeaveStore(
    @MessageBody() data: { storeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.storeId) {
      client.leave(data.storeId);
      this.logger.log(`Client ${client.id} left store: ${data.storeId}`);
    }
  }

  @SubscribeMessage('rachma_action')
  handleRachmaAction(
    @MessageBody() data: { storeId: string; action: string; productId: string; baristaId: string; timestamp: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast live action to the store room (excluding the sender)
    if (data.storeId) {
      this.logger.log(`Broadcasting rachma_action for store ${data.storeId}: ${data.action} on ${data.productId}`);
      client.to(data.storeId).emit('live_activity', {
        type: 'rachma_tap',
        ...data,
      });
    }
  }

  // Method to be called by SalesService when a sale is completed
  broadcastSaleCompleted(storeId: string, saleData: any) {
    this.logger.log(`Broadcasting sale_completed for store ${storeId}`);
    this.server.to(storeId).emit('live_activity', {
      type: 'sale_completed',
      data: saleData,
    });
  }
}
