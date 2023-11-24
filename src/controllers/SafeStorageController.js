/* eslint-disable no-restricted-globals */
/* eslint-disable max-len */
import { toLower } from 'lodash';
import { sequelizeConn } from '../dbConnection.js';
import T3SafeStorage from '../models/T3SafeStorage.js';
import Util from '../utils/Util.js';
import { SERVER } from '../utils/constant.js';

/* eslint-disable prefer-const */
class SafeStorageController {

  static async create(request, h) {
    const { title, website, username, password } = request.payload;
    const transaction = await sequelizeConn.transaction();
    const userFk = Util.getUserPk(request);

    try {
      const encryptedPassword = Util.encryptText(password);
      await T3SafeStorage.create({
        userFk,
        title,
        website,
        username,
        password: encryptedPassword,
      }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      return Util.response(h, false, error, 500);
    }

    return Util.response(h, true, 'Success, data saved', 201);
  }

  static preprocessRequestQuery(request, h, totalDatas) {
    let {
      search,
      'sort-title': sortTitle,
      'sort-website': sortWebsite,
      'sort-created-at': sortCreatedAt,
      page,
      limit,
    } = request.query;

    let needRedirect = false;
    let redirectUrl = '/datas?';
    const queryParams = [];

    try {
      queryParams.push(`search=${search.toLowerCase()}`);
      // request.query.search = search.toLowerCase();
      // search = search.toLowerCase();
    } catch (error) {
      // request.query.search = undefined;
      needRedirect = true;
    }

    try {
      queryParams.push(`sort-title=${Util.getSort(sortTitle)}`);
      // request.query['sort-title'] = Util.getSort(sortTitle);
    } catch (error) {
      // request.query['sort-title'] = undefined;
      needRedirect = true;
    }

    try {
      queryParams.push(`sort-website=${Util.getSort(sortWebsite)}`);
      // request.query['sort-website'] = Util.getSort(sortWebsite);
    } catch (error) {
      // request.query['sort-website'] = undefined;
      needRedirect = true;
    }

    try {
      queryParams.push(`sort-created-at=${Util.getSort(sortCreatedAt)}`);
      // request.query['sort-created-at'] = Util.getSort(sortCreatedAt);
    } catch (error) {
      // request.query['sort-created-at'] = undefined;
      needRedirect = true;
    }

    try {
      limit = parseInt(limit, 10);
      if (isNaN(limit)) {
        throw new Error('Limit must be number');
      }
      if (limit < 1) {
        throw new Error('Limit must be positive number');
      }
      queryParams.push(`limit=${limit}`);
      // request.query.limit = limit;
    } catch (error) {
      limit = 10;
      queryParams.push('limit=10');
      // request.query.limit = 10;
      needRedirect = true;
    }

    try {
      page = parseInt(page, 10);
      const { minPage, maxPage } = Util.minMaxPagination(totalDatas, limit);
      if (page < minPage) {
        throw new Error('Page must not below the minPage');
      }
      if (page > maxPage) {
        throw new Error('Page must not above the maxPage');
      }
      queryParams.push(`page=${page}`);
      // request.query.page = page;
    } catch (error) {
      page = 1;
      queryParams.push('page=1');
      // request.query.page = 1;
      needRedirect = true;
    }

    if (needRedirect) {
      redirectUrl += queryParams.join('&');
    }

    return { needRedirect, redirectUrl };

  }

  static async getDatas(request, h) {
    // const userFk = Util.getUserPk(request);
    const userFk = 'e0naCzvo7L4KlrlGWYE-z';

    const isRedirected = !Util.isEmptyString(request.info.referrer);
    let datas = {
      minPage: 1,
      page: 1,
      maxPage: 1,
      limit: undefined,
      isRedirected,
      redirectUrl: request.url.href,
      referrer: request.info.referrer,
      datasCount: undefined,
      total: undefined,
      datas: {},
    };

    datas.total = await T3SafeStorage.count({
      where: {
        userFk, isDeleted: false,
      },
    });

    // get all data no query params
    if (Object.keys(request.query).length === 0) {
      datas.datas = await T3SafeStorage.findAll({ where: { userFk, isDeleted: false } });
      datas.datas.forEach((data) => { data.password = Util.decryptText(data.password); });
      datas.datasCount = datas.total;
      return Util.response(h, true, 'Success, get all datas', 200, datas);
    }

    // get some data with query params
    const { needRedirect, redirectUrl } = this.preprocessRequestQuery(request, h, datas.totalDatas);
    if (needRedirect) {
      return h.redirect(redirectUrl).takeover();
    }

    let {
      search,
      'sort-title': sortTitle,
      'sort-website': sortWebsite,
      'sort-created-at': sortCreatedAt,
      page,
      limit,
    } = request.query;

    const startIndex = (page - 1) * limit;

    datas.datas = await T3SafeStorage.findAll({
      offset: startIndex,
      limit,
      where: { userFk, isDeleted: false },
      order: [['createdAt', 'DESC']],
    });

    datas.datas.forEach((data) => { data.password = Util.decryptText(data.password); });
    datas.datasCount = datas.datas.length;
    return Util.response(h, true, 'Success, get some datas', 200, datas);
  }

}

export default SafeStorageController;
