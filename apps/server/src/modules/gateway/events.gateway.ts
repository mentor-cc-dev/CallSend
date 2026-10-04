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
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_branch')
  handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizationId: string; branchId?: string },
  ) {
    if (data.organizationId) {
      client.join(`org_${data.organizationId}`);
      this.logger.log(`Socket ${client.id} joined org_${data.organizationId}`);
    }
    if (data.branchId) {
      client.join(`branch_${data.branchId}`);
      this.logger.log(`Socket ${client.id} joined branch_${data.branchId}`);
    }
    return { status: 'joined' };
  }

  // Helper methods to broadcast from services
  emitIncomingCall(organizationId: string, branchId: string | null, payload: any) {
    const targetRoom = branchId ? `branch_${branchId}` : `org_${organizationId}`;
    this.server.to(targetRoom).emit('call.incoming', payload);
    this.server.to(`org_${organizationId}`).emit('call.incoming', payload);
  }

  emitCallEnded(organizationId: string, branchId: string | null, payload: any) {
    const targetRoom = branchId ? `branch_${branchId}` : `org_${organizationId}`;
    this.server.to(targetRoom).emit('call.ended', payload);
  }

  emitCustomerOpenedLink(organizationId: string, branchId: string | null, payload: any) {
    const targetRoom = branchId ? `branch_${branchId}` : `org_${organizationId}`;
    this.server.to(targetRoom).emit('customer.opened_link', payload);
    this.server.to(`org_${organizationId}`).emit('customer.opened_link', payload);
  }

  emitCustomerEvent(organizationId: string, branchId: string | null, payload: any) {
    const targetRoom = branchId ? `branch_${branchId}` : `org_${organizationId}`;
    this.server.to(targetRoom).emit('customer.event', payload);
  }

  emitNewOrder(organizationId: string, branchId: string | null, payload: any) {
    const targetRoom = branchId ? `branch_${branchId}` : `org_${organizationId}`;
    this.server.to(targetRoom).emit('customer.order', payload);
    this.server.to(`org_${organizationId}`).emit('customer.order', payload);
  }
}
