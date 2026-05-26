/**
 * Gets the current time in Indian Standard Time (IST)
 * IST is UTC + 5:30
 */
export const getISTTime = () => {
  const now = new Date();
  
  // Calculate IST using offset arithmetic (5 hours 30 minutes = 330 minutes)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (330 * 60000));
  
  return {
    hours: istDate.getHours(),
    minutes: istDate.getMinutes(),
    seconds: istDate.getSeconds(),
    dateString: istDate.toDateString(),
    formattedTime: istDate.toLocaleTimeString('en-US', { hour12: true }),
    rawDate: istDate
  };
};

/**
 * Checks if the current time falls between a specific hour window in IST
 * @param {number} startHour - Starting hour (inclusive)
 * @param {number} endHour - Ending hour (exclusive)
 * @returns {boolean}
 */
export const isWithinISTHourWindow = (startHour, endHour) => {
  const ist = getISTTime();
  return ist.hours >= startHour && ist.hours < endHour;
};
