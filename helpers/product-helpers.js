const db = require('../config/connection')
const collection = require('../config/collections')
const { response } = require('express')
const { callbackPromise } = require('nodemailer/lib/shared')
const { log } = require('handlebars')
var objectId = require ('mongodb').ObjectId


module.exports = {

    addProduct:(product,callback) => {
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.insertId)
        })   
    },

    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            const products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve (products)
        })
    },

    getSingleProduct:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            const product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
            resolve(product)
        })
    },

    getAllproductByCategories:(category)=>{
        return new Promise(async(resolve,reject)=>{
            const products = await db.get().collection(collection.PRODUCT_COLLECTION).find({product_category: category}).toArray()
            resolve(products)
        })
    },

    getAllproductBySubCategories:(category, subcategory)=>{
        return new Promise(async(resolve,reject)=>{
            const products = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                product_category: category,
                product_subcategory: subcategory
            }).toArray()
            resolve(products)
        })
    },

    getProductDetails: (proId) => {
        return new Promise(async(resolve,reject)=>{
             db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: objectId(proId)}).then((product) => {
                resolve(product)
             })
        })
    },

    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).
            updateOne({_id: objectId(proId)},{
                $set:{
                    product_name: proDetails.product_name,
                    brand_name: proDetails.brand_name,
                    product_price: proDetails.product_price,
                    product_description: proDetails.product_description,
                    available_quantity:proDetails.available_quantity
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    
}