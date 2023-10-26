/* eslint-disable prefer-const */
import T1HtmlContent from '../models/T1HtmlContent.js';
import Util from '../utils/Util.js';

class HtmlContentController {

  static async getAccountActivationContent() {
    const template = await T1HtmlContent.findOne({
      attributes: ['content'],
      where: { pk: 1 } });
    return template;
  }

}

export default HtmlContentController;
