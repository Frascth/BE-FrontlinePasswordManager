/* eslint-disable prefer-const */
class SafeStorageController {

  static async checkSession(request, h) {
    return request.auth;
  }

}

export default SafeStorageController;
