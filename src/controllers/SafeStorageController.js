/* eslint-disable prefer-const */
class SafeStorageController {

  static async checkSession(request, h) {
    return 'tes';
    return { id: request.state.session };
  }

}

export default SafeStorageController;
