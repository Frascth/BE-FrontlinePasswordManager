/* eslint-disable prefer-const */
import T1HtmlContent from '../models/T1HtmlContent.js';
import Util from '../utils/Util.js';

class HtmlContentController {

  static async getAccountActivationContent() {
    const res = await T1HtmlContent.findAll();
    return res;
  }

}

export default HtmlContentController;
