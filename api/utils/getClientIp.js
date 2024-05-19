// utils/getClientIp.js
export default function getClientIp(req) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = xForwardedFor ? xForwardedFor.split(',')[0] : req.connection.remoteAddress;
    return ip;
  }
  