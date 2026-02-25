import dbConnect from './db/connect';
import Log from './db/models/Log';

/**
 * Reusable logger utility function.
 * @param {Object} options
 * @param {'info'|'warn'|'error'} options.level
 * @param {string} options.message
 * @param {string} options.action
 * @param {string|mongoose.Types.ObjectId} [options.userId]
 * @param {Object} [options.metadata]
 * @param {Request} [options.req] - Next.js Request object to extract IP and user-agent
 */
export async function logger({ level = 'info', message, action, userId = null, metadata = {}, req }) {
  try {
    // Attempt to connect to DB if not connected
    await dbConnect();

    let ipAddress = null;
    let userAgent = null;

    if (req) {
      // Extract IP address
      const forwardedFor = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      ipAddress = forwardedFor ? forwardedFor.split(',')[0] : realIp || null;
      
      // Fallback for Next.js 14+ specific IP extraction if needed
      // Check if req.ip is available
      if (!ipAddress && req.ip) {
        ipAddress = req.ip;
      }

      // Extract User-Agent
      userAgent = req.headers.get('user-agent') || null;
    }

    // Format metadata to handle errors properly if passed in metadata fields
    let safeMetadata = { ...metadata };
    if (safeMetadata.error instanceof Error) {
      safeMetadata.error = {
        message: safeMetadata.error.message,
        stack: safeMetadata.error.stack,
        name: safeMetadata.error.name,
      };
    }

    const logEntry = new Log({
      level,
      message,
      action,
      userId,
      metadata: safeMetadata,
      ipAddress,
      userAgent,
    });

    await logEntry.save();
    
    // Optional: Log to terminal in development or always
    if (level === 'error') {
      console.error(`[${action}] ${message}`, safeMetadata);
    } else if (level === 'warn') {
      console.warn(`[${action}] ${message}`, safeMetadata);
    } else {
      console.log(`[${action}] ${message}`, safeMetadata);
    }
  } catch (error) {
    // Do not crash the app if logging fails
    console.error('Failed to save log to MongoDB:', error.message);
  }
}
