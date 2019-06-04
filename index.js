var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http');
var mongo = require('mongodb');
var fs = require('fs')
var jwt = require('jsonwebtoken');
var MongoClient = mongo.MongoClient;
var db;
var url;
var token;
var decoded;
var multer = require('multer');

var storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,'./upload/')
  },
  filename:function(req,file,cb){
    cb(null,Date.now() + '-'+ file.originalname)
  },
})

var upload = multer({
  storage:storage,
  limits:{
    filesize:5*1024*1024
  },
  fileFilter:(req,file,cb)=>{
    if(file.mimetype=='image/jpeg' || file.mimetype=='image/png'){
      cb(null,true)
    }
    else{
      cb(new Error('File not supported'),false)
    }
  }
}
)

MongoClient.connect('mongodb://localhost:27017/messanger',(err,database)=>{
  if(err){
    res.sendStatus(500)
    return false
  }
  else{
    db=database.db('messanger')
    server.listen(3000,()=>{console.log('Server have started')});
  }
})

var server = http.createServer(app)
var io = require('socket.io').listen(server)
server.listen(3000);
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}))
app.use('/style',express.static('style'))
app.use('/upload',express.static('upload'))
app.use('/upload',express.static('upload'))
app.use('/checkToken',express.static('checkToken.js'))
app.use(bodyParser.json())
app.use('/photos',express.static('photos'))

app.get('/',(req,res)=>{
  res.render('SignIn',{message:''})
})

app.get('/signUp',(req,res)=>{
  res.render('SignUp',{alert:'',nameOfClass:''})
})

app.get('/database',(req,res)=>{
    db.collection('usersofchat').find().toArray((error,docs)=>{
    if(error){
      return res.sendStatus(500)
    }
    res.send(docs)
  })
})

app.post('/search',(req,res)=>{
  db.collection('usersofchat').findOne({_id:mongo.ObjectID(req.body.id)},(err,data)=>{
    if(err){
      return false
    }
    res.send(data)
  })
})

app.post('/change',upload.single('avatar'),(req,res)=>{
  if(req.file=='' || req.file==null){
    db.collection('usersofchat').updateOne(
      {_id:mongo.ObjectID(req.body.id)},
      {$set:{
        name:req.body.name,
        lastname:req.body.lastname,
        login:req.body.login
      }},
      (error,result)=>{
        if(error){
          console.log(error);
          return res.sendStatus(500)
        }
        else{
          db.collection('usersofchat').findOne({_id:mongo.ObjectID(req.body.id)},(error,docs)=>{
            if(error){
              console.log(error);
              return res.sendStatus(500)
            }
            res.send(docs)
          })
        }
      })
  }
  else{
    db.collection('usersofchat').updateOne(
      {_id:mongo.ObjectID(req.body.id)},
      {$set:{
        picture:req.file.path,
        name:req.body.name,
        lastname:req.body.lastname,
        login:req.body.login
      }},
      (error,result)=>{
        if(error){
          console.log(error);
          return res.sendStatus(500)
        }
        else{
          db.collection('usersofchat').findOne({_id:mongo.ObjectID(req.body.id)},(error,docs)=>{
            if(error){
              console.log(error);
              return res.sendStatus(500)
            }
            res.send(docs)
          })
        }
      })
  }
  })

app.post('/addUser',(req,res)=>{
  db.collection('usersofchat').insert({
    name:req.body.name,
    lastname:req.body.lastname,
    login:req.body.email,
    password:req.body.password,
    gender:req.body.gender,
    picture:'upload/noName.png'
  },(err,result)=>{
    if(err){
      res.sendStatus(500)
    }
    else{
      res.render('SignUp',{alert:'You are registered',nameOfClass:'alert alert-success'})
    }
  })
})

app.post('/main',(req,res)=>{
  console.log(req.body)
  db.collection('usersofchat').findOne({login:req.body.login,password:req.body.password},(err,result)=>{
    if(err){
      res.sendStatus(500);
      return false
    }
    else if(result==null || result==''){
      res.render('SignIn',{message:'Invalid data'})
    }
    else{
     token=jwt.sign({token:mongo.ObjectID(result._id)},'shhhhh');
     res.render('main',{token:token})
    }
  })
})

app.get('/main',(req,res)=>{
      res.render('main',{token:token})
    });

app.post('/verify',(req,res)=>{
  decoded=jwt.verify(req.body.token,'shhhhh')
  db.collection('usersofchat').findOne({_id:mongo.ObjectID(decoded.token)},(err,data)=>{
    if(err){
      res.sendStatus(500);
      return false
    }
    res.send(data)
  })
});

app.post('/dialog',(req,res)=>{
  decoded=jwt.verify(req.body.token,'shhhhh')
  db.collection('usersofchat').findOne({_id:mongo.ObjectID(decoded.token)},(err,data)=>{
    if(err){
      res.sendStatus(500);
      return false
    }
    res.send(data)
  })
})

app.get('/users',(req,res)=>{
  var id_1=decoded.token
  db.collection('usersofchat').find().toArray((err,data)=>{
    if(err){
      res.sendStatus(500)
    }
    var new_data = data.filter(function(item) {
      return item._id!=decoded.token
    })
        res.render('users',{users:new_data,mainId:id_1})
      }
    )
  })

app.post('/messages',(req,res)=>{
  decoded=jwt.verify(req.body.token,'shhhhh')
  db.collection('usersofchat').findOne({_id:mongo.ObjectID(decoded.token)},(err,data)=>{
    if(err){
      res.sendStatus(500);
      return false
    }
    if(data.chat==null || data.chat==''){
      res.sendStatus(500);
      return false
  }
  else{
    var array=data.chat.filter((item)=>{
      return item.contact==req.body.contact
    })
    array=array.map((item)=>{
      return item.message
    })
    console.log(array)
    res.send(array)
  }
  })
})

app.get('/message',(req,res)=>{
  res.render('message')
});

app.post('/allmes',(req,res)=>{
  decoded=jwt.verify(req.body.token,'shhhhh');
  db.collection('usersofchat').findOne({_id:mongo.ObjectID(decoded.token)},(err,data)=>{
    if(err){
      res.sendStatus(500);
      return false
    }
    if(data.chat=='' || data.chat==null){
      console.log('Suka')
      res.sendStatus(500);
      return false
    }
    var array=data.chat.map((item)=>{
      return item.contact
    })
    var str='';
    function unique(arr) {
      var obj = {};
      for (var i = 0; i < arr.length; i++) {
        var str = arr[i];
        obj[str] = true;
      }
    return Object.keys(obj)
  }
  var newAr=unique(array)
  var data_about_users=[];
    newAr.forEach((it)=>{
      let ar=it.split('/');
      if(ar[0]==decoded.token){
        db.collection('usersofchat').findOne({_id:mongo.ObjectID(ar[0])},(err,data)=>{
          if(err){
            return false
          }
          let main=data.name + ' ' + data.lastname;
          db.collection('usersofchat').findOne({_id:mongo.ObjectID(ar[1])},(err,data)=>{
            if(err){
              return false
            }
            let friend=`${data.name} ${data.lastname}`;
            let picture=data.picture
            data_about_users.push([main,friend,it,picture])
        })
      })
    }
    else{
      db.collection('usersofchat').findOne({_id:mongo.ObjectID(ar[1])},(err,data)=>{
        if(err){
          return false
        }
        let main=data.name + ' ' + data.lastname;
        db.collection('usersofchat').findOne({_id:mongo.ObjectID(ar[0])},(err,data)=>{
          if(err){
            return false
          }
          let friend=`${data.name} ${data.lastname}`;
            let picture=data.picture
          data_about_users.push([main,friend,it,picture])
      })
    })
    }
  })
    setTimeout(()=>{res.send(data_about_users)},2000)
})
})

app.post('/getinfo',(req,res)=>{
  console.log(req.body);
  var page=fs.readFileSync('./views/newchat.ejs');
  url=req.body.url[0]+'&'+req.body.url[1];
  res.send({str:page.toString(),url:url})
})

app.get('/message/:url',(req,res)=>{
    res.render('newmain')
})

app.get('/profile',(req,res)=>{
  res.render('profile')
})

app.get('/chat/:url',(req,res)=>{
  console.log(req.params.url);
  url=req.params.url
  res.render('chat')
})

io.sockets.on('connection',(socket)=>{
  console.log('User have connected');
  socket.join(url)
  socket.on('message',(data)=>{
    var object={message:data.sender+' '+data.message,contact:data.person1._id+'/'+data.person2._id}
    db.collection('usersofchat').updateOne({_id:mongo.ObjectID(data.person1._id)},{
      $push:{
        chat:object
      }
    },(err,res)=>{
    if(err)
      return false
    })
    db.collection('usersofchat').updateOne({_id:mongo.ObjectID(data.person2._id)},{
      $push:{
        chat:object
      }
    },(err,res)=>{
      if(err)
        return false
    })
    if(data.sender==`${data.person1.name} ${data.person1.lastname}`){
          io.to(url).emit('addmess',{message:data.message,sender:data.sender,picture1:data.person1.picture,picture2:data.person2.picture});
    }
    else if(data.sender==`${data.person2.name} ${data.person2.lastname}`){
          io.to(url).emit('addmess',{message:data.message,sender:data.sender,picture1:data.person2.picture,picture2:data.person1.picture});
    }
  })
})
