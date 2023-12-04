/* eslint-disable no-restricted-globals */
/* eslint-disable max-len */
import querystring from 'querystring';
import { sequelizeConn } from '../dbConnection.js';
import T3SafeStorage from '../models/T3SafeStorage.js';
import Util from '../utils/Util.js';

/* eslint-disable prefer-const */
class SafeStorageController {

  static columnForQuery = {
    search: undefined,
    page: undefined,
    limit: undefined,
    'sort-title': 'title',
    'sort-website': 'website',
    'sort-created-at': 'createdAt',
    'sort-updated-at': 'updatedAt',
  };

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

    const sanitizedQuery = {};
    let needRedirect = false;

    // filter for valid keys
    Object.keys(request.query).forEach((key) => {
      if (Object.keys(this.columnForQuery).includes(key)) {
        sanitizedQuery[key] = request.query[key];
      } else {
        needRedirect = true;
      }
    });
    let redirectUrl = '/datas';

    if (!Util.isEmptyString(request.query.search)) {
      try {
        sanitizedQuery.search = request.query.search.toLowerCase();
      } catch (error) {
        delete sanitizedQuery.search;
        needRedirect = true;
      }
    }

    try {
      sanitizedQuery.limit = parseInt(request.query.limit, 10);
      if (isNaN(sanitizedQuery.limit)) {
        throw new Error('Limit must be number');
      }
      if (sanitizedQuery.limit < 1) {
        throw new Error('Limit must be positive number');
      }
    } catch (error) {
      sanitizedQuery.limit = 10;
      needRedirect = true;
    }

    try {
      sanitizedQuery.page = parseInt(request.query.page, 10);
      const { minPage, maxPage } = Util.minMaxPagination(totalDatas, sanitizedQuery.limit);
      if (isNaN(sanitizedQuery.page)) {
        throw new Error('Page must be number');
      }
      if (sanitizedQuery.page < minPage) {
        throw new Error('Page must not below the minPage');
      }
      if (sanitizedQuery.page > maxPage) {
        throw new Error('Page must not above the maxPage');
      }
    } catch (error) {
      sanitizedQuery.page = 1;
      needRedirect = true;
    }

    if (!Util.isEmptyString(request.query['sort-title'])) {
      try {
        sanitizedQuery['sort-title'] = Util.getSort(request.query['sort-title']);
      } catch (error) {
        delete sanitizedQuery['sort-title'];
        needRedirect = true;
      }
    }

    if (!Util.isEmptyString(request.query['sort-website'])) {
      try {
        sanitizedQuery['sort-website'] = Util.getSort(request.query['sort-website']);
      } catch (error) {
        delete sanitizedQuery['sort-website'];
        needRedirect = true;
      }
    }

    if (!Util.isEmptyString(request.query['sort-created-at'])) {
      try {
        sanitizedQuery['sort-created-at'] = Util.getSort(request.query['sort-created-at']);
      } catch (error) {
        delete sanitizedQuery['sort-created-at'];
        needRedirect = true;
      }
    }

    if (!Util.isEmptyString(request.query['sort-updated-at'])) {
      try {
        sanitizedQuery['sort-updated-at'] = Util.getSort(request.query['sort-updated-at']);
      } catch (error) {
        delete sanitizedQuery['sort-updated-at'];
        needRedirect = true;
      }
    }

    if (needRedirect) {
      redirectUrl += `?${querystring.stringify(sanitizedQuery)}`;
    } else {
      redirectUrl = request.url.href;
    }

    return { needRedirect, redirectUrl };

  }

  static getListSequelizeOrder(request) {
    const order = [];
    Object.keys(request.query).forEach((key) => {
      if (Object.keys(this.columnForQuery).includes(key) && this.columnForQuery[key] !== undefined) {
        order.push([this.columnForQuery[key], request.query[key].toUpperCase()]);
      }
    });

    return order;
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
    const { needRedirect, redirectUrl } = SafeStorageController.preprocessRequestQuery(request, h, datas.total);
    if (needRedirect) {
      return h.redirect(redirectUrl).takeover();
    }

    let {
      page,
      limit,
    } = request.query;

    ({ minPage: datas.minPage, maxPage: datas.maxPage } = Util.minMaxPagination(datas.total, limit));

    const startIndex = (page - 1) * limit;

    const orderList = SafeStorageController.getListSequelizeOrder(request);

    datas.datas = await T3SafeStorage.findAll({
      offset: startIndex,
      limit,
      where: { userFk, isDeleted: false },
      order: orderList,
    });

    datas.datas.forEach((data) => { data.password = Util.decryptText(data.password); });
    datas.datasCount = datas.datas.length;
    return Util.response(h, true, 'Success, get some datas', 200, datas);
  }

}

export default SafeStorageController;
