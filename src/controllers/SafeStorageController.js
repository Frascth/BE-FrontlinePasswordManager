/* eslint-disable prefer-const */
class SafeStorageController {

  static async checkSession(request, h) {
    // const clientIP = request.headers['x-forwarded-for'] || request.info.remoteAddress;
    const clientIP = request.info.remoteAddress;
    return `Client IP Address: ${clientIP}`;
  }

}

export default SafeStorageController;
