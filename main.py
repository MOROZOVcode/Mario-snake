from flask import Flask, redirect ,make_response, request ,render_template,url_for
from flask_login import UserMixin 
from random import randint , choices, choice
from string import printable
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash 
import uuid
import hashlib
import os
from Crypto.Util.number import inverse


app = Flask(__name__)
app.debug = True
app.config.update(dict(
    SQLALCHEMY_DATABASE_URI='sqlite:///users_new.db'
))

db= SQLAlchemy(app)

flag = "flag{example_flag}"
P = 6979520618971463181853952779744486485758205309313269005483564634973779590390774016808091656989799435166737441010157234689596767531301352351693565240807853

def get_flag():
    return flag

class User(db.Model , UserMixin):
    __tablename__ = 'Users'
    id = db.Column(db.Integer() , primary_key = True)
    username = db.Column(db.String(80) , nullable = False, unique = True)
    password_hash=db.Column(db.String(100),nullable=False)
    info_public = db.Column(db.String(200))
    info_private = db.Column(db.String(100))
    points = db.Column(db.Integer() , nullable=False, default = 0)
    user_uid = db.Column(db.String(36) , nullable=False ,unique = True)

    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self,password):
        self.password_hash = generate_password_hash(password)

    def check_password(self,password):
        return check_password_hash(self.password_hash, password)

@app.route('/' , methods = ['get' , 'post'])
def start():
    if request.method == 'POST':
        if 'sign_button' in request.form:
            return redirect(url_for('sign'))
        elif 'login_button' in request.form:
            return redirect(url_for('login'))
    return render_template("index.html")

@app.route("/sign" , methods=['post' , 'get'])
def sign():
    if request.method == 'POST':
        if db.session.query(User).filter_by(username =  request.form.get('username')).all():
            return render_template('sign.html', error="Пользователь с таким именем уже есть")
        id_ = db.session.query(User).count() + 1
        uuid_ = uuid.UUID(bytes=os.urandom(16) , version=4)
        u = User(username = request.form.get('username') , user_uid=str(uuid_) )
        u.set_password(request.form.get('password'))
        db.session.add(u)
        db.session.commit()
        res = make_response(redirect(url_for('cabinet' , id=id_)))
        res.set_cookie("uuid",str(uuid_) ,max_age=60*60*365*24)
        return res 
    return render_template("sign.html")

@app.route('/login',methods=['post','get'])
def login():
    if request.method == 'POST':
        user = db.session.query(User).filter(User.username == request.form.get('username')).first()
        if user and user.check_password(request.form.get('password')):
            id_ = int(db.session.query(User.id).filter(User.username == request.form.get('username')).all()[0][0])
            res = make_response(redirect(url_for('cabinet' , id=id_)))
            uuid_ = str(db.session.query(User.user_uid).filter(User.username == request.form.get('username')).all()[0][0])
            res.set_cookie("uuid",uuid_ , max_age = 60 * 60 * 24 * 365)
            return res
        else:
            return render_template('login.html', error="Неверный пароль/логин")
    return render_template('login.html')

@app.route("/cabinet/<int:id>/" , methods=['post','get'])
def cabinet(id ):
    if "uuid" not in request.cookies:
        return redirect(url_for('login'))
    if len(db.session.query(User).filter(User.user_uid == request.cookies["uuid"]).all()) == 0:
        return redirect(url_for('login'))
    id_ = int(db.session.query(User.id).filter(User.user_uid == request.cookies["uuid"]).all()[0][0])
    
    if id_ == id:
        if request.method == 'POST':
            return redirect(url_for('settings' , id = id_))
        username , public_info ,private_info , points = db.session.query(User.username , User.info_public , User.info_private ,User.points).filter(User.id == id_).all()[0]
        table_point = db.session.query(User.username).order_by(User.points.desc()).all()
        for i,j in enumerate(table_point):
            if j[0] == username:
                rating = i + 1
                break
        return render_template("cabinet.html" , id = id_, username = username , owner= True , public_info = public_info if public_info != None else "" , private_info = private_info  if private_info != None else "", points = points , rating = rating)
    else:
        if id > db.session.query(User).count() or id <= 0:
            return redirect(url_for('cabinet' ,  id = id_  ))
        else:
            username , public_info  , points = db.session.query(User.username , User.info_public ,User.points).filter(User.id == id).all()[0]
            table_point = db.session.query(User.username).order_by(User.points.desc()).all()
            for i,j in enumerate(table_point):
                if j[0] == username:
                    rating = i + 1
                    break
            return render_template("cabinet.html",id = id_ , username = username , owner= False , public_info = public_info if public_info != None else "" , points = points , rating = rating)


    

@app.route("/cabinet/<int:id>/settings" , methods=['post','get'])
def settings(id):
    if "uuid" not in request.cookies:
        return redirect(url_for('login'))
    if len(db.session.query(User).filter(User.user_uid == request.cookies["uuid"]).all()) == 0:
        return redirect(url_for('login'))
    id_ = int(db.session.query(User.id).filter(User.user_uid == request.cookies["uuid"]).all()[0][0])
    if id_ == id and id_ != 1:
        if request.method == 'POST':
            username = request.form.get('username')
            public_info = request.form.get('public_info')
            private_info = request.form.get('private_info')
            U = db.session.query(User).get(id)
            U.info_public = public_info
            U.info_private = private_info
            if db.session.query(User).filter(User.username == username).count() == 0 and U.username != username:
                U.username = username
            db.session.commit()
            return redirect(url_for('cabinet' , id = id_))

        username , public_info ,private_info = db.session.query(User.username , User.info_public , User.info_private ).filter(User.id == id_).all()[0]
        return render_template("settings.html",id = id_ , username = username , public_info = public_info if public_info != None else "" , private_info = private_info  if private_info != None else "")
    else:
        return redirect(url_for('cabinet' , id = id_))
            

@app.route("/cabinet/rating")
def rating():
    table_bd = db.session.query(User.id , User.username , User.points).order_by(User.points.desc()).all()
    table = []
    for i, U in enumerate(table_bd):
        a = []
        a.append(i+1)
        a.append(U.id)
        a.append(U.username)
        a.append(U.points)
        table.append(a)
    if "uuid" not in request.cookies or len(db.session.query(User).filter(User.user_uid == request.cookies["uuid"]).all()) == 0:
        return render_template("rating.html" , table = table , nologin=True)
    id_ = int(db.session.query(User.id).filter(User.user_uid == request.cookies["uuid"]).all()[0][0])
    return render_template("rating.html" ,id = id_, table = table , login=True)

@app.route("/cabinet/game" , methods = ["get" , "post"])
def game():
    if "uuid" not in request.cookies:
        return redirect(url_for('login'))
    if len(db.session.query(User).filter(User.user_uid == request.cookies["uuid"]).all()) == 0:
        return redirect(url_for('login'))
    while request.method == 'POST':
        id = int(db.session.query(User.id).filter(User.user_uid == request.cookies["uuid"]).all()[0][0])
        try:
            score = int(request.args.get('score'))
            p_req = int(request.args.get('p'))
            y = int(request.args.get('y'))
            r = int(request.args.get('r'))
            s = int(request.args.get('s'))
        except Exception as e:
            print(e)
            break
        g = 2
        h = hashlib.sha256(str(score).encode()).hexdigest()
        h = int(h , 16)
        if p_req != P or r > P or s > P or pow(y , r , P) * pow(r, s % (P-1),P) % P != pow(g , h , P):
            print("Подпись неверна!")
            break
        U = db.session.query(User).get(id) 
        points_old = U.points
        if score > points_old and score < 200:
            U.points = score
        db.session.commit()
        break
                
    id_ = int(db.session.query(User.id).filter(User.user_uid == request.cookies["uuid"]).all()[0][0])
    return render_template("game.html" , id=id_)


@app.route("/logout")
def logout():
    res = make_response(redirect(url_for('login')))
    res.set_cookie("uuid" , "" , max_age = 0)
    return res

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        if db.session.query(User).count() < 5:
            username_mass = ["Bowser" , "Cheep Cheep" , "Goomba" , "Koopa Troopa" , "Lakitu"]
            password_mass = ["".join(choices(printable[:63] , k=20 )) for i in range(5)]
            points_mass = [90] + [randint(50,90) for i in range(4)]
            public_info_mass = ["This is public!" for i in range(5)]
            private_info_mass = [flag] + ["flag{this_is_fake_flag}" for i in range(4)]
            for i in range(5):
                uuid_ = uuid.UUID(bytes=os.urandom(16) , version=4)
                u = User(username = username_mass[i], info_public=public_info_mass[i] , info_private = private_info_mass[i] , points = points_mass[i] , user_uid=str(uuid_) )
                u.set_password(password_mass[i])
                db.session.add(u)
            db.session.commit()
    app.run("0.0.0.0" , 15005)