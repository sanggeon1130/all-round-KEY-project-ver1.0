var express = require('express');
var app = express();
var template = require('./lib/template.js');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var mysql = require('mysql');

app.use(session({
    secret:'abcdefg',
    resave:false,
    saveUninitialized:true,
    store: new FileStore
}))

app.use(express.static('logos'));

var connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'password',
    database:'all_round_key'
});

connection.connect();


function isUser(request, response){
    if(request.session.is_logined){
        return true;
    }
    else{
        return false;
    }
}

function authStatusUI(request, response){
    var authStatusUI = '<a href = "/login">login</a>'
    if(isUser(request, response)){
        authStatusUI = `${request.session.nickname} | <a href = "/logout">logout</a>`
    }
    return authStatusUI;

}

app.use(bodyParser.urlencoded({ extended: false }))




app.get('/', function(request, response){
    if(isUser(request, response)){
        connection.query(`SELECT * FROM ${request.session.nickname}`, function(err, accounts){
            var accountLists = template.list(accounts);
            var title = 'Welcome';
            var body = 'Welcome to all-round-KEY service';
            var _template = template.html(title,accountLists, body,'<a href = "/create_site_account">save your id/password just in case of forgetting it!</a>',authStatusUI(request, response));
            response.send(_template);
        })
    }

    else{
        _template = template.html('Welcome!','','Welcome to all-round-KEY service!','<a href = "/create_account">join us!</a>',authStatusUI(request, response));
        response.send(_template);
    }
 

})

app.get('/accounts/:siteId', function(request, response){
    if(request.params.siteId === 'Welcome'){
        var title = "Welcome";
        var body = "Welcome to all-round-KEY service!";
        var _template = template.html(title,'', body,'<a href = "/create_site_account">save your id/password just in case of forgetting it!</a>',authStatusUI(request, response));
        response.send(_template);
    }
    else{
        connection.query(`SELECT * FROM ${request.session.nickname}`, function(err, accounts){
            var accountLists = template.list(accounts)
            connection.query(`SELECT * FROM ${request.session.nickname} WHERE site_name="${request.params.siteId}"`, function(err, account){
                var title = account[0].site_name;
                var site_id = account[0].site_id;
                var site_pwd = account[0].site_pwd;
                var _template = template.html(title, accountLists,
                `<p><img src = "/${title}.png" width = "300px"></p>${request.params.siteId}'s id : ${site_id} / password : ${site_pwd}
                <p><a href = "https://${title}.com">move to ${title}.com!</a></p><p><a href = "/site_account_update/${request.params.siteId}">update site account</a></p>
                <form action = "/site_account_delete" method = "post">
                <input type = "hidden" name = "delete_site_name" value = "${request.params.siteId}" />
                <input type = "submit" value = "delete site account">
                </form>`
                ,'<a href = "/create_site_account">save your id/password just in case of forgetting it!</a>',authStatusUI(request, response));
                response.send(_template);
            })
        })
        
    
    }
})

app.get('/create_site_account', function(request, response){
    connection.query(`SELECT * FROM ${request.session.nickname}`, function(err, accounts){
    
    var title = "save your id/password";
    var accountLists = template.list(accounts);
    var body = `<form action = "create_site_account" method = "post">
                <p>
                <select name = "site_name">
                <option>Naver</option>
                <option>Instagram</option>
                <option>Facebook</option>
                <option>Google</option>
                <option>EBS</option>
                <option>KakaoTalk</option>
                <option>Wechat</option>
                </select>
                </p>
                <p><input type = "text" name = "site_id" placeholder = "type your site/community's id" style = "width:250px;"/></p>
                <p><input type = "text" name = "site_pwd" placeholder = "type your site/community's password" style = "width:250px;"/></p>
                <p><input type = "text" name = "site_pwd_double_check" placeholder = "type your site/community's password once more" style = "width:300px;"/></p>
                <p><input type = "submit" value = "save!"></p>
                </form>`

    var _template = template.html(title, accountLists, body, '', authStatusUI(request, response));
    response.send(_template);
    })
})

app.post('/create_site_account', function(request, response){
    var post = request.body;
    if(post.site_pwd === post.site_pwd_double_check){
        connection.query(`INSERT INTO ${request.session.nickname} (site_name, site_id, site_pwd) VALUES(?,?,?)`, [post.site_name, post.site_id, post.site_pwd], function(err, results){
            if(err){
                throw err;
            }
            response.redirect(`/accounts/${post.site_name}`);
        })
    }
    else{
        response.send('Sorry your password & double check password is not the same.');
    }
    
})

app.get('/site_account_update/:updateId', function(request, response){
    connection.query(`SELECT * FROM ${request.session.nickname}`, function(err, accounts){
        connection.query(`SELECT * FROM ${request.session.nickname} WHERE site_name="${request.params.updateId}"`, function(err, account){
    
        var title = `Update your id/password FOR ${request.params.updateId}`;
        var accountLists = template.list(accounts);
        var body = `<form action = "/site_account_update" method = "post">
                    <input type = "hidden" name = "updateId" value = "${request.params.updateId}">
                    <p><input type = "text" name = "site_id" value = "${account[0].site_id}" placeholder = "type your site/community's id" style = "width:250px;"/></p>
                    <p><input type = "text" name = "site_pwd" value = "${account[0].site_pwd}" placeholder = "type your site/community's password" style = "width:250px;"/></p>
                    <p><input type = "text" name = "site_pwd_double_check" placeholder = "type your site/community's password once more to update" style = "width:300px;"/></p>
                    <p><input type = "submit" value = "update!"></p>
                    </form>`
    
        var _template = template.html(title, accountLists, body, '', authStatusUI(request, response));
        response.send(_template);
        })
    })
})

app.post('/site_account_update', function(request, response){
    var post = request.body;
    if(post.site_pwd === post.site_pwd_double_check){
    connection.query(`UPDATE ${request.session.nickname} SET site_id=?, site_pwd=? WHERE site_name=?`,[post.site_id, post.site_pwd, post.updateId],function(err, results){
        response.redirect(`/accounts/${post.updateId}`);
    })
}
    else{
        response.send('Sorry your password & double check password is not the same.');
    }

})

app.post('/site_account_delete', function(request, response){
    var post = request.body;
    
    connection.query(`DELETE FROM ${request.session.nickname} WHERE site_name=?`,[post.delete_site_name], function(err, results){
        response.redirect('/');
    })
})

app.get('/create_account', function(request, response){
    var title = "create account!";
    var _template = template.html(title,'',`
       <form action = "/create_account" method = "post">
       <p><input type = "text" name = "id" placeholder = "type your id!"</p>
       <p><input type = "password" name = "password" placeholder = "type your password!"</p>
       <input type = "submit" value = "create account">
       </form>
   
    `,'',authStatusUI(request, response));
    response.send(_template);
})

app.post('/create_account', function(request, response){
    var post = request.body;
    connection.query(`CREATE TABLE ${post.id} (
        id INT(11) NOT NULL AUTO_INCREMENT,
        site_name TEXT NOT NULL,
        site_id TEXT NULL,
        site_pwd TEXT NULL,
        user_password VARCHAR(100) NULL,
        PRIMARY KEY(id));
        `, function(err, results){
            connection.query(`INSERT INTO ${post.id} (site_name, user_password)
            VALUES('Welcome', '${post.password}')
            `, function(err2, results2){
                response.redirect('/');
            })
                })
})

app.get('/login', function(request, response){
    var title = "login";
    var _template = template.html(title,'',`
       <form action = "/login" method = "post">
       <p><input type = "text" name = "id" placeholder = "type your id!"</p>
       <p><input type = "password" name = "password" placeholder = "type your password!"</p>
       <input type = "submit" value = "login">
       </form>
   
    `,'',authStatusUI(request, response));
    response.send(_template);
   })
   
   app.post('/login', function(request, response){
       var post = request.body;
       
       connection.query(`SELECT * FROM ${post.id} `, function(err, userInfo){
           if(post.password === userInfo[0].user_password){
               console.log(userInfo[0].user_password);
               request.session.is_logined = true;
               request.session.nickname = post.id;
               request.session.save(function(){
                   response.redirect('/');
               })
           }
           else{
               response.send('sorry ....something is wrong......')
           }
       })
       
   })



   app.get('/logout', function(request, response){
    request.session.destroy(function(){
        response.redirect('/');
    })
})

app.get('/test', function(request, response){
    connection.query('SELECT * FROM kate', function(err, results){
        console.log('results : ', results);
        console.log(results[0].id);
    })
})


app.listen(3000, function(){
    console.log("port 3000!");
})