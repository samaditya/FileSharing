const dotenv = require('dotenv');
dotenv.config({path : "./views/config.env"})
const express = require('express');
const mongoose = require('mongoose')
const multer = require('multer')
const bcrypt = require('bcrypt') 
const app = express();
const File = require('./models/File')

const upload = multer({dest : "uploads"})
mongoose.connect(process.env.DATABASE_URL); 
app.set("view engine" , "ejs")

app.use(express.urlencoded({extended : true}))

app.get('/' , (req , res) =>{
    console.log("Server running on 3000" + process.env.PORT)
    res.render("index")
})
app.post("/upload" , upload.single("file") ,async (req,res) =>{
   const fileData = {
    path : req.file.path,
    originalName : req.file.originalname,
   }
   if(req.body.password != null && req.body.password !==""){
        fileData.password = await bcrypt.hash(req.body.password , 10)
   }
   const file = await File.create(fileData)
   res.render('index' , {fileLink : `${req.headers.origin}/file/${file.id}`})

})
app.route("/file/:id").get(handleDownload).post(handleDownload)

    //res.send(req.params.id)
    
async function handleDownload(req , res) {
    
    const file = await File.findById(req.params.id)
    if(file.password != null){
        if(req.body.password == null){
            res.render('password')
            return
        }

        if(!(await bcrypt.compare(req.body.password , file.password))){
            res.render('password' , {error : true})
            return
        }
    }
    file.donwnloadCount++;
    await file.save()
    console.log(file.donwnloadCount)
    res.download(file.path , file.originalName)
}

app.listen(process.env.PORT)