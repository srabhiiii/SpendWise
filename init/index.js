const mongoose=require("mongoose");
const storeddata=require("./data.js");
const model=require("../model/usermodel.js");

//connecting to database
main()
    .then((res)=>{
        console.log("database connected");
    }).catch((err)=>{
        console.log(err);
    });

    
const mongo_url="mongodb://127.0.0.1:27017/Expense_Manager/main";

async function main(){
    await mongoose.connect(mongo_url);
}

const intialize=async()=>{
    await model.deleteMany({});
    await model.insertMany(storeddata.data);
    console.log("successfully connected to the database");
}
initialize();
