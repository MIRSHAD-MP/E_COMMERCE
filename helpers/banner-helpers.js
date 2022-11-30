const db = require('../config/connection')
const collection = require('../config/collections')
var objectId = require('mongodb').ObjectId


module.exports = {

    addBanner: (banner, callback) => {
        db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((data) => {
            callback(data.insertId)
        })
    },

    getAllBanners: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const banners = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
                resolve(banners)
            } catch (error) {
                reject(error)
            }
        })
    },

}
