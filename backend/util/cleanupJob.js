import cron from 'node-cron';
import File from '../models/file.model.js';

export const startCleanupJob = () => {
  // Run once every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running expired token cleanup job');
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      
      const result = await File.updateMany(
        { "tokenSharedWith.tokenExp": { $lt: currentTime } },
        { $pull: { tokenSharedWith: { tokenExp: { $lt: currentTime } } } }
      );
      
      console.log(`Removed expired token shares: ${result.nModified} documents modified`);
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  });
  
  console.log('Token cleanup job scheduled');
};