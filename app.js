var express        = require('express'),
    app            = express(),
    bodyParser     = require('body-parser'),
    mongoose       = require('mongoose'),
    party          = require('./models/party'),
    comment        = require('./models/comment'),
    user           = require('./models/user'),
    passport       = require('passport'),
    methodOverride = require('method-override'),
    localStrategy  = require('passport-local')


//Password confirgautrsj
app.use(require('express-session')({ 
    secret:'I am an IAs',
    resave: false,
    saveUninitialized:false
}))


app.use(methodOverride('_method'));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());



app.use(function(req, res, next) { 
    res.locals.currentUser = req.user;
    next();

 })





mongoose.connect("mongodb://localhost:27017/delta",
{ useUnifiedTopology : true,
     useNewUrlParser : true,
     useFindAndModify:false
}

)
//Schema setuuup
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');  
app.use(express.static(__dirname + '/public')) 

app.get('/',function(req,res){ 
    res.render('landing')
})

app.get('/party',function(req,res){ 
    //get all the party from the db
    
    party.find({},function(err, allparty){ 
        if(err){ 
            console.log(err)
         } else { 
            res.render('party',{party: allparty, currentUser:req.user});
         }

    })  
})

app.post('/party',function(req,res){ 
    // get data from the for and add to the party pager
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var newParty = {name:name,image:image,description:description};
    //create new party and save it to dbIndex
    party.create(newParty,function(err,party){  
        if(err){ 
            console.log(err);
        }else {
            res.redirect('/party')

        }
    })
    
    
      
})

app.get('/party/new',function(req,res){ 
    res.render('new')

})

// Show more info about one campground

app.get('/party/:id',function(req,res){ 
    party.findById(req.params.id).populate('comment').exec(function(err,foundParty){ 
        // is user logged in and
        // if not redirect it somewhere else
        if(err){ 
            console.log(err);
         } else{ 
             console.log(foundParty)
             res.render('show',{party:foundParty});

          }

    })    
})

// ================================================================================
// comments routers
// ===============================================================================

app.get('/party/:id/comment/new',isLoggedIn,function(req,res){  
    // find the party by id
    party.findById(req.params.id,function(err,party){ 
        if(err){ 
            console.log(err);
        } else{ 
            res.render('new-comment',{party:party});

        }
    })   
})

app.post('/party/:id/comment',function(req,res){ 
    // look up the party using id
    // create a new comment
    // connect the comment to party
    // redirect to party pager
    party.findById(req.params.id,function(err,party){ 
        if(err){ 
            console.log(err);
            res.redirect('/party')
        } else {  
           comment.create(req.body.comment,function(err,comment){
               if(err){ 
                   console.log(err);
                } else{ 
                     party.comments.push(comment);
                    party.save();
                    res.redirect('/party/' + party._id );
                }  

           })


        }

     })
})

// =================
// Auth Routes 
// =================

app.get('/register',function(req,res){ 
    res.render('register')
})
// handle sign up logical
app.post('/register',function(req,res){  
    var newUser = new user({username:req.body.username});
    user.register(newUser,req.body.password,function(err,party){  
        if(err){ 
            console.log(err)
            res.render('register')
         }
         passport.authenticate('local')(req,res,function(){ 
             res.redirect('/party')

          })
    })

 })


 app.get('/login',function(req,res){ 
     res.render('login')
  })

// app.post('/login',middleware,callback)
app.post('/login', passport.authenticate('local',
{
    successRedirect: '/party',
    failureRedirect: '/login'


}),function(req,res){ 

})

// logic route

app.get('/logout',function(req,res){ 
    req.logout();
    res.redirect('/party')

    
})

function isLoggedIn(req,res,next){ 
    if(req.isAuthenticated()){
        return next();
     }
     res.redirect('/login')


 } 

 // edit party route
app.get('/party/:id/edit', function(req,res){ 

        party.findById(req.params.id,function(err,foundParty){ 
            if(err){ 
                res.redirect('/party')
            } else { 
               
                res.render('edit',{party:foundParty});
            }
        });
    
})

//update route for
app.put('/party/:id',function(req,res){ 
    //  find and update correct party id//
    //redirect somewhere else
    party.findByIdAndUpdate(req.params.id, req.body.party,(function(err,updatedParty){
        if(err){ 
            res.redirect('/party')
         } else { 
             res.redirect('/party/' + req.params.id)

          }

    }))

 })

 // destroy route
app.delete('/party/:id', function (req, res){ 
    party.findByIdAndRemove(req.params.id, function(err){ 
        if(err){ 
            res.redirect('/party')
         } else{ 
             res.redirect('/party')

        }

    })
})




















app.listen(3000,function(){ 
    console.log('The server is listening...')
})
