/* eslint-disable no-restricted-globals */
/* eslint-disable max-len */
import { Op } from 'sequelize';
import querystring from 'querystring';
import { sequelizeConn } from '../dbConnection.js';
import T3SafeStorage from '../models/T3SafeStorage.js';
import Util from '../utils/Util.js';
import T3UserDevices from '../models/T3UserDevices.js';

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
    const userFk = await T3UserDevices.getUserPkByAuthenticatedRequest(request);

    try {
      const saltHex = Util.generateHexString();
      const iv = Util.generateHexString();
      const encryptedPassword = Util.encryptPassword(password, saltHex, iv);

      await T3SafeStorage.create({
        userFk,
        title,
        website,
        username,
        password: encryptedPassword,
        initVecHex: iv,
        saltHex,
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
      if (Object.keys(this.columnForQuery).includes(key.toLowerCase())) {
        sanitizedQuery[key.toLowerCase()] = request.query[key];
      } else {
        needRedirect = true;
      }
    });
    let redirectUrl = '/datas';

    if (!Util.isEmptyString(sanitizedQuery.search)) {
      try {
        sanitizedQuery.search = sanitizedQuery.search.toLowerCase();
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

    if (!Util.isEmptyString(sanitizedQuery['sort-title'])) {
      try {
        sanitizedQuery['sort-title'] = Util.getSort(sanitizedQuery['sort-title']);
      } catch (error) {
        delete sanitizedQuery['sort-title'];
        needRedirect = true;
      }
    }

    if (!Util.isEmptyString(sanitizedQuery['sort-website'])) {
      try {
        sanitizedQuery['sort-website'] = Util.getSort(sanitizedQuery['sort-website']);
      } catch (error) {
        delete sanitizedQuery['sort-website'];
        needRedirect = true;
      }
    }

    if (!Util.isEmptyString(sanitizedQuery['sort-created-at'])) {
      try {
        sanitizedQuery['sort-created-at'] = Util.getSort(sanitizedQuery['sort-created-at']);
      } catch (error) {
        delete sanitizedQuery['sort-created-at'];
        needRedirect = true;
      }
    }

    if (!Util.isEmptyString(sanitizedQuery['sort-updated-at'])) {
      try {
        sanitizedQuery['sort-updated-at'] = Util.getSort(sanitizedQuery['sort-updated-at']);
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

  static getListOrderSequelize(request) {
    const order = [];
    Object.keys(request.query).forEach((key) => {
      if (Object.keys(this.columnForQuery).includes(key) && this.columnForQuery[key] !== undefined) {
        order.push([this.columnForQuery[key], request.query[key].toUpperCase()]);
      }
    });

    return order;
  }

  static async getDatas(request, h) {
    // const userFk = await T3UserDevices.getUserPkByAuthenticatedRequest(request);
    const userFk = 'z_MQq-HlkRoOSLFh6tlNm';
    console.log('HEEEEEEEREEEEEEEEEEEE', userFk);

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
      datas.datas.forEach((data) => { data.password = Util.decryptPassword(data.password, data.saltHex, data.initVecHex); });
      datas.datasCount = datas.total;
      return Util.response(h, true, 'Success, get all datas', 200, datas);
    }

    if (datas.total <= 0) {
      return Util.response(h, true, 'Success, get all datas', 200, datas);
    }

    // get some data with query params
    const { needRedirect, redirectUrl } = SafeStorageController.preprocessRequestQuery(request, h, datas.total);
    if (needRedirect) {
      return h.redirect(redirectUrl).takeover();
    }

    let {
      search,
      page,
      limit,
    } = request.query;

    ({ minPage: datas.minPage, maxPage: datas.maxPage } = Util.minMaxPagination(datas.total, limit));

    const startIndex = (page - 1) * limit;
    const whereCondition = {
      userFk,
      isDeleted: false,
    };

    if (!Util.isEmptyString(search)) {
      whereCondition[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { website: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
      ];
    }

    datas.datas = await T3SafeStorage.findAll({
      offset: startIndex,
      limit,
      where: whereCondition,
      order: SafeStorageController.getListOrderSequelize(request),
    });

    datas.datas.forEach((data) => { data.password = Util.decryptPassword(data.password, data.saltHex, data.initVecHex); });
    datas.datasCount = datas.datas.length;
    return Util.response(h, true, 'Success, get some datas', 200, datas);
  }

}

export default SafeStorageController;
