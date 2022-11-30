const db = require('../config/connection')
const collection = require('../config/collections')
var objectId = require('mongodb').ObjectId


module.exports = {

    addCoupon: (coupon,callback) => {
        db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((data) => {
            callback(data.insertId)
        })
    },

    getAllCoupons: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
                resolve(coupons)
            } catch (error) {
                reject(error)
            }
        })
    },

}
