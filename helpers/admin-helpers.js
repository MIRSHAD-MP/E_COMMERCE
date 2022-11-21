const db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { PRODUCT_COLLECTION } = require("../config/collections");
const { response } = require("express");
const objectId = require("mongodb").ObjectId;

module.exports = {
  doLogin: (adminData) => {
    console.log(adminData);
    return new Promise(async (resolve, reject) => {
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
    });
  },

  getAllUsers: (userId) => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(users);
    });
  },

  getOrderProducts: () => {
    try {
      return new Promise(async (resolve, reject) => {
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
      });
    } catch (error) {
      reject(error);
    }
  },

  changedeliveryStatus: (orderId, productId, value) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (value == "delivered") {
          const deliveryStatus = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(orderId), "products.item": objectId(productId) },
              {
                $set: {
                  "products.$.status": delivery,
                },
              }
            );
          resolve(deliveryStatus);
        } else {
          const deliveryStatus = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              { _id: objectId(orderId), "products.item": objectId(productId) },
              {
                $set: {
                  "products.$.status": delivery,
                },
              }
            );
          resolve(deliveryStatus);
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getUsersCount:() => {
    let count = 0;
    try {
      return new Promise (async(resolve,reject) => {
        const usersCount = await db.get().collection(collection.USER_COLLECTION).count()
        resolve(usersCount)
      })
    } catch (error) {
      reject(error)
    }
  },

  getProductCount: () => {
    let count = 0;
    try {
      return new Promise(async(resolve,reject) => {
        const productCount = await db.get().collection(collection.PRODUCT_COLLECTION).count()
        resolve(productCount)
      })
    } catch (error) {
      reject(error)
    }
  }
}
