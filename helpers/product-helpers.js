const db = require('../config/connection')
const collection = require('../config/collections')
const { response } = require('express')
const { callbackPromise } = require('nodemailer/lib/shared')
const { log } = require('handlebars')
var objectId = require('mongodb').ObjectId


module.exports = {

    addProduct: (product, callback) => {
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.insertId)
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },

    getSingleProduct: (proId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })
                resolve(product)
            } catch (error) {
                reject(error)
            }
        })
    },

    getAllproductByCategories: (category) => {
        return new Promise(async (resolve, reject) => {
            try {
                const products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ product_category: category }).toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }

        })
    },

    getAllproductBySubCategories: (category, subcategory) => {
        return new Promise(async (resolve, reject) => {
            try {
                const products = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                    product_category: category,
                    product_subcategory: subcategory
                }).toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },

    getProductDetails: (proId) => {
        return new Promise(async (resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                    resolve(product)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).
                    updateOne({ _id: objectId(proId) }, {
                        $set: {
                            product_name: proDetails.product_name,
                            brand_name: proDetails.brand_name,
                            product_price: proDetails.product_price,
                            product_description: proDetails.product_description,
                            available_quantity: proDetails.available_quantity
                        }
                    }).then((response) => {
                        resolve()
                    })
            } catch (error) {
                reject(error)
            }
        })
    },

}