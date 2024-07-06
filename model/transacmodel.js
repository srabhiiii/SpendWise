const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const newtrans=new Schema({
    username:{
        type:String,
        required:true,
    },
    amount:{
        type:Number,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    type:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        required:true,
    },
    desc:String,
});
 const User=new mongoose.model("User",newtrans);
 module.exports=User;