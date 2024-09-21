const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require('./db/User');
const Product = require("./db/Product")
const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';
const app = express();


const verifyToken = (req, resp, next) => {
    const token = req.headers['authorization'];

    if (token) {
        Jwt.verify(token.split(' ')[1], jwtKey, (err, valid) => {
            if (err) {
                return resp.status(401).send({ result: "Token expired or invalid. Please login again." });
            } else {
                
                next();
            }
        });
    } else {
        return resp.status(403).send({ result: "Token not provided. Access denied." });
    }
};
app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
    console.log("Register");
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password
    Jwt.sign({result}, jwtKey, {expiresIn:'10s'},(err,token)=>{
        if(err){
            resp.send("Something went wrong"); 
        }
        
        resp.send({result,auth:token});
    })
})

app.post("/login", async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({user}, jwtKey, {expiresIn:"10s"},(err,token)=>{
                if(err){
                    resp.send("Something went wrong")  
                }
                resp.send({user,auth:token})
            })
        } else {
            resp.send({ result: "No User found" })
        }
    } else {
        resp.send({ result: "No User found" })
    }
});

app.post("/add-product",verifyToken, async (req, resp) => {
    
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result);
});

app.get("/products",verifyToken, async (req, resp) => {
    const products = await Product.find();
    if (products.length > 0) {
        resp.send(products)
    } else {
        resp.send({ result: "No Product found" })
    }
});

app.delete("/product/:id",verifyToken, async (req, resp) => {
    let result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result)
}),







app.listen(5000);