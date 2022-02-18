import { Boolean } from "aws-sdk/clients/apigateway";
import _ from "lodash";
import {
  ICreateNotification,
  IGetNotification,
  IMongooseUpdate,
  INotification,
  IPaginationNotification,
  IPaginationOption,
} from "../helpers/interface.helper";
import Populate from "../constants/populate.constant";
import Notification from "../models/notification.model";
import { arrayToText, getFromBetween } from "../helpers/functions.helper";
import NOTIFICATION from "../constants/notification.constant";

const notificationService = {
  createNotification: async (body: ICreateNotification): Promise<INotification> => {
    const createNotification: INotification = await Notification.create(body);
    return createNotification;
  },
  editNotification: async (find: IGetNotification, update: INotification): Promise<Boolean> => {
    const updateNotification: IMongooseUpdate = await Notification.updateOne(find, update);
    if (updateNotification.modifiedCount === 0) {
      return false;
    }
    return true;
  },
  editManyNotification: async (find: INotification, update: INotification): Promise<Boolean> => {
    const updateNotification: IMongooseUpdate = await Notification.updateMany(find, update);
    if (updateNotification.modifiedCount === 0) {
      return false;
    }
    return true;
  },
  getNotification: async (find: INotification): Promise<INotification> => {
    const findNotification: INotification = await Notification.findOne(find).lean();
    return findNotification;
  },
  getManyNotification: async (find: INotification): Promise<INotification[]> => {
    const findManyNotification: INotification[] = await Notification.find(find).populate(Populate.user).populate(Populate.from).lean();
    return findManyNotification;
  },
  getManyNotificationWithPagination: async (query: IGetNotification, options: IPaginationOption): Promise<IPaginationNotification> => {
    query.is_deleted = false;
    const totalDocs = await Notification.find(query).count();
    const getManyNotification: INotification[] = await Notification.find(query)
      .skip(options.skip)
      .limit(options.limit)
      .populate(Populate.user)
      .populate(Populate.from)
      .lean();
    const result: IPaginationNotification = {
      docs: getManyNotification,
      skip: options.skip,
      limit: options.limit,
      totalDocs,
    };
    return result;
  },
  deleteNotification: async (find: INotification): Promise<Boolean> => {
    const deleteNotification: IMongooseUpdate = await Notification.updateOne(find, { $set: { is_deleted: true } });
    if (deleteNotification.modifiedCount === 0) {
      return false;
    }
    return true;
  },
  deleteManyNotification: async (find: INotification): Promise<Boolean> => {
    const deleteManyNotification: IMongooseUpdate = await Notification.updateMany(find, {
      $set: { is_deleted: true },
    });
    if (deleteManyNotification.modifiedCount === 0) {
      return false;
    }
    return true;
  },

  addNotification: async (notification: ICreateNotification, repeat = false): Promise<INotification> => {
    if (!repeat) {
      const findQuery: ICreateNotification = {
        user: notification.user,
        type: notification.type,
        seen: false,
        category: notification.category,
        message: notification.category,
      };
      let notifications: INotification[] = await Notification.find(findQuery);
      if (_.isEmpty(notifications)) {
        const addNotification: INotification = await Notification.create(notification);
        return addNotification;
      }
    } else {
      const addNotification: INotification = await Notification.create(notification);
      return addNotification;
    }
  },
  mergeNotifications: (notifications: any) => {
    const mergedNotification = [];
    notifications.map((notification: INotification) => {
      if (NOTIFICATION[notification.type]) {
        notification.title = NOTIFICATION[notification.type]?.title;
        notification.body = NOTIFICATION[notification.type]?.body;
        if (notification.body) {
          const str = notification.body;
          const result = getFromBetween.get(str, "{{", "}}");
          if (result.length) {
            result.map((mf) => {
              notification.body = notification.body.replace(
                `{{${mf}}}`,
                Array.isArray(notification.merge_fields[mf]) ? arrayToText(notification.merge_fields[mf]) : notification.merge_fields[mf]
              );
            });
          }
        }
        mergedNotification.push(notification);
      }
    });
    return mergedNotification;
  },
};

export default notificationService;
