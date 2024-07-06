const mongoose=require("mongoose");
const passportlocalmongoose= require("passport-local-mongoose");
const Schema=mongoose.Schema;


//making schema
const userschema=new Schema({
    email:{
        type:String,
        required:true,
    }
});
userschema.plugin(passportlocalmongoose);
const model=mongoose.model("model",userschema);
module.exports=model;
