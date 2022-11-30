const db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { PRODUCT_COLLECTION } = require("../config/collections");
const { response } = require("express");
const objectId = require("mongodb").ObjectId;

module.exports = {
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let loginStatus = false;
        let response = {};
        let admin = await db
          .get()
          .collection(collection.ADMIN_COLLECTION)
          .findOne({ email: adminData.email });
        if (admin) {
          bcrypt.compare(adminData.password, admin.password).then((status) => {
            if (status) {
              response.admin = admin;
              response.status = true;
              resolve(response);
              console.log("login success");
            } else {
              resolve({ status: false });
            }
          });
        } else {
          resolve({ status: false });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getAllUsers: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let users = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .find()
          .toArray();
        resolve(users);
      } catch (error) {
        reject(error);
      }
    });
  },

  getOrderProducts: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderItems = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $unwind: {
                path: "$products",
              },
            },
            {
              $lookup: {
                from: "product",
                localField: "products.item",
                foreignField: "_id",
                as: "result",
              },
            },
            {
              $unwind: {
                path: "$result",
              },
            },
            {
              $project: {
                orderStatus: 1,
                deliveryDetails: 1,
                productname: "$result.name",
                date: 1,
                time: 1,
                productId: "$products.item",
                product_name: "$result.product_name",
                category: "$result.product_category",
                sub_category: "$result.product_subcategory",
                totalAmount: {
                  $multiply: [
                    "$products.quantity",
                    { $toInt: "$result.product_price" },
                  ],
                },
                quantity: "$products.quantity",
                payment: "$paymentMethod",
                status: "$products.status",
                image: "$result.images",
              },
            },
            {
              $sort: { date: -1, time: -1 },
            },
          ])
          .toArray();
        resolve(orderItems);
      } catch (error) {
        reject(error);
      }
    });
  },

  changedeliveryStatus: (orderId, productId, status) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deliveryStatus = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId), "products.item": objectId(productId) },
            {
              $set: {
                "products.$.status": status,
              },
            }
          );
        resolve(deliveryStatus);
      } catch (error) {
        reject(error);
      }
    });
  },

  getUsersCount: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const usersCount = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .count();
        resolve(usersCount);
      } catch (error) {
        reject(error);
      }
    });
  },

  getProductCount: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const productCount = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .count();
        resolve(productCount);
      } catch (error) {
        reject(error);
      }
    });
  },

  totalPlaced: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let placed = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $unwind: {
              path: "$products",
            },
          },
          {
            $project: {
              status: "$products.status",
            },
          },
          {
              $match: {
                status: "placed",
              },
            },
        ])
        .toArray();
      resolve(placed.length);
      } catch (error) {
        reject(error)
      }
    });
  },
  totalPacked: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let packed = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $unwind: {
              path: "$products",
            },
          },
          {
            $project: {
              status: "$products.status",
            },
          },
          {
              $match: {
                status: "packed",
              },
            },
        ])
        .toArray();
      resolve(packed.length);
      } catch (error) {
        reject(error)
      }
    });
  },
  totalShipped: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let shipped = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $unwind: {
              path: "$products",
            },
          },
          {
            $project: {
              status: "$products.status",
            },
          },
          {
              $match: {
                status: "shipped",
              },
            },
        ])
        .toArray();
      resolve(shipped.length);
      } catch (error) {
        reject(error)
      }
    });
  },
  totalDelivered: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let delivered = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $unwind: {
              path: "$products",
            },
          },
          {
            $project: {
              status: "$products.status",
            },
          },
          {
              $match: {
                status: "delivered",
              },
          },
        ])
        .toArray();
      resolve(delivered.length);
      } catch (error) {
        reject(error)
      }
    });
  },
  totalCancelled: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let cancelled = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $unwind: {
              path: "$products",
            },
          },
          {
            $project: {
              status: "$products.status",
            },
          },
          {
              $match: {
                status: "cancelled",
              },
            },
        ])
        .toArray();
      resolve(cancelled.length);
      } catch (error) {
        reject(error)
      }
    });
  },
  totalCod:() => {
    return new Promise (async(resolve,reject) => {
      try {
      const cod = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            paymentMethod :"cod"
          }
        }
      ]).toArray()
      resolve(cod.length)
      } catch (error) {
        reject(error)
      }
    })
  },
  totalOnline:() => {
    return new Promise (async(resolve,reject) => {
      try {
      const online = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            paymentMethod :"online"
          }
        }
      ]).toArray()
      resolve(online.length)
      } catch (error) {
        reject(error)
      }
    })
  },
  totalRevenue: () => {
    try {
      return new Promise(async (resolve, reject) => {
        let revenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $unwind: {
              path: "$products",
            },
          },
          {
            $lookup: {
              from: "product",
              localField: "products.item",
              foreignField: "_id",
              as: "result",
            },
          },
          {
            $unwind: {
              path: "$result",
            },
          },
          {
            $project: {
              totalAmount: {
                $multiply: [
                  "$products.quantity",
                  { $toInt: "$result.product_price" },
                ],
              },
              status: "$products.status",
            },
          },
          {
            $match: {
              status: "delivered",
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: {
                $sum: "$totalAmount",
              },
            },
          },
          ])
          .toArray()
          resolve(revenue)
      });
    } catch (error) {
      reject(error);
    }
  }
};
