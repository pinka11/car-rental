var express=require("express");
var app=express();
var mongoose=require("mongoose");
var bodyparser=require("body-parser");
var passport=require("passport");
var localPassport=require("passport-local");
var passportmongoose=require("passport-local-mongoose");
var expressSession=require("express-session");
var methodoverride=require("method-override");

mongoose.connect("mongodb://localhost/car_rent");

app.set("view engine","ejs");
app.use(bodyparser.urlencoded({extended:true}));
app.use(methodoverride("_method"));

var userSchema=new mongoose.Schema({
    name:String,
    phone:Number,
    gender:String,
    dl:String,
    dob:String,
    username:String,
    email:String,
    state:String,
    city:String,
    pin:Number,
    password:String,
    approval:Boolean,
    disable:Boolean
});

var carSchema=new mongoose.Schema({
    name:String,
    price:Number,
    type:String,
   image:String
});

var couponSchema=new mongoose.Schema({
    name:String,
    discount:Number,
   code:String
});


userSchema.plugin(passportmongoose);
var User=mongoose.model("User",userSchema);
app.use(require("express-session")({
    secret: "best car application",
    resave: false,
    saveUninitialized: false
}));


var Car=mongoose.model("Car",carSchema);
var Coupon=mongoose.model("Coupon",couponSchema);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localPassport(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
    res.render("home");
});

app.get("/registration",function(req,res){
    res.render("registration");
});

app.get("/home",function(req,res){
    res.render("home");
});;

app.post("/registration",function(req,res){
    var newUser=new User({
       username:req.body.username,
       name:req.body.name,
       email:req.body.email,
       dob:req.body.dob,
       phone:req.body.phoneNo,
       gender:req.body.gen,
       dl:req.body.dl,
       state:req.body.state,
       city:req.body.city,
       pin:req.body.pin,
       password:req.body.password,
       approval:false,
       disable:false
    });
    User.register(newUser,req.body.pass,function(err,user){
        if(err){
            res.redirect("/");
            console.log(err.message);
        }else{
            res.redirect("/login");
        }
    });
   
});

app.get("/login",function(req,res){
    res.render("login");
    
});

app.post('/login',
  passport.authenticate('local', {
       successRedirect: "/user/dashboard",
       failureRedirect: '/login'
     })
);

app.get('/user/dashboard',isLoggedIn,function(req,res){
    res.render("user/dashboard");
    
});

app.get('/logout',function(req,res){
    req.logout();
    res.redirect('home');
});

function isLoggedIn(req,res,next){
  
    if(req.isAuthenticated()){
        
       if(req.user.username==="admin"){
           res.redirect("/admin/index");
        
       }
       else{
          return next();
       }
    }
    else{
        res.render(login);
} 
}

app.get('/admin',function(req,res){
    res.render('login');
});

app.get('/admin/index',function(req,res){
    User.find({},function(err,user){
        if(err){
            console.log(err);
        }else{
            User.distinct("city",function(err,city){
             if(err){
                console.log(err);
             }else{
           res.render("admin/index",{user:user,city:city});
             }
            });
        } 
    });
});

app.post('/admin/index',function(req,res){
    User.find({city:req.body.city},function(err,user){
        if(err){
            console.log(err);
        }else{
            User.distinct("city",function(err,city){
             if(err){
                console.log(err);
             }else{
           res.render("admin/index",{user:user,city:city});
             }
            });
        } 
    });
});

app.post("/admin/index/search",function(req,res){
    User.find({"name":{$regex : new RegExp(req.body.name, "i")}},function(err,user){
        if(err){
            console.log(err);
        } else{
            console.log(user);
             User.distinct("city", function(err,city){
                 if(err)
                 {
                     console.log(err);
                 }
                 else{
                  console.log('distinct: ',city);
                   res.render("admin/index", { user:user,city:city })
                 }
              });
 
         }
    });
}) 

// ##########################################################################
//                                 ADMIN
// ##########################################################################
// User.register(new User({username:"admin"}),"admin",function(err,user){
//     if(err){
//         console.log(err);
//     }
//     else{
//         console.log(user);
//     }
// });

app.get("/displayCar",function(req,res){
  Car.find({},function(err,car){
        if(err){
            console.log(err);
        }else{
            res.render("admin/cardisplay",{cars:car});
        }
});
});

app.get("/addcar",function(req,res){
    res.render("admin/addcar");
});

app.post("/displayCar",function(req,res){
     Car.create({
        name:req.body.name,
        price:req.body.price,
        type:req.body.type,
        image:req.body.image
     },function(err,car){
     if(err){
         console.log(err);
     }else{
         Car.find({},function(err,car){
            if(err){
                console.log(err);
            }else{
                res.render("admin/cardisplay",{cars:car});
            }
    });
     }
     });
});

app.get("/:id/modify",function(req,res){
    Car.findById(req.params.id, function(err, car){
        if(err){
            res.redirect("back");
        } else {
          res.render("admin/modifycar", {car_id: req.params.id, car:car});
        }
     });
});

app.put("/:id",function(req,res){
    Car.findByIdAndUpdate(req.params.id,req.body,function(err, updatecar){
        if(err){
            console.log(err);
        } else {
             res.redirect("/displayCar");
        }
     });
});

app.delete("/:id",function(req,res){
    Car.findByIdAndRemove(req.params.id,function(err){
        if(err){
            console.log(err);
        } else {
             res.redirect("/displayCar");
        }
     });
});

app.post("/user/availablecar",function(req,res){
    Car.find({"type":{$regex : new RegExp(req.body.type, "i")}},function(err,cars){
        if(err){
            console.log(err);
        } else{ 
            var userID=req.user._id;
            User.findById(userID,function(err,user){
                if(err){
                    console.log(err);
                }else{
                    console.log(req.body.fdate,req.body.tdate);
                    res.render("user/availablecar",{cars:cars,user:user});
                }
            });   
         }
    });
});

app.post("/user/:userID/:id/book",function(req,res){
    User.findById(req.params.userID, function(err, user){
       if(err){
           console.log(err);
       }
       else{
        res.render("user/bookcar",{user:user});
       }
   });
});

app.post("/user/payment",function(req,res){
    res.render("user/carpayment");
})

app.post("/user/paymentStatus",function(req,res){
    res.render("user/paymentStatus",{cnumber:req.body.cardno});
});

app.put("/admin/approve",function(req,res){
    User.findByIdAndUpdate(req.body.userid,req.body.approval,function(err, updateuser){
        if(err){
            console.log(err);
        } else {
            updateuser.approval=!updateuser.approval;
            updateuser.save();
            res.redirect("/admin/index");
        }
     });    
});

app.put("/admin/disable",function(req,res){
    User.findByIdAndUpdate(req.body.userid,req.body.disable,function(err, updateuser){
        if(err){
            console.log(err);
        } else {
            updateuser.disable=!updateuser.disable;
            updateuser.save();
            res.redirect("/admin/index");
        }
     });    
});

app.get("/admin/coupon",function(req,res){
    Coupon.find({},function(err,coupon){
        if(err){
            console.log(err);
        }else{
            res.render("admin/coupon",{coupon:coupon});
        }
});
});

app.post("/admin/coupon",function(req,res){
    Coupon.create({
        name:req.body.name,
        discount:req.body.discount,
        code:req.body.code,
     },function(err,coupon){
     if(err){
         console.log(err);
     }else{
         Car.find({},function(err,coupon){
            if(err){
                console.log(err);
            }else{
                res.render("admin/coupon",{coupon:coupon});
            }
    });
     }
     });
});

app.get("/admin/addcoupon",function(req,res){
        res.render("admin/addcoupon");
})


app.listen(3000,function(err){
    if(err){
        console.log(err);
    }else{
        console.log("server working");
    } 
});