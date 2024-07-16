require('dotenv').config();
const express = require("express");
const ejsMate = require("ejs-mate");
const path = require("path");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const User = require("./model/usermodel.js"); // Use capital for model
const Trans=require("./model/transacmodel.js");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const bodyParser = require("body-parser"); // Add this to parse request bodies
const flash=require("connect-flash");
const moment=require("moment");
const router=express.Router();
const app = express();

// Setting up the database
const mongo_url = process.env.ATLASDB_URL;

async function main() {
    await mongoose.connect(mongo_url);
    //console.log("Database connected");
}

main().catch((err) => {
    console.log(err);
});

// Setting up authentication
const sessionOptions = {
    secret: 'yourSecretKey', 
    resave: false,
    saveUninitialized: false,
    store:MongoStore.create({
        mongoUrl:mongo_url,
        collectionName:'sessions'
    }),
    cookie: { secure: false } 
};

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Setting up EJS
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true })); // Use body-parser

//middleware for flash message
app.use(flash());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    next();
})
//middleware for authentication
const isloggedin =async (req,res,next)=>{
    if(!req.isAuthenticated()){
        return res.redirect("/login");
    }
    const u=User.findOne({username:req.params.username});
    if(!u){
        return res.redirect("/login");
    }
    if(req.user.username!==req.params.username){
        res.redirect("/login");
    }
    
    next();
}
app.get("/", (req, res) => {
    res.render("layouts/landingpage"); // Ensure this path is correct
});

//login code
app.get("/login",(req,res)=>{
    res.render("../views/layouts/login.ejs");
});
app.post("/login",passport.authenticate("local",{failureRedirect:"/login",failureFlash:true}),async(req,res)=>{
    try{
        console.log("logged in");
        const username=req.body.username;
        console.log(username);
        res.redirect(`/${username}/dashboard`);
    }catch(err){
        if(!req.headerSent){
            req.flash("error",err.message);
            res.redirect("/login");
        }else{
            console.log("multiple headers sent");
        }
    }
    
})
//signup code
app.get("/signup",(req,res)=>{
    res.render("../views/layouts/signup.ejs");
});
app.post("/signup", async(req,res)=>{
    try{
    let {username,email,password}=req.body;
    const newUser=new User({email,username});
    const reguser=await User.register(newUser,password);
    
    req.flash("success","user was registered");
    req.login(reguser,(err)=>{
        if(err){
            next(err);
        }
        res.redirect(`/${username}/dashboard`);
    });
   
    }catch(err){
        console.log("username already exists");
        req.flash("error",err.message);
        res.redirect("/signup");
    }

})
app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err){
            next(err);
        }
        req.session.destroy((err)=>{
            if(err){
                next(err);
            }
            res.redirect("/");
            
        });
        
    });
});
//dashboard
app.get("/:username/dashboard",isloggedin, async (req, res) => {
    try {
        const username = req.params.username;
        
        // Fetch transactions
        const transactions = await Trans.find({ username: username });
        if(transactions.length==0){
            res.render("../views/layouts/dashboard2.ejs",{username:username});
        }else{
        // Fetch top 3 expenses
        const top3expense = await Trans.aggregate([
            { $match: { username: username, type: 'Expense' } },
            { $group: { _id: "$category", totalamount: { $sum: "$amount" } } },
            { $sort: { totalamount: -1 } },
            { $limit: 3 }
        ]);

        // Fetch top 3 incomes
        const top3income = await Trans.aggregate([
            { $match: { username: username, type: 'income' } },
            { $group: { _id: "$category", totalamount: { $sum: "$amount" } } },
            { $sort: { totalamount: -1 } },
            { $limit: 3 }
        ]);

        // Render dashboard view with data
        res.render("../views/layouts/dashboard.ejs", { transactions: transactions, top3income: top3income, top3expense: top3expense });
    }
    } catch (error) {
        // Handle errors
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
    }
});

//analytics
//analytics
app.get("/:username/analytics",isloggedin,async (req,res)=>{
    const filterdays = req.query.filterChoice;
    var startDate = req.query.start_date;
    var endDate = req.query.end_date ;

    try {
        let query = { username: req.params.username };

        if (filterdays !== undefined && filterdays !== "none" && filterdays !== "custom") {
            query.date = { $gt: moment().subtract(Number(filterdays), 'days').toDate() };
        } else if (filterdays !== undefined && filterdays === 'custom') {
            startDate = req.query.start_date ? new Date(req.query.start_date) : undefined;
            endDate = req.query.end_date ? new Date(req.query.end_date) : undefined;
            if (startDate && endDate) {
                query.date = { $gte: startDate, $lte: endDate };
            }
        }

        

        const transactions = await Trans.find(query);
        
        res.render("../views/layouts/analytics.ejs", {username:req.params.username,
            transactions: transactions,
            filterChoice: filterdays === undefined ? "none" : req.query.filterChoice,
            start_date:startDate!==undefined?startDate:undefined,
            end_date:endDate!==undefined ? endDate :undefined,

            
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
})

//transaction
//TABLE OF TRANSACTIONS
app.get("/:username/transactions",isloggedin, async (req, res) => {
    const filterdays = req.query.filterChoice;
    const filtertype = req.query.filterType;
    const filtercat=req.query.filtercat;
    console.log(req.query.start_date);
    console.log(filterdays);
    console.log("   ");
    console.log(filtertype);
    var startDate = req.query.start_date;
    var endDate = req.query.end_date ;
    
    
    try {
        let query = { username: req.params.username };
        if (filterdays !== "custom") {
            req.query.start_date = undefined;
            req.query.end_date = undefined;
            startDate = undefined;
            endDate = undefined;
        }
        
        if (filterdays !== undefined && filterdays !== "none" && filterdays !== "custom") {
            query.date = { $gt: moment().subtract(Number(filterdays), 'days').toDate() };
        } else if ( startDate!==undefined&&endDate!==undefined) {
            
            if (startDate!==undefined && endDate!==undefined) {
                query.date = { $gte: startDate, $lte: endDate };
            }
        }

        if (filtertype !== undefined && filtertype !== "none") {
            query.type = filtertype;
        }
        if (filtercat !== undefined && filtercat !== "none") {
            query.category = filtercat;
        }
        const transactions = await Trans.find(query);
        
        res.render("../views/layouts/transaction.ejs", {
            username:req.params.username,
            transactions: transactions,
            filterChoice: filterdays === undefined ? "none" : req.query.filterChoice,
            filterType: filtertype === undefined ? "none" : req.query.filterType,
            filtercat:filtertype==undefined?"none":req.query.filtercat,
            start_date:startDate!==undefined ?startDate: undefined,
            end_date:endDate!==undefined ? endDate :undefined,
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/:username/addexp",isloggedin,(req,res)=>{
    const username=req.params.username;
    res.render("../views/layouts/addexp.ejs",{username:username});
});
app.get("/:username/addinc",isloggedin,(req,res)=>{
    const username=req.params.username;
    res.render("../views/layouts/addinc.ejs",{username:username});
});
app.post("/:username/addexp",async (req,res)=>{
    try{
        const username=req.params.username;
        console.log(username);
        const newlist=new Trans({...req.body.Trans,username:username,type:"Expense"});
        await newlist.save();
        console.log("data saved");
        res.redirect(`/${username}/dashboard`);
    }catch(err){
        req.flash("error",err.message);
        res.redirect(`/${req.params.username}/addexp`);
    }
    
});
app.post("/:username/addinc",async (req,res)=>{
    try{
        const username=req.params.username;
        console.log(username);
        const newlist=new Trans({...req.body.Trans,username:username,type:"income"});
        await newlist.save();
        console.log("data saved");
        res.redirect(`/${username}/dashboard`);
    }catch(err){
        req.flash("error",err.message);
        res.redirect(`/${req.params.username}/addinc`);
    }
    
});

app.get("/:username/:transid",isloggedin,async (req,res)=>{
    try{
        const transaction= await Trans.findOne({_id:req.params.transid});
        
        
        if(transaction===undefined){
            res.status(404).send("Transaction not found");
        }else{
            res.render("../views/layouts/viewtrans.ejs",{transaction:transaction});
        }
        
    }catch(err){
        console.log(err);
        res.status(500).send("Error in retrieving error");
    }
});
app.post("/:username/:transid",async(req,res)=>{
    await Trans.findByIdAndDelete(req.params.transid);
    res.redirect(`/${req.params.username}/transactions`);
});



app.listen(8000, () => {
    console.log("Server connected successfully on port 8000");
});
