import EventEmitter from 'events';
export const jobEventEmitter = new EventEmitter();
export function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Client connected');
        socket.on('subscribeToJob', (jobId) => {
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
//# sourceMappingURL=socketHandler.js.map