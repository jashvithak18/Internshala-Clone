import { getISTTime, isWithinISTHourWindow } from '../utils/timeHelper.js';

const paymentGuard = (req, res, next) => {
  // PAYMENTS RULE: Payments allowed only between 10:00 AM and 11:00 AM IST
  const isAllowed = isWithinISTHourWindow(10, 11); // 10:00 AM to 11:00 AM (inclusive of 10:00 to 10:59)
  
  if (!isAllowed) {
    const ist = getISTTime();
    return res.status(403).json({
      message: `Payments are strictly allowed only between 10:00 AM and 11:00 AM IST. Current IST time is ${ist.formattedTime}. Please make your payment within the specified time window.`,
      errorType: 'PAYMENT_TIME_BLOCK',
      currentTimeIST: ist.formattedTime,
    });
  }

  next();
};

export default paymentGuard;
