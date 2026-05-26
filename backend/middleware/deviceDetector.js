import useragent from 'express-useragent';

const deviceDetector = (req, res, next) => {
  // Use express-useragent processing
  const ua = req.useragent || useragent.parse(req.headers['user-agent'] || '');
  
  // Extract browser and OS
  let browser = ua.browser || 'Unknown';
  let os = ua.os || 'Unknown';
  
  // Determine device type
  let deviceType = 'desktop';
  if (ua.isMobile || ua.isTablet) {
    deviceType = 'mobile';
  } else if (ua.isDesktop) {
    // Custom heuristic: OS X or Windows usually default to 'laptop' for average students
    deviceType = ua.os.includes('Windows') || ua.os.includes('OS X') ? 'laptop' : 'desktop';
  }

  // Parse IP Address (handle proxy forwarding headers)
  let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (ipAddress.includes(',')) {
    ipAddress = ipAddress.split(',')[0].trim();
  }
  if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
    ipAddress = '127.0.0.1';
  }

  req.deviceDetails = {
    browser,
    os,
    deviceType,
    ipAddress,
  };

  next();
};

export default deviceDetector;
