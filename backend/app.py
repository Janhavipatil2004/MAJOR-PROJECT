from flask import Flask, render_template, redirect, url_for, request, flash, jsonify, session, send_from_directory
import pymongo
import bcrypt
import tensorflow as tf
import numpy as np
import cv2
import os
import torch
from facenet_pytorch import InceptionResnetV1, MTCNN
from scipy.spatial.distance import cosine
import base64
import io
from PIL import Image

# Flask app setup
app = Flask(__name__, template_folder='../templates', static_folder='static')
app.secret_key = "your_secret_key"
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017"
client = pymongo.MongoClient(MONGO_URI)
db = client["signin"]
collection = db["signindata"]

# Load Models
antispoofing_model = tf.keras.models.load_model("fine_tuned_antispoofing_model.h5")
mtcnn = MTCNN(image_size=160, margin=20)  # Face detection
facenet_model = InceptionResnetV1(pretrained="vggface2").eval()  # FaceNet model

def is_real_face(image):
    """Perform anti-spoofing detection on the given image."""
    try:
        resized_img = cv2.resize(image, (128, 128))
        resized_img = resized_img.astype("float32") / 255.0
        input_img = np.expand_dims(resized_img, axis=0)
        prediction = antispoofing_model.predict(input_img)
        return prediction[0][0] > 0.5
    except Exception as e:
        print("🔥 Error in anti-spoofing:", e)
        return False

def get_embedding(image):
    """Extract a 512D facial embedding from an image."""
    image = Image.fromarray(image)
    face = mtcnn(image)
    if face is None:
        return None
    with torch.no_grad():
        embedding = facenet_model(face.unsqueeze(0))
    return embedding.numpy().flatten()

@app.route('/static/<path:filename>')
def serve_static(filename):
    if filename.endswith('.js'):
        return send_from_directory('static', filename, mimetype='application/javascript')
    return send_from_directory('static', filename)

@app.route('/')
def base():
    return render_template('base.html')

@app.route('/signin', methods=['GET'])
def signin():
    return render_template('signin.html')

@app.route('/register', methods=['POST'])
def register():
    """Handle user registration with anti-spoofing and face embedding storage."""
    try:
        print("🚀 Received Registration Request!")
        print("🔹 Request form data:", request.form)
        print("🔹 Request files:", request.files)

        # Retrieve form data
        name = request.form.get('name')
        username = request.form.get('username')
        email = request.form.get('email')
        phone = request.form.get('phone')
        dob = request.form.get('dob')
        password = request.form.get('password')
        image_data = request.files.get('face_image')
        
        if not all([name, username, email, phone, dob, password, image_data]):
            print("❌ Error: Missing required fields!")
            return jsonify({"status": "error", "message": "Missing required fields!"}), 400

        # Convert image for processing
        nparr = np.frombuffer(image_data.read(), np.uint8)
        face_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if face_img is None or not is_real_face(face_img):
            return jsonify({"status": "error", "message": "Invalid or spoofed face image!"}), 400

        embedding = get_embedding(face_img)
        if embedding is None:
            return jsonify({"status": "error", "message": "No face detected!"}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        if collection.find_one({"username": username}) or collection.find_one({"email": email}):
            return jsonify({"status": "error", "message": "Username or email already exists!"}), 400
        
        user_data = {
            "name": name,
            "username": username,
            "email": email,
            "phone": phone,
            "dob": dob,
            "password": hashed_password,
            "embedding": embedding.tolist()
        }
        
        collection.insert_one(user_data)
        return jsonify({"status": "success", "message": "Registration successful!"}), 200
    
    except Exception as e:
        print("🔥 Error during registration:", e)
        return jsonify({"status": "error", "message": "An error occurred during registration."}), 500

@app.route('/login', methods=['POST'])
def login():
    """Authenticate user using username, password, and face embedding."""
    try:
        username = request.form.get('username')
        password = request.form.get('password')
        image_data = request.files.get('face_image')
        
        if not all([username, password, image_data]):
            print("❌ Error: Missing required fields!")
            return jsonify({"status": "error", "message": "Missing required fields!"}), 400
        
        nparr = np.frombuffer(image_data.read(), np.uint8)
        face_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if face_img is None or not is_real_face(face_img):
            return jsonify({"status": "error", "message": "Invalid or spoofed face image!"}), 400
        
        embedding = get_embedding(face_img)
        if embedding is None:
            return jsonify({"status": "error", "message": "No face detected!"}), 400
        
        user = collection.find_one({"username": username})
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            stored_embedding = np.array(user["embedding"])
            similarity = 1 - cosine(embedding, stored_embedding)
            
            if similarity > 0.7:
                session['temp_user'] = username
                return jsonify({"status": "otp_required", "message": "OTP Verification required", "redirect_url": url_for('otpverification')}), 200
            else:
                return jsonify({"status": "error", "message": "Face authentication failed!"}), 401
        else:
            return jsonify({"status": "error", "message": "Invalid username or password!"}), 400
    
    except Exception as e:
        print("🔥 Error during login:", e)
        return jsonify({"status": "error", "message": "An error occurred during login."}), 500
    

@app.route('/otpverification')
def otpverification():
    """Render OTP verification page with stored username."""
    if 'temp_user' in session:
        return render_template('indexotp.html', username=session['temp_user'])
    return redirect(url_for('signin'))

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and log the user in after EmailJS OTP verification."""
    user_username = request.form.get('username')

    if user_username == session.get('temp_user'):
        session['user'] = session.pop('temp_user', None)
        return jsonify({"status": "success", "message": "OTP verified!", "redirect_url": url_for('dashboard')}), 200

    return jsonify({"status": "error", "message": "Invalid OTP verification."}), 400

@app.route('/dashboard')
def dashboard():
    """Render the dashboard page after OTP verification."""
    if 'user' in session:
        return render_template('login.html', user=session['user'])
    else:
        flash("Please log in to access the dashboard.", "error")
        return redirect(url_for('signin'))

@app.route('/logout')
def logout():
    """Handle user logout."""
    session.pop('user', None)
    flash("You have been logged out.", "success")
    return redirect(url_for('signin'))


if __name__ == '__main__':
    app.run(debug=True)






# WITHOUT FACE REDECTION 

# from flask import Flask, render_template, redirect, url_for, request, flash, jsonify, session, send_from_directory
# import pymongo
# import bcrypt
# import tensorflow as tf
# import numpy as np
# import cv2
# import os

# # Flask app setup
# app = Flask(__name__, template_folder='../templates', static_folder='static')
# app.secret_key = "your_secret_key"
# app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB

# # MongoDB connection
# MONGO_URI = "mongodb://localhost:27017"
# client = pymongo.MongoClient(MONGO_URI)
# db = client["signin"]
# collection = db["signindata"]

# # Load Anti-Spoofing Model
# antispoofing_model = tf.keras.models.load_model("fine_tuned_antispoofing_model.h5")

# def is_real_face(image):
#     """Perform anti-spoofing detection on the given image."""
#     try:
#         resized_img = cv2.resize(image, (128, 128))
#         resized_img = resized_img.astype("float32") / 255.0
#         input_img = np.expand_dims(resized_img, axis=0)
#         prediction = antispoofing_model.predict(input_img)
#         return prediction[0][0] > 0.5
#     except Exception as e:
#         print("🔥 Error in anti-spoofing:", e)
#         return False

# @app.route('/static/<path:filename>')
# def serve_static(filename):
#     if filename.endswith('.js'):
#         return send_from_directory('static', filename, mimetype='application/javascript')
#     return send_from_directory('static', filename)

# @app.route('/')
# def base():
#     return render_template('base.html')

# @app.route('/signin', methods=['GET'])
# def signin():
#     return render_template('signin.html')

# @app.route('/register', methods=['POST'])
# def register():
#     """Handle user registration with anti-spoofing check."""
#     try:
#         print("🚀 Received Registration Request!")
#         print("🔹 Request form data:", request.form)
#         print("🔹 Request files:", request.files)

#         # Retrieve form data
#         name = request.form.get('name')
#         username = request.form.get('username')  # ✅ Added Username Field
#         email = request.form.get('email')
#         phone = request.form.get('phone')
#         dob = request.form.get('dob')
#         password = request.form.get('password')
#         image_data = request.files.get('face_image')

#         if not all([name, username, email, phone, dob, password, image_data]):
#             print("❌ Error: Missing required fields!")
#             return jsonify({"status": "error", "message": "Missing required fields!"}), 400

#         # Convert image for processing
#         nparr = np.frombuffer(image_data.read(), np.uint8)
#         face_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

#         if face_img is None:
#             print("❌ Error: Invalid image data!")
#             return jsonify({"status": "error", "message": "Invalid image data!"}), 400

#         # Perform anti-spoofing check
#         if not is_real_face(face_img):
#             return jsonify({"status": "error", "message": "Face spoofing detected!"}), 400

#         hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

#         # Ensure username and email are unique
#         if collection.find_one({"username": username}):
#             return jsonify({"status": "error", "message": "Username already taken!"}), 400
#         if collection.find_one({"email": email}):
#             return jsonify({"status": "error", "message": "Email already registered!"}), 400

#         user_data = {
#             "name": name,
#             "username": username,  # ✅ Store Username
#             "email": email,
#             "phone": phone,
#             "dob": dob,
#             "password": hashed_password
#         }

#         collection.insert_one(user_data)

#         return jsonify({"status": "success", "message": "Registration successful!"}), 200

#     except Exception as e:
#         print("🔥 Error during registration:", e)
#         return jsonify({"status": "error", "message": "An error occurred during registration."}), 500

# @app.route('/login', methods=['POST'])
# def login():
#     """Handle user login with anti-spoofing check."""
#     try:
#         username = request.form.get('username')  # ✅ Changed to Username
#         password = request.form.get('password')
#         image_data = request.files.get('face_image')

#         if not all([username, password, image_data]):
#             print("❌ Error: Missing required fields!")
#             return jsonify({"status": "error", "message": "Missing required fields!"}), 400

#         nparr = np.frombuffer(image_data.read(), np.uint8)
#         face_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

#         if face_img is None:
#             print("❌ Error: Invalid image data!")
#             return jsonify({"status": "error", "message": "Invalid image data!"}), 400

#         if not is_real_face(face_img):
#             return jsonify({"status": "error", "message": "Face spoofing detected!"}), 400

#         # Authenticate user using username instead of email
#         user = collection.find_one({"username": username})
#         if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
#             session['temp_user'] = username
#             return jsonify({"status": "otp_required", "message": "You Will be redirected to OTP Verification", "redirect_url": url_for('otpverification')}), 200
#         else:
#             return jsonify({"status": "error", "message": "Invalid username or password!"}), 400

#     except Exception as e:
#         print("🔥 Error during login:", e)
#         return jsonify({"status": "error", "message": "An error occurred during login."}), 500

# @app.route('/otpverification')
# def otpverification():
#     """Render OTP verification page with stored username."""
#     if 'temp_user' in session:
#         return render_template('indexotp.html', username=session['temp_user'])
#     return redirect(url_for('signin'))

# @app.route('/verify-otp', methods=['POST'])
# def verify_otp():
#     """Verify OTP and log the user in after EmailJS OTP verification."""
#     user_username = request.form.get('username')

#     if user_username == session.get('temp_user'):
#         session['user'] = session.pop('temp_user', None)
#         return jsonify({"status": "success", "message": "OTP verified!", "redirect_url": url_for('dashboard')}), 200

#     return jsonify({"status": "error", "message": "Invalid OTP verification."}), 400

# @app.route('/dashboard')
# def dashboard():
#     """Render the dashboard page after OTP verification."""
#     if 'user' in session:
#         return render_template('login.html', user=session['user'])
#     else:
#         flash("Please log in to access the dashboard.", "error")
#         return redirect(url_for('signin'))

# @app.route('/logout')
# def logout():
#     """Handle user logout."""
#     session.pop('user', None)
#     flash("You have been logged out.", "success")
#     return redirect(url_for('signin'))

# if __name__ == '__main__':
#     app.run(debug=True)

