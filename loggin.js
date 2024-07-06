module.exports.isloggedin=(req,res,next)=>{
    if(!req.isAuthenticated()){
        return res.redirect("/login");
    }
    next();
};