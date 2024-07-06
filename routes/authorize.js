const router=express.router();


router.get("/login",(req,res)=>{s
    res.render("../views/layouts/login.ejs");
});
router.get("/signup",(req,res)=>{
    res.render("../views/layouts/signup.ejs");
})