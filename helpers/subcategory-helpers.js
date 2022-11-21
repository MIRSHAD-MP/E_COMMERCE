const collection = require('../config/collections')
const db = require('../config/connection')
const objectId = require ('mongodb').ObjectId

module.exports = {

    addSubcategory:(subcategory,callback)=>{
        db.get().collection(collection.SUBCATEGORY_COLLECTION).insertOne(subcategory).then((data)=>{
            callback(data.insertedId)
        })
    },

    getAllSubcategories:()=>{
        return new Promise(async(resolve,reject)=>{
            let subcategories = await db.get().collection(collection.SUBCATEGORY_COLLECTION).find().toArray()
            resolve(subcategories)
        })
    },

    getAllproductSubcategories:(category)=>{
        return new Promise(async(resolve,reject)=>{
            let productSubcategories = await db.get().collection(collection.SUBCATEGORY_COLLECTION).find({product_category: category}).toArray()
            resolve(productSubcategories)
        })
    }

}