var express = require('express');
const categoryHelpers = require('../../helpers/category-helpers');
const subcategoryHelpers = require('../../helpers/subcategory-helpers');
const userHelpers = require('../../helpers/user-helpers');
const productHelpers = require('../../helpers/product-helpers');
const session = require('express-session');
const { Router, response, json } = require('express');
const adminHelpers = require('../../helpers/admin-helpers');
const twilioHelpers = require('../../helpers/twilio-helpers');
var router = express.Router();
const getCategories = async()=>{
  return await categoryHelpers.getAllCategories()
}

const verifyLogin = (req,res,next) => {
  if (req.session.loggedIn){
    next()
  } else {
    res.json({logged:false})
    res.redirect ('/login')
  }
}

//Home page
router.get('/',async(req, res,next) => {
  try {
    let user = req.session.user
  let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  } 
  const categories = await getCategories()
  const products = await productHelpers.getAllProducts()
  res.render('user/index',{user,categories,cartCount,products,wishlistCount})
  } catch (error) {
    next(error)
  }
});

router.get('/login',(req, res,next) => {
  try {
    if (req.session.loggedIn) {
      res.redirect('/')
    } else 
    res.render('user/login')
  } catch (error) {
    next(error)
  }
})

router.get('/signup',(req, res,next) => {
  try {
    res.render('user/signup')  
  } catch (error) {
    next(error)
  }
})    

router.post('/signup',(req,res,next) => {
  try {
    const { email, phone } = req.body;
  req.session.number = phone;
  req.session.email = email;
  req.session.whole = req.body;
  twilioHelpers
    .makeOtp(phone)
    .then((verification) => console.log(verification));
  res.render("user/verify", { whole: req.session.whole });
  } catch (error) {
    next(error)
  }
})

router.post("/verify", (req,res,next) => {
  try {
    let { otp } = req.body;
  const phNumber = req.session.number;
  twilioHelpers.verifyOtp(otp, phNumber).then((verifcation_check) => {
    if (verifcation_check.status == "approved") {
      req.session.checkstatus = true;
      userHelpers
        .doSignup(req.session.whole)
        .then((response) => {
          res.redirect("/login");
        })
        .catch(() => {
          req.session.alreadyexist = true;
          res.redirect("/signup");
        });
    } else {
      res.redirect("/signup");
    }
  });
  } catch (error) {
    next(error)
  }
});

router.post('/login',(req,res,next) => {
  try {
    userHelpers.doLogin(req.body).then((response) => {
      if(response.status) {
        req.session.loggedIn = true
        req.session.user = response.user
        res.redirect('/');
      } else {
        res.redirect('/login')
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/contact',async(req,res,next) => {
  try {
    let user = req.session.user
    res.render('user/contact',{user})
  } catch (error) {
    next(error)
  }
})

router.get('/logout',(req,res,next) => {
  try {
    req.session.destroy()
  res.redirect ('/')
  } catch (error) {
    next(error)
  }
})

router.get('/myAccount',verifyLogin,async(req,res,next) => {
  try {
  let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  const user = req.session.user
  const categories = await categoryHelpers.getAllCategories()
  const userDetails = await userHelpers.userData(req.session.user._id)
  const address = userDetails.Addresses
  res.render('user/myAccount',{userDetails,user,address,cartCount,wishlistCount,categories})
  } catch (error) {
    next(error)
  }
})

router.post('/edit-profile',async(req,res,next) => {
  try {
    const user = req.session.user
  const profileData = await userHelpers.editProfile(req.session.user._id, req.body)
  req.session.user.name = req.body.name
  res.redirect('/myAccount')
  } catch (error) {
    next(error)
  }
})

router.post('/add-address',async(req,res,next) => {
  try {
  const user = req.session.user
  const address = await userHelpers.addAddress(req.session.user._id, req.body)
  res.redirect('/myAccount')
  } catch (error) {
    next(error)
  }
}) 

router.post('/edit-address',async(req,res,next) => {
try {
  const user = req.session.user
  const addressData = await userHelpers.editAddress(req.session.user._id, req.body)
  console.log(req.body);
  res.redirect('/myAccount')
} catch (error) {
  next(error)
}
})

router.get('/productDetails/:id',async (req,res,next) => {
  try {
  const user = req.session.user
  let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  const product = await productHelpers.getSingleProduct(req.params.id)
  res.render('user/productDetails',{product,cartCount,user,wishlistCount})
  } catch (error) {
    next(error)
  }
})

router.get('/cart',verifyLogin,async (req,res,next) => {
  try {
    let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  const user = req.session.user
  const categories = await categoryHelpers.getAllCategories()
  const products = await userHelpers.getCartProducts(req.session.user._id)
  const totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/cart',{user,products,totalValue,cartCount,wishlistCount,categories})
  } catch (error) {
    next(error)
  }
})

router.get('/add-to-cart/:id',verifyLogin,async (req,res,next) => {
  try {
  let user = req.session.user
  const products = await userHelpers.getCartProducts(req.session.user._id)
  userHelpers.addToCart(req.params.id, req.session.user._id).then((response) => {
  res.json(response)
  })
  } catch (error) {
    next(error)
  }
  
})

router.post('/change-product-quantity', (req,res,next) => {
  try {
    userHelpers.changeProductQuantity(req.body).then(async () => {
      response.total = await userHelpers.getTotalAmount(req.body.user)
       res.json(response)
     })
  } catch (error) {
    next(error)
  }
})

router.post('/remove-cart-product',verifyLogin,(req,res,next) => {
  try {
    userHelpers.deleteCartProduct(req.body).then(async(response) => {
      res.json(response);
    })
  } catch (error) {
    next(error)
  }
})

router.get('/add-to-wishlist/:id',verifyLogin,async(req,res,next) => {
  try {
    let user = req.session.user
    const products = await userHelpers.getWishlistProducts(req.session.user._id)
    userHelpers.addToWishlist(req.params.id, req.session.user._id).then((response) => {
      res.json(response)
    })
  } catch (error) {
    next(error)
  }
 
})

router.get('/wishlist',verifyLogin,async (req,res,next) => {
  try {
    let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  const user = req.session.user
  const categories = await categoryHelpers.getAllCategories()
  const products = await userHelpers.getWishlistProducts(req.session.user._id)
  res.render('user/wishlist',{user,products,cartCount,wishlistCount,categories})
  } catch (error) {
    next(error)
  }
})

router.post('/remove-wishlist-product',verifyLogin,(req,res,next) => {
  try {
    userHelpers.deleteWishlistProduct(req.body).then(async(response) => {
      res.json(response);
    })
  } catch (error) {
    next(error)
  }
})

router.get('/checkout',verifyLogin,async (req,res,next) => {
  try {
    const user = req.session.user
  let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  const userDetails = await userHelpers.userData(req.session.user._id)
  const address = userDetails.Addresses
  const products = await userHelpers.getCartProducts(req.session.user._id)
  const total = await userHelpers.getTotalAmount(req.session.user._id)
  let addresses = req.session.user.Addresses
  console.log(userDetails);
  res.render('user/checkout',{user,total,products,addresses,userDetails,address,cartCount,wishlistCount})
  } catch (error) {
    next(error)
  }
})

router.post('/checkout',verifyLogin,async (req,res,next) => {
  try {
    const products = await userHelpers.getCartProductList(req.body.userId)
    const totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    userHelpers.placeOrder(req.body,products,totalPrice).then((orderId) => {
        if (req.body['payment-method'] === 'cod') {
        res.json({codSuccess:true})
      } else {
        userHelpers.generateRazorpay(orderId,totalPrice).then((response) => {
          res.json(response)
        })
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/orderSuccess',verifyLogin,async (req,res,next) => {
  try {
    const user = req.session.user
  let cartCount = null
  let wishlistCount = null
  const orders = await userHelpers.getUserOrders(req.session.user._id)
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  res.render('user/orderSuccess',{user,cartCount,wishlistCount,orders})
  } catch (error) {
   next(error) 
  }
  
})

router.get('/orderDetails',verifyLogin,async(req,res,next) => {
  try {
    const user = req.session.user
  let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  const orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orderDetails',{user,orders,cartCount,wishlistCount})
  } catch (error) {
    next(error)
  }
  
})

router.get('/view-order-products/:id',verifyLogin,async (req,res,next) => {
  try {
    const user = req.session.user
  let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  const products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user,products,cartCount,wishlistCount})
  } catch (error) {
    next(error)
  }
})

router.post('/verify-payment',(req,res,next) => {
  try {
    userHelpers.verifyPayment(req.body).then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(()=> {
        res.json({status:true})
      })
    }).catch((err) => {
      res.json({status:false,errMsg:""})
    })
  } catch (error) {
    next(error)
  }
})

router.get('/coming-soon',async(req,res,next) => {
  try {
    const user = req.session.user
  let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  res.render('user/coming-soon',{user,cartCount,wishlistCount})
  } catch (error) {
    next(error)
  }
  
})

router.post('/cancel-order',async(req,res) => {
  const user = req.session.user
  const cancelOrder = await userHelpers.cancelOrder(req.body)
  res.redirect('/orderDetails')
})

router.get('/:category',async(req,res,next) => {
  try {
    const user = req.session.user
  let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  const category = req.params.category
  const categories = await categoryHelpers.getAllCategories()
  const products = await productHelpers.getAllproductByCategories(category)
  const productSubcategories = await subcategoryHelpers.getAllproductSubcategories(category)
  if (categories.find(vietnam => vietnam.category_name == category)) {
    res.render('user/category',{products,categories,category,user,cartCount,wishlistCount,productSubcategories})
  } else {
    res.render('user/404')
  }
  } catch (error) {
    next(error)
  }
})

router.get('/:category/:subcategory',async(req,res,next) => {
  try {
    const category = req.params.category
  const subcategory = req.params.subcategory
  let user = req.session.user
  let cartCount = null
  let wishlistCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
    wishlistCount = await userHelpers.getWishlistCount(req.session.user._id)
  }
  const categories = await categoryHelpers.getAllCategories()
  const products = await productHelpers.getAllproductBySubCategories(category,subcategory)
  const productSubcategories = await subcategoryHelpers.getAllproductSubcategories(category)
  res.render('user/category',{products,categories,category,user,cartCount,wishlistCount,productSubcategories})
  } catch (error) {
    next(error)
  }
})


module.exports = router;
