const multer = require('multer')

//set storage
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, "public/uploads");
    },
    filename: function (req, file, callback) {
      const ext = file.originalname.substring(file.originalname.lastIndexOf("."));
      console.log(ext, file.originalname, file);
      callback(null, file.fieldname + "-" + Date.now() + ext);
    },
  });
  
  const store = multer({ storage: storage });
  module.exports = store; 