//express is the framework we're going to use to handle requests
const express = require('express');
//Create a new instance of express
const app = express();

const bodyParser = require("body-parser");
//This allows parsing of the body of POST requests, that are encoded in JSON
app.use(bodyParser.json());

//pg-promise is a postgres library that uses javascript promises
const pgp = require('pg-promise')();
//We have to set ssl usage to true for Heroku to accept our connection
pgp.pg.defaults.ssl = true;

//Create connection to Heroku Database
let db = pgp(process.env.DATABASE_URL);

if (!db) {
    console.log("SHAME! Follow the intructions and set your DATABASE_URL correctly");
    process.exit(1);
}

app.post("/InsertPost", (req, res) => {
    let postLocation = req.body['PostLocation'];
    let email = req.body['Email'];
    let desc = req.body['Description'];
    let likes = req.body['Likes'];
    let views = req.body["Views"];

    if (!postLocation || !email || !desc || !likes || !views) {
        res.send({
            success: false,
            error: "missing information"
        });
        return;
    }

    db.one("INSERT INTO Posts(PostLocation, MemberID, PostDesc, Likes, Views) VALUES($1, (SELECT MemberID FROM Members WHERE email = $2), $3, $4, $5);"
        , [postLocation, email, desc, likes, views])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/Registration", (req, res) => {
    let email = req.body['Email'];
    let username = req.body['Username'];

    if (!email || !username) {
        res.send({
            success: false,
            error: "missing information"
        });
        return;
    }

    db.one("INSERT INTO Members(Email, Username, ProfileDescription, ProfileImageLocation, FollowingTotal, FollowersTotal) VALUES($1, $2, '', '/blank-profile-picture-973460_640.png', 0, 0);"
        , [email, username])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/GetAllPosts", (req, res) => {
    let user = req.body['User'];
    let requests = [];
    db.manyOrNone("SELECT * FROM POSTS WHERE MemberID IN (SELECT MemberID_B FROM Follow WHERE MemberID_A = (Select MemberID FROM Members WHERE Email = $1));", [user])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});


app.post("/get_posts_from_user", (req, res) => {
    let user = req.body['User'];
    let requests = [];
    db.manyOrNone("SELECT * FROM POSTS WHERE MemberID = (SELECT MemberID FROM Members WHERE Username = $1);", [user])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/get_posts_from_user_using_email", (req, res) => {
    let user = req.body['User'];
    let requests = [];
    db.manyOrNone("SELECT * FROM POSTS WHERE MemberID = (SELECT MemberID FROM Members WHERE Email = $1);", [user])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/follow_user", (req, res) => {
    let user = req.body['User'];
    let followingUser = req.body['Following'];

    //if (user && followingUser) {
    db.one(`INSERT INTO Follow(MemberID_A, MemberID_B) Values((SELECT MemberID FROM Members where email = $1), (SELECT MemberID FROM Members where Username = $2));
                UPDATE MEMBERS SET FollowersTOTAL = FollowersTOTAL + 1 WHERE MemberID = (SELECT MemberID FROM Members where Username = $2);
                UPDATE MEMBERS SET FollowingTotal = FollowingTotal + 1 WHERE MemberID = (SELECT MemberID FROM Members where Email = $1);`, [user, followingUser])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/unfollow_user", (req, res) => {
    let user = req.body['User'];
    let followingUser = req.body['Following'];

    //if (user && followingUser) {
    db.one(`DELETE FROM FOLLOW WHERE MemberID_A = (SELECT MemberID FROM Members WHERE email = $1) and MemberID_B = (SELECT MemberID FROM Members WHERE Username = $2);
                UPDATE MEMBERS SET FollowersTOTAL = FollowersTOTAL - 1 WHERE MemberID = (SELECT MemberID FROM Members where Username = $2);
                UPDATE MEMBERS SET FollowingTotal = FollowingTotal - 1 WHERE MemberID = (SELECT MemberID FROM Members where Email = $1);`, [user, followingUser])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
    //}
});


app.get("/get_members", (req, res) => {
    let requests = [];
    db.manyOrNone("SELECT * FROM Members;")
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/find_member", (req, res) => {
    let user = req.body['User'];
    let requests = [];
    db.manyOrNone("SELECT * FROM MEMBERS WHERE USERNAME LIKE $1;", ['%' + user + '%'])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/get_user_info", (req, res) => {
    let user = req.body['User'];
    let requests = [];
    db.manyOrNone("SELECT * FROM Members WHERE Email = $1;", [user])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});


app.post("/isUserFollowingMember", (req, res) => {
    let requests = [];
    let user = req.body['User'];
    let followingUser = req.body['Following'];
    db.manyOrNone("SELECT * FROM Follow WHERE MemberID_A = (SELECT MemberID FROM Members WHERE email = $1) and MemberID_B = (SELECT MemberID FROM Members WHERE username = $2);", [user, followingUser])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            if (requests.length > 0) {
                res.send({
                    success: true,
                    //data: requests
                });
            } else {
                res.send({
                    success: false,
                    //data: requests
                });
            }
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});

//get the users that the current user is following
app.post("/get_following", (req, res) => {
    let user = req.body['User'];
    let requests = [];
    db.manyOrNone("SELECT * FROM Members WHERE MemberID IN (SELECT MemberID_B FROM Follow WHERE MemberID_A = (SELECT MemberID FROM Members WHERE Email = $1));", [user])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});

//get the users that are following the current user
app.post("/get_followers", (req, res) => {
    let user = req.body['User'];
    let requests = [];
    db.manyOrNone("SELECT * FROM Members WHERE MemberID IN (SELECT MemberID_A FROM Follow WHERE MemberID_B = (SELECT MemberID FROM Members WHERE Email = $1));", [user])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});


app.post("/change_profile_picture", (req, res) => {
    let user = req.body['User'];
    let location = req.body['ImageLocation'];

    db.one("UPDATE Members SET ProfileImageLocation = $2 WHERE MemberID = (SELECT MemberID FROM Members where Email = $1);", [user, location])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
});


app.post("/like_post", (req, res) => {
    let email = req.body['Email'];
    let postID = req.body['PostID'];
    db.one(`INSERT INTO Likes(MemberID, PostID) VALUES((SELECT MemberID FROM Members WHERE Email = $1), $2);
            UPDATE Posts SET Likes = Likes + 1 WHERE PostID = $2;`
        , [email, postID])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/remove_from_like_post", (req, res) => {
    let email = req.body['Email'];
    let postID = req.body['PostID'];
    db.one(`DELETE FROM Likes WHERE PostID = $2 AND MemberID = (SELECT MemberID FROM Members WHERE Email = $1);
            UPDATE Posts SET Likes = Likes - 1 WHERE PostID = $2;`
        , [email, postID])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/check_if_username_exists", (req, res) => {
    let user = req.body['User'];
    let requests = [];
    db.manyOrNone("SELECT EXISTS (SELECT Username FROM Members WHERE Username = $1);", [user])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/update_username", (req, res) => {
    let username = req.body['New_Username'];
    let email = req.body['Email'];
    db.one(`UPDATE Members SET Username = $1 WHERE Email = $2;`
        , [username, email])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/update_email", (req, res) => {
    let username = req.body['New_Email'];
    let email = req.body['Email'];
    db.one(`UPDATE Members SET Email = $1 WHERE Email = $2;`
        , [username, email])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
});

app.post("/update_description", (req, res) => {
    let description = req.body['New_Description'];
    let email = req.body['Email'];
    db.one(`UPDATE Members SET ProfileDescription = $1 WHERE Email = $2;`
        , [description, email])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
});


app.post("/get_liked_posts", (req, res) => {
    let user = req.body['User'];
    let requests = [];
    db.manyOrNone("SELECT * FROM Posts WHERE PostID IN (SELECT PostID FROM Likes Where MemberID = (Select memberID from members where email = $1));", [user])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});

//GET MEMBER ID USING POST ID
//SELECT * FROM MEMBERS WHERE MEMBERID = (SELECT MemberID FROM Posts WHERE POSTID = $1);

app.post("/get_posts_with_user_info", (req, res) => {
    let email = req.body['Email'];
    let requests = [];
    db.manyOrNone(`SELECT * FROM POSTS INNER JOIN MEMBERS ON(POSTS.MEMBERID = MEMBERS.MEMBERID) 
                   WHERE Members.MEMBERID IN (SELECT MEMBERID_B FROM FOLLOW WHERE MEMBERID_A = (SELECT MEMBERID FROM MEMBERS WHERE Email = $1));`, [email])
        .then(rows => {
            rows.forEach(element => {
                requests.push(element);
            });
            res.send({
                success: true,
                data: requests
            });
        }).catch((err) => {
            console.log(err);
            res.send({
                success: false,
                error: err
            });
        });
});


app.post("/delete_post", (req, res) => {
    let id = req.body['ID'];

    //if (user && followingUser) {
    db.one("DELETE FROM POSTS WHERE POSTID = $1;", [id])
        .then(() => {
            res.send({
                success: true
            });
        }).catch((err) => {
            res.send({
                success: false,
                error: err
            });
        });
    //}
});

//GET POST DATA AND MEMEBR DATA FROM ALL POSTS FROM THE PEOPLE THE USER IS FOLLOWING


/* 
* Heroku will assign a port you can use via the 'PORT' environment variable
* To accesss an environment variable, use process.env.<ENV>
* If there isn't an environment variable, process.env.PORT will be null (or undefined)
* If a value is 'falsy', i.e. null or undefined, javascript will evaluate the rest of the 'or'
* In this case, we assign the port to be 5000 if the PORT variable isn't set
* You can consider 'let port = process.env.PORT || 5000' to be equivalent to:
* let port; = process.env.PORT;
* if(port == null) {port = 5000} 
*/
app.listen(process.env.PORT || 5000, () => {
    console.log("Server up and running on port: " + (process.env.PORT || 5000));
});