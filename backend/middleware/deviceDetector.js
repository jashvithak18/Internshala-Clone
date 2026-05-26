import useragent from 'express-useragent';

const deviceDetector = (req, res, next) => {
  // Use express-useragent processing
  const ua = req.useragent || useragent.parse(req.headers['user-agent'] || '');
  
  // Extract browser and OS
  let browser = ua.browser || 'Unknown';
  let os = ua.os || 'Unknown';
  
  // Determine device type
  // Default parsing
  let deviceType = 'desktop';
  if (ua.isMobile || ua.isTablet) {
    deviceType = 'mobile';
  } else if (ua.isDesktop) {
    // Distinguish between a standard large screen workstation (desktop) and notebook (laptop)
    // We can use screen features on frontend or parse user-agent hints. 
    // To allow flexibility and manual client overrides, we check headers first.
    const clientDeviceOverride = req.headers['x-device-type'];
    if (clientDeviceOverride && ['desktop', 'laptop', 'mobile'].includes(clientDeviceOverride.toLowerCase())) {
      deviceType = clientDeviceOverride.toLowerCase();
    } else {
      // Custom heuristic: OS X or Windows usually default to 'laptop' for average students
      deviceType = ua.os.includes('Windows') || ua.os.includes('OS X') ? 'laptop' : 'desktop';
    }
  }

  // Support client browser override for Chrome OTP rule testing in non-Chrome environments
  if (req.headers['x-browser-override']) {
    browser = req.headers['x-browser-override'];
  }

  // Parse IP Address (handle proxy forwarding headers)
  let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (ipAddress.includes(',')) {
    ipAddress = ipAddress.split(',')[0].trim();
  }
  if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
    ipAddress = '127.0.0.1';
  }
  if (req.headers['x-ip-override']) {
    ipAddress = req.headers['x-ip-override'];
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
