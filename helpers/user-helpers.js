const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt');
const { response } = require('express');
const Razorpay = require('razorpay');
const moment = require('moment')
const { promises, pipeline } = require('nodemailer/lib/xoauth2');
const { resolve } = require('path');
const { realpathSync } = require('fs');
const objectId = require('mongodb').ObjectId
require("dotenv").config();


const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_ID,
});

module.exports = {

    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    resolve(data)
                })
            } catch (error) {
                reject(error)
            }

        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let loginStatus = false
                let response = {}
                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
                if (user) {
                    bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {
                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {
                            resolve({ status: false })
                        }
                    })
                } else {
                    resolve({ status: false })
                }
            } catch (error) {
                reject(error)
            }
        })
    },

    editProfile: (userId, userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                    $set: {
                        name: userData.name
                    }
                })
                resolve(response)
            } catch (error) {
                reject(error)
            }
        })
    },

    userData: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const userData = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                resolve(userData)
            } catch (error) {
                reject(error)
            }
        })
    },

    addToCart: (proId, userId) => {
        const proObj = {
            item: objectId(proId),
            quantity: 1,
            status:"placed"
        }
        return new Promise(async (resolve, reject) => {
            try {
                let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                if (userCart) {
                    let proExist = userCart.products.findIndex(product => product.item == proId)
                    if (proExist != -1) {
                        db.get().collection(collection.CART_COLLECTION)
                            .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                                {
                                    $inc: { 'products.$.quantity': 1 }
                                }
                            ).then(() => {
                                resolve({ added: true })
                            })
                    } else {
                        db.get().collection(collection.CART_COLLECTION)
                            .updateOne({ user: objectId(userId) },
                                {
                                    $push: { products: proObj }
                                }
                            ).then((response) => {
                                resolve({ added: true })
                            })
                    }
                } else {
                    let cartObj = {
                        user: objectId(userId),
                        products: [proObj]
                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                        resolve({ added: true })
                    })
                }
            } catch (error) {
                reject(error)
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    {
                        $addFields: {
                            productTotal: { $sum: { $multiply: ["$quantity", { $toInt: "$product.product_price" }] } }
                        }
                    }
                ]).toArray()
                resolve(cartItems)
            } catch (error) {
                reject(error)
            }

        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = 0
                let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                if (cart) {
                    count = cart.products.length
                }
                resolve(count)
            } catch (error) {
                reject(error)
            }
        })
    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            try {
                if (details.count == -1 && details.quantity == 1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ _id: objectId(details.cart) },
                            {
                                $pull: { products: { item: objectId(details.product) } }
                            }
                        ).then((response) => {
                            resolve({ removeProduct: true })
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                            {
                                $inc: { 'products.$.quantity': details.count }
                            }
                        ).then((response) => {
                            resolve(true)
                        })
                }
            } catch (error) {
                reject(error)
            }

        })
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ["$quantity", { $toInt: "$product.product_price" }] } }
                        }
                    }

                ]).toArray()
                resolve(total[0]?.total)
            } catch (error) {
                reject(error)
            }

        })
    },

    deleteCartProduct: (details) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } catch (error) {
                reject(error)
            }

        })
    },

    addToWishlist: (proId, userId) => {
        const proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            try {
                let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
                if (userWishlist) {
                    let proExist = userWishlist.products.findIndex(product => product.item == proId)
                    if (proExist != -1) {
                        db.get().collection(collection.WISHLIST_COLLECTION)
                            .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                                {
                                    $inc: { 'products.$.quantity': 1 }
                                }
                            ).then(() => {
                                resolve({ added: true })
                            })
                    } else {
                        db.get().collection(collection.WISHLIST_COLLECTION)
                            .updateOne({ user: objectId(userId) },
                                {
                                    $push: { products: proObj }
                                }
                            ).then((response) => {
                                resolve({ added: true })
                            })
                    }
                } else {
                    let wishlistObj = {
                        user: objectId(userId),
                        products: [proObj]
                    }
                    db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then((response) => {
                        resolve({ added: true })
                    })
                }
            } catch (error) {
                reject(error)
            }
        })
    },

    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray()
                resolve(wishlistItems)
            } catch (error) {
                reject(error)
            }
        })
    },

    getWishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = 0
                let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION)
                    .findOne({ user: objectId(userId) })
                if (wishlist) {
                    count = wishlist.products.length
                }
                resolve(count)
            } catch (error) {
                reject(error)
            }

        })
    },

    deleteWishlistProduct: (details) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.WISHLIST_COLLECTION)
                    .updateOne({ _id: objectId(details.wishlist) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } catch (error) {
                reject(error)
            }
        })
    },

    addAddress: (userId, addressData) => {
        create_random_id(15)
        function create_random_id(string_Length) {
            var randomString = ''
            var numbers = '1234567890'
            for (var i = 0; i < string_Length; i++) {
                randomString += numbers.charAt(Math.floor(Math.random() * numbers.length))
            }
            addressData._addId = "ADD" + randomString
        }
        let subAddress = {
            _addId: addressData._addId,
            name: addressData.name,
            phone: addressData.phone,
            building_name: addressData.building,
            street_name: addressData.street,
            city: addressData.city,
            district: addressData.district,
            state: addressData.state,
            pincode: addressData.pincode
        }
        return new Promise(async (resolve, reject) => {
            try {
                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                if (user.Addresses) {
                    if (user.Addresses.length < 2) {
                        await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                            $push: { Addresses: subAddress }
                        })
                        resolve()
                    } else {
                        resolve({ full: true })
                    }
                } else {
                    Addresses = [subAddress]
                    await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { Addresses } })
                    resolve()
                }
            } catch (error) {
                reject(error)
            }
        })
    },

    editAddress: (userId, addressId, addressData) => {
        return new Promise(async (resolve, reject) => {
            try {
                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId), "Addresses._addId": addressId }, {
                    $set: {
                        "Addresses.$.name": addressData.name,
                        "Addresses.$.phone": addressData.phone,
                        "Addresses.$.building": addressData.building,
                        "Addresses.$.street": addressData.street,
                        "Addresses.$.city": addressData.city,
                        "Addresses.$.district": addressData.district,
                        "Addresses.$.state": addressData.state,
                        "Addresses.$.pincode": addressData.pincode
                    }
                })
                resolve(response)
            } catch (error) {
                reject(error)
            }
        })
    },

    deleteAddress: (userId, addId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                    $pull: { Addresses: { _addId: addId } }
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            try {
                const status = order['payment-method'] == 'cod' ? 'placed' : 'pending';
                const dateIso = new Date();
                const date = moment(dateIso).format("YYYY/MM/DD");
                const time = moment(dateIso).format("HH:mm:ss");
                moment().format("MMMM Do YYYY, h:mm:ss a");
                moment(date).format("MM/DD/YYYY");

                const orderObj = {
                    date: date,
                    time: time,
                    isCancelled: false,
                    deliveryDetails: {
                        name: order.name,
                        phone: order.phone,
                        building_name: order.building,
                        street_name: order.street,
                        city: order.city,
                        district: order.district,
                        state: order.state,
                        pincode: order.pincode
                    },
                    userId: objectId(order.userId),
                    paymentMethod: order['payment-method'],
                    products: products,
                    totalAmount: total,
                    discount: parseInt(order.discount),
                    grandTotal: parseInt(order.grandTotal),
                }
                db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                    console.log(response)
                    db.get().collection(collection.CART_COLLECTION).deleteMany({ user: objectId(order.userId) })
                    console.log(response.insertedId)
                    resolve(response.insertedId)
                
                })
            } catch (error) {
                console.log(error)
                reject(error)
            }
        })
    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                resolve(cart.products)
            } catch (error) {
                reject(error)
            }
        })
    },

    getUserOrderDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const orderItems = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()
                resolve(orderItems);
            } catch (error) {
                reject(error);
            }
        });
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: { _id: objectId(orderId) }
                    },
                    {
                        $unwind: '$products'
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
                            image: "$result.images",
                            product_name: "$result.product_name",
                            category: "$result.product_category",
                            sub_category: "$result.product_subcategory",
                            price:"$result.product_price",
                            totalAmount: { $multiply: ["$products.quantity", { $toInt: "$result.product_price" }] },
                            quantity: "$products.quantity",
                            payment: "$paymentMethod",
                            status: "$products.status",
                        },
                    },
                    {
                        $sort: { date: -1}
                    },
                ]).toArray()
                resolve(orderItems)
            } catch (error) {
                reject(error)
            }

        })
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            try {
                const options = {
                    amount: total * 100,
                    currency: "INR",
                    receipt: "" + orderId,
                };
                instance.orders.create(options, function (err, order) {
                    if (err) {
                    } else {
                        resolve(order)
                    }
                });
            } catch (error) {
                reject(error)
            }

        })
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            try {
                const crypto = require('crypto');
                let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_ID);

                hmac.update(details["payment[razorpay_order_id]"] + "|" + details["payment[razorpay_payment_id]"]);

                hmac = hmac.digest("hex");

                if (hmac == details["payment[razorpay_signature]"]) {
                    resolve()
                } else {
                    reject()
                }
            } catch (error) {
                reject(error)
            }

        })
    },

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.ORDER_COLLECTION)
                    .updateOne({ _id: objectId(orderId) },
                        {
                            $set: {
                                status: "placed"
                            }
                        }
                    ).then(() => {
                        resolve()
                    })
            } catch (error) {
                reject(error)
            }

        })
    },

    cancelOrder: (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                let result =await db.get().collection(collection.ORDER_COLLECTION).update({ _id: objectId(data.order)},
                   {
                      $set: {
                        isCancelled: true
                      }
                    }
                )
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    },

    getBanner: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const banners = await db.get().collection(collection.BANNER_COLLECTION).find()
                    .toArray()
                resolve(banners)
            } catch (error) {
                reject(error)
            }
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

    addCoupon:(couponCode, userId) => {
        let usersId = objectId(userId)
        return new Promise(async (resolve, reject) => {
            try {
                let result = await db.get().collection(collection.COUPON_COLLECTION).findOne({coupon_code : couponCode })
                if (result) {
                    var d = new Date()
                    let str = d.toJSON().slice(0, 10)
                    if (str >= result.exp_date) {
                        resolve({ expired: true })
                    } else {
                        let user = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon_code : couponCode, users: { $in: [userId] } })
                        if (user) {
                            resolve({ used: true })
                        } else {
                            resolve(result)
                        }
                    }
                } else {
                    resolve({ notAvailable: true })
                }
            } catch (error) {
                reject(error)
            }

        })
    },
    addUserCoupon: (couponCode, userId) => {
        return new Promise(async (res, rej) => {
            console.log(couponCode)
            try {
                console.log("fdsjakflads")
                const data = await db.get().collection(collection.COUPON_COLLECTION).updateOne({coupon_code: couponCode}, {$push:{users: userId} })
                console.log("mirsha love basi")
                res(data)
            }catch (err) {
                rej()
            }
        })
    }
}
