const collection = require('../config/collections')
const db = require('../config/connection')
const objectId = require('mongodb').ObjectId

module.exports = {

    addCategory: (category, callback) => {
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllCategories: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
                resolve(categories)
            } catch (error) {
                reject(error)
            }
        })
    }
}