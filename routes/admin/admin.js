const express = require('express');
const { BANNER_COLLECTION } = require('../../config/collections');
const router = express.Router();
const adminHelpers = require('../../helpers/admin-helpers');
const userHelpers = require('../../helpers/user-helpers')
const productHelpers = require('../../helpers/product-helpers');
const categoryHelpers = require('../../helpers/category-helpers');
const store = require('../../middleware/multer');
const subcategoryHelpers = require('../../helpers/subcategory-helpers');
const { log } = require('handlebars');
const { Db } = require('mongodb');
const verifyLoggedin = (req,res,next) => {
  if (req.session.loggedIn){
    next()
  } else {
    req.redirect ('admin/login')
  }
}

//Admin signin
router.get('/',async(req,res,next) => {
  try {
    let totalUsersCount = 0;
    let totalProductCount = 0;
    let totalSalesCount = 0;
    if (req.session.loggedIn) {
      totalUsersCount = await adminHelpers.getUsersCount()
      totalProductCount = await adminHelpers.getProductCount()
      totalSalesCount = await adminHelpers.getSalesCount()
      res.render('admin/home',{layout:"adminLayout",admin:true,totalUsersCount,totalProductCount,totalSalesCount})
    } else
    res.redirect('/admin/adminLogin');
  } catch (error) {
    next(error)
  }
 
})

router.get('/adminLogin',(req,res,next) => {
  try {
    if (req.session.loggedIn) {
      res.redirect('/admin')
    } else {
      res.render('admin/adminLogin',{error:req.session.loginErr})
      req.session.loginErr = false
    }
  } catch (error) {
    next(error)
  }
  
})

router.post('/adminLogin',(req,res,next) => {
  try {
    adminHelpers.doLogin(req.body).then(async(response) => {
      if(response.status) {
        req.session.loggedIn = true
        req.session.admin = response.admin
        res.redirect('/admin');
      } else {
        req.session.loginErr = true
        res.redirect('/admin/adminLogin')
      }
    })
  } catch (error) {
    next(error)
  }
  
})

router.get ('/logout',(req,res,next) => {
  try {
    req.session.destroy()
    res.redirect ('/admin')
  } catch (error) {
    next(error)
  }
})

router.get('/users',(req,res,next) => {
  try {
    adminHelpers.getAllUsers().then((users) => {
      res.render('admin/users',{layout:"adminLayout",users})
      })
  } catch (error) {
    next(error)
  }
})

router.get('/add-category',async(req,res,next) => {
  try {
    res.render('admin/add-category',{layout:"adminLayout"})
  } catch (error) {
    next(error)
  }
 
})

router.post('/add-category',(req,res,next) => {
  try {
    categoryHelpers.addCategory(req.body,(result) => {
      res.render('admin/add-category',{layout:"adminLayout"})
     })
  } catch (error) {
    next(error)
  }
 
})

router.get('/add-subcategory',async(req,res,next) => {
  try {
    const categories = await categoryHelpers.getAllCategories()
  res.render('admin/add-subcategory',{categories,layout:"adminLayout"})
  } catch (error) {
    next(error)
  }
  
})

router.post('/add-subcategory',async (req,res,next) => {
  try {
    subcategoryHelpers.addSubcategory(req.body,(result) => {
      res.render('admin/add-subcategory',{layout:"adminLayout"})
     })
  } catch (error) {
    next(error)
  }
  
})

router.get('/add-product',async (req,res,next) => {
  try {
    const subcategories = await subcategoryHelpers.getAllSubcategories()
 const categories = await categoryHelpers.getAllCategories()
  res.render('admin/add-product',{categories,subcategories,layout:"adminLayout"});
  } catch (error) {
    next(error)
  }
 
})

router.post('/add-product',store.array("uploaded_file", 12),(req,res,next) => {
  try {
    const images = req.files.map((file) => file.filename);
  req.body.images = images;
  productHelpers.addProduct(req.body, (result) => {
    res.redirect('/admin/add-product')
  })
  } catch (error) {
    next(error)
  }
  
})

router.get('/view-product',async(req,res,next) => {
  try {
    const products = await productHelpers.getAllProducts()
    res.render('admin/product',{layout:"adminLayout",products})
  } catch (error) {
    next(error)
  }
 
})

router.get('/edit-product/:id',async (req,res,next) => {
  try {
    const product = await productHelpers.getProductDetails(req.params.id)
  const subcategories = await subcategoryHelpers.getAllSubcategories()
  const categories = await categoryHelpers.getAllCategories()
  res.render('admin/edit-product',{product,subcategories,categories,layout:"adminLayout"})
  } catch (error) {
    next(error)
  }
  
})

router.post('/edit-product/:id',(req,res,next) => {
  try {
    productHelpers.updateProduct(req.params.id,req.body).then (() => {
      res.redirect('/admin/edit-product')
    })
  } catch (error) {
    next(error)
  }
 
})

router.get('/view-category',async(req,res,next) => {
  try {
    const categories = await categoryHelpers.getAllCategories()
  res.render('admin/category',{layout:"adminLayout",categories})
  } catch (error) {
    next(error)
  }
})

router.get('/view-subCategory',async(req,res,next) => {
  try {
    const subCategories = await subcategoryHelpers.getAllSubcategories()
  res.render('admin/subCategory',{layout:"adminLayout",subCategories})
  } catch (error) {
    next(error)
  }
  
})

router.get('/view-order', async (req,res,next) => {
  try {
    const orderIteam = await adminHelpers.getOrderProducts()
  res.render("admin/order",{layout:"adminLayout",orderIteam})
  } catch (error) {
    next(error)
  }
  
})

router.post('/changeDeliveryStatus',async (req,res,next) => {
  try {
    const status = await adminHelpers.changedeliveryStatus(req.body.orderId,req.body.productId,req.body.status)
  res.json(status)
  } catch (error) {
    next(error)
  }
})

module.exports = router;