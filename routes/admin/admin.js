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
router.get('/',async(req,res) => {
  let totalUsersCount = 0;
  let totalProductCount = 0;
  let totalSalesCount = 0;
  if (req.session.loggedIn) {
    totalUsersCount = await adminHelpers.getUsersCount()
    totalProductCount = await adminHelpers.getProductCount()
    totalSalesCount = await adminHelpers.getSalesCount()
    res.render('admin/adminLogin',{layout:"adminLayout",admin:true,totalUsersCount,totalProductCount,totalSalesCount})
  } else
  res.render('admin/adminLogin',{layout:"adminLayout",admin:false});
})

router.post('/adminLogin',(req,res) => {
  let totalUsersCount = 0;
  let totalProductCount = 0;
  let totalSalesCount = 0;
  adminHelpers.doLogin(req.body).then(async(response) => {
    if(response.status) {
      req.session.loggedIn = true
      req.session.admin = response.admin
      totalUsersCount = await adminHelpers.getUsersCount()
      totalProductCount = await adminHelpers.getProductCount()
      totalSalesCount = await adminHelpers.getSalesCount()
      res.render('admin/home',{layout:"adminLayout", admin:true,totalUsersCount,totalProductCount,totalSalesCount});
    } else {
      req.session.loginErr = true
      res.redirect('admin/adminLogin')
    }
  })
})

router.get ('/logout',(req,res) => {
  req.session.destroy()
  res.redirect ('/admin')
})

router.get('/users',(req,res) => {
  adminHelpers.getAllUsers().then((users) => {
  res.render('admin/users',{layout:"adminLayout",users})
  })
})

router.get('/add-category',async(req,res) => {
  res.render('admin/add-category',{layout:"adminLayout"})
})

router.post('/add-category',(req,res) => {
  categoryHelpers.addCategory(req.body,(result) => {
   res.render('admin/add-category',{layout:"adminLayout"})
  })
})

router.get('/add-subcategory',async(req,res) => {
  const categories = await categoryHelpers.getAllCategories()
  res.render('admin/add-subcategory',{categories,layout:"adminLayout"})
})

router.post('/add-subcategory',async (req,res) => {
  subcategoryHelpers.addSubcategory(req.body,(result) => {
   res.render('admin/add-subcategory',{layout:"adminLayout"})
  })
})

router.get('/add-product',async (req,res) => {
 const subcategories = await subcategoryHelpers.getAllSubcategories()
 const categories = await categoryHelpers.getAllCategories()
  res.render('admin/add-product',{categories,subcategories,layout:"adminLayout"});
})

router.post('/add-product',store.array("uploaded_file", 12),(req,res) => {
  const images = req.files.map((file) => file.filename);
  req.body.images = images;
  productHelpers.addProduct(req.body, (result) => {
    res.redirect('/admin/add-product')
  })
})

router.get('/view-product',async(req,res) => {
  const products = await productHelpers.getAllProducts()
  res.render('admin/product',{layout:"adminLayout",products})
})

router.get('/edit-product/:id',async (req,res) => {
  const product = await productHelpers.getProductDetails(req.params.id)
  const subcategories = await subcategoryHelpers.getAllSubcategories()
  const categories = await categoryHelpers.getAllCategories()
  res.render('admin/edit-product',{product,subcategories,categories,layout:"adminLayout"})
})

router.post('/edit-product/:id',(req,res) => {
  productHelpers.updateProduct(req.params.id,req.body).then (() => {
    res.redirect('/admin/edit-product')
  })
})

router.get('/view-category',async(req,res) => {
  const categories = await categoryHelpers.getAllCategories()
  res.render('admin/category',{layout:"adminLayout",categories})
})

router.get('/view-subCategory',async(req,res) => {
  const subCategories = await subcategoryHelpers.getAllSubcategories()
  res.render('admin/subCategory',{layout:"adminLayout",subCategories})
})

router.get('/view-order', async (req,res) => {
  const orderIteam = await adminHelpers.getOrderProducts()
  res.render("admin/order",{layout:"adminLayout",orderIteam})
})

router.post('/changeDeliveryStatus',async (req,res) => {
  console.log(req.body)
  const status = await adminHelpers.changedeliveryStatus(req.body.orderId,req.body.productId,req.body.status)
  res.json(status)
})

module.exports = router;