import EventEmitter from 'events';
import { Server, Socket } from 'socket.io';

export const jobEventEmitter = new EventEmitter();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected');

    socket.on('subscribeToJob', (jobId: string) => {
      console.log(`Client subscribed to job ${jobId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  jobEventEmitter.on('jobUpdated', (jobData) => {
    console.log('job emitted', jobData);
    io.emit('jobUpdate', jobData);
  });
}

