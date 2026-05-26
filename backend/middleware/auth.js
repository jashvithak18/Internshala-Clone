import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getISTTime, isWithinISTHourWindow } from '../utils/timeHelper.js';

export const protect = async (req, res, next) => {
  let token;

  // Retrieve token from Authorization header (Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_mode');
      
      // Retrieve the user from the database
      req.user = await User.findById(decoded.id).select('-passwordHash');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Enforce the MOBILE DEVICE RULE:
      // Allow access only between 10:00 AM and 1:00 PM IST
      const deviceType = req.deviceDetails?.deviceType || 'desktop';
      if (deviceType === 'mobile') {
        const isAllowed = isWithinISTHourWindow(10, 13); // 10:00 AM to 1:00 PM IST
        if (!isAllowed) {
          const ist = getISTTime();
          return res.status(403).json({
            message: `Mobile login/access is allowed only between 10:00 AM and 1:00 PM IST. Current time in IST is ${ist.formattedTime}. Please access the platform from desktop or wait for the allowed hours.`,
            errorType: 'MOBILE_TIME_BLOCK',
            currentTimeIST: ist.formattedTime,
          });
        }
      }

      next();
    } catch (error) {
      console.error('Authentication Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token verification failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token is missing' });
  }
};

// Middleware to authorize specific roles (e.g. admin)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role '${req.user?.role}' is not authorized to access this route` });
    }
    next();
  };
};
