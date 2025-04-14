import base64
from collections.abc import Collection
from io import BytesIO
from flask import Flask, render_template, redirect, url_for, request, flash, jsonify, session, send_from_directory
import pymongo
import bcrypt
import tensorflow as tf
import numpy as np
import cv2
import torch
from facenet_pytorch import InceptionResnetV1, MTCNN
from scipy.spatial.distance import cosine
from PIL import Image
import random
from datetime import datetime
from flask_mail import Mail, Message 
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from encryption_utils import encrypt_embedding, decrypt_embedding



# Flask app setup
app = Flask(__name__, template_folder='../templates', static_folder='static')
app.secret_key = "your_secret_key"
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB

# MongoDB connection
# MONGO_URI = "mongodb://localhost:27017"
# client = pymongo.MongoClient(MONGO_URI)
# db = client["signin"]
# collection = db["signindata"]

MONGO_URI = "mongodb+srv://faciallogin22:VRkfgqnMg2cKicsv@facelogin.tnlk2if.mongodb.net/?retryWrites=true&w=majority&appName=facelogin"
client = MongoClient(MONGO_URI)
db = client["facelogin_db"] 
users_collection = db["users"]   


# Flask-Mail Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Change if using a different SMTP provider
app.config['MAIL_PORT'] = 587  # Use 465 for SSL
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'faciallogin22@gmail.com'  # Your email
app.config['MAIL_PASSWORD'] = 'zeym jlce uxks bqlt '  # App password if using Gmail
app.config['MAIL_DEFAULT_SENDER'] = 'FacialLoginSystem@gmail.com'  # Sender email

mail = Mail(app)

 # Load Models
antispoofing_model = tf.keras.models.load_model("fine_tuned_antispoofing_model.h5")
mtcnn = MTCNN(image_size=160, margin=20, keep_all=True)  # Face detection (keep_all=True for multiple faces)
facenet_model = InceptionResnetV1(pretrained="vggface2").eval()



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

def get_embeddings(image):
    """Extract facial embeddings for multiple faces."""
    image = Image.fromarray(image)
    faces = mtcnn(image)
    
    if faces is None:
        return None, "No face detected!"
    if len(faces) > 1:
        return None, "Multiple faces detected! Please upload an image with a single face."
    
    with torch.no_grad():
        embedding = facenet_model(faces[0].unsqueeze(0))
    return embedding.numpy().flatten(), None

def face_already_registered(new_embedding):
    """Check if the face is already registered in the database."""
    users = users_collection.find()
    for user in users:
        # Decrypt the stored embedding
        stored_embedding_b64 = user.get("embedding")
        stored_embedding = decrypt_embedding(stored_embedding_b64)

        if stored_embedding is not None:
            similarity = 1 - cosine(new_embedding, stored_embedding)
            if similarity > 0.7:
                return True
    return False

@app.after_request
def add_no_cache_headers(response):
    """Prevent caching to ensure session logout on back navigation."""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/static/<path:filename>')
def serve_static(filename):
    if filename.endswith('.js'):
        return send_from_directory('static', filename, mimetype='application/javascript')
    return send_from_directory('static', filename)

@app.template_filter('datetimeformat')
def datetimeformat(value, format='%B %d, %Y at %H:%M'):
    return datetime.now().strftime(format)

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
        name = request.form.get('name')
        username = request.form.get('username')
        email = request.form.get('email')
        phone = request.form.get('phone')
        dob = request.form.get('dob')
        password = request.form.get('password')
        image_data = request.files.get('face_image')
        
        if not all([name, username, email, phone, dob, password, image_data]):
            return jsonify({"status": "error", "message": "Missing required fields!"}), 400
        
        nparr = np.frombuffer(image_data.read(), np.uint8)
        face_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if face_img is None or not is_real_face(face_img):
            return jsonify({"status": "error", "message": "Invalid or spoofed face image!"}), 400
        
        embedding, error_message = get_embeddings(face_img)
        if error_message:
            return jsonify({"status": "error", "message": error_message}), 400
        
        if face_already_registered(embedding):
            return jsonify({"status": "error", "message": "Face already registered!"}), 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        if users_collection.find_one({"username": username}) or users_collection.find_one({"email": email}):
            return jsonify({"status": "error", "message": "Username or email already exists!"}), 400
        
# Encrypt the embedding before storing
        encrypted_embedding = encrypt_embedding(embedding)
        user_data = {
    "name": name,
    "username": username,
    "email": email,
    "phone": phone,
    "dob": dob,
    "password": hashed_password,
    "embedding": encrypted_embedding
}

        
        users_collection.insert_one(user_data)
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

        # Debugging logs
        print("Received Username:", username)
        print("Received Password:", bool(password))  
        print("Received Image Data:", image_data is not None)

        # Check for missing fields
        if not all([username, password, image_data]):
            print("❌ Error: Missing required fields!")
            return jsonify({"status": "error", "message": "Missing required fields!"}), 400

        # Read image and decode
        nparr = np.frombuffer(image_data.read(), np.uint8)
        face_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Ensure valid image and anti-spoofing check
        if face_img is None or not is_real_face(face_img):
            return jsonify({"status": "error", "message": "Invalid or spoofed face image!"}), 400

        # Extract face embedding
        embedding_result = get_embeddings(face_img)

        # Ensure it is a NumPy array
        if isinstance(embedding_result, tuple):
            embedding = embedding_result[0]  # Extract only the embedding
        else:
            embedding = embedding_result

        if embedding is None:
            return jsonify({"status": "error", "message": "No face detected!"}), 400

        # Find user in MongoDB
        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"status": "error", "message": "Invalid username or password!"}), 400

        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
            return jsonify({"status": "error", "message": "Invalid username or password!"}), 400

        # Ensure stored embedding exists
        stored_embedding = user.get("embedding")
        if stored_embedding is None:
            return jsonify({"status": "error", "message": "No facial data found for user!"}), 400

        # Convert stored embedding to NumPy array
        # Decrypt the stored encrypted embedding
        stored_embedding = decrypt_embedding(stored_embedding)
        if stored_embedding is None:
            return jsonify({"status": "error", "message": "Failed to decrypt facial data!"}), 500


        # Ensure embedding dimensions match
        if stored_embedding.shape != embedding.shape:
            return jsonify({"status": "error", "message": "Embedding dimension mismatch!"}), 400

        # Compute similarity
        similarity = 1 - cosine(embedding, stored_embedding)
        print(f"🔹 Similarity Score: {similarity}")

        # Authentication success check
        if similarity > 0.7:
            session['temp_user'] = username
            session['temp_name'] = user['name']
            session['temp_email'] = user['email'] 
            return jsonify({
                "status": "otp_required",
                "message": "OTP Verification required",
                "redirect_url": url_for('otpverification')
            }), 200
        else:
            return jsonify({"status": "error", "message": "Face authentication failed!"}), 401

    except Exception as e:
        print("🔥 Error during login:", e)
        return jsonify({"status": "error", "message": "An error occurred during login."}), 500

@app.route('/send-otp', methods=['POST'])
def send_otp():
    """Generate OTP and send via email using Flask-Mail."""
    try:
        email = session.get('temp_email')  # ✅ Get email from session

        if not email:
            return jsonify({"status": "error", "message": "Email not found in session!"}), 400
        
        otp = str(random.randint(1000, 9999))
        session['otp'] = otp
        session['otp_email'] = email

        msg = Message(
            "Your One-Time Password (OTP) for Secure Verification",
            recipients=[email]
        )
        msg.body = (
            "Dear User,\n\n"
            f"Your one-time password (OTP) for verification is:\n\n   {otp}   \n\n"
            "This OTP is valid for 2 minutes. Please do not share it with anyone for security reasons.\n\n"
            "If you did not request this OTP, please ignore this message.\n\n"
            "Best regards,\n"
            "Facial Login System"
        )
        mail.send(msg)

        return jsonify({"status": "success", "message": "OTP sent successfully!"})
    
    except Exception as e:
        print("🔥 Error sending OTP:", e)
        return jsonify({"status": "error", "message": "Failed to send OTP. Please try again."}), 500

@app.route('/otpverification')
def otpverification():
    """Render OTP verification page with stored username."""
    if 'temp_user' in session:
        user = users_collection.find_one({"username": session['temp_user']})
        if user and 'email' in user:
            session['otp_email'] = user['email']  
            return render_template('indexotp.html', username=user['username'])
    return redirect(url_for('signin'))


@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and log the user in"""
    try:
        user_otp = request.json.get('otp')
        email = request.json.get('email')



        # ✅ Check stored OTP and email in session
        if 'otp' in session and 'otp_email' in session:
            if user_otp == session['otp'] and email == session['otp_email']:
                session.pop('otp', None)
                session.pop('otp_email', None)
                session['user'] = email
                session['name'] = session.get('temp_name') 

                return jsonify({
                    "status": "success", 
                    "message": "OTP verified!", 
                    "redirect_url": url_for('dashboard')
                }), 200

        return jsonify({"status": "error", "message": "Invalid OTP!"}), 400

    except Exception as e:
        print("🔥 Error verifying OTP:", e)
        return jsonify({"status": "error", "message": "An error occurred during OTP verification."}), 500

@app.route('/dashboard')
def dashboard():
    """Render the dashboard page after OTP verification."""
    if 'user' in session:
        user_email = session['user']

        # Fetch full user info from DB
        user = users_collection.find_one(
            {"email": user_email},
            {"_id": 0, "name": 1, "username": 1, "email": 1, "phone": 1, "dob": 1}
        )

        if user:
            return render_template('login.html', user=user, now=datetime.now())

    flash("Please log in to access the dashboard.", "error")
    return redirect(url_for('signin'))


@app.route('/editprofile')
def edit_profile():
    if 'user' not in session:
        return redirect(url_for('signin'))

    user_email = session['user']
    user = users_collection.find_one({"email": user_email}, {
        "_id": 0,  # Exclude MongoDB's internal ID field
        "name": 1,
        "username": 1,
        "email": 1,
        "phone": 1,
        "dob": 1
    })

    if not user:
        flash("User not found.", "error")
        return redirect(url_for('dashboard'))

    return render_template('editprofile.html', user=user)


@app.route('/updateprofile', methods=['POST'])
def update_profile():
    if 'user' not in session:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.get_json()
    user_email = session['user']

    updated_fields = {
        "username": data.get("username"),
        "name": data.get("name"),
        "email": data.get("email"),
        "phone": data.get("phone"),
        "dob": data.get("dob") 
    }

    # Handle facial embedding update if image is provided
    face_image_data = data.get("faceImage")
    if face_image_data:
        try:
            # Decode base64 image
            header, encoded = face_image_data.split(",", 1)
            decoded = base64.b64decode(encoded)
            image = Image.open(BytesIO(decoded)).convert("RGB")
            image_np = np.array(image)

            # Anti-spoofing check
            if not is_real_face(image_np):
                return jsonify({"message": "Invalid or spoofed face image!"}), 400

            # Facial embedding extraction
            embedding, error_message = get_embeddings(image_np)
            if error_message:
                raise ValueError(error_message)

            # Optional: Check if this face already belongs to someone else
            # if face_already_registered(embedding):
            #     return jsonify({"message": "Face already registered!"}), 400

            # Encrypt the embedding before storing
            encrypted_embedding = encrypt_embedding(embedding)

            # Save to update fields
            updated_fields['embedding'] = encrypted_embedding

        except Exception as e:
            print("🔥 Facial update error:", e)
            return jsonify({"message": f"Facial data update failed: {str(e)}"}), 500

    # Update database
    users_collection.update_one({"email": user_email}, {"$set": updated_fields})
    return jsonify({"message": "Profile updated successfully." , "redirect": "/dashboard"})

@app.route('/logout')
def logout():
    """Handle user logout."""
    session.pop('user', None)
    flash("You have been logged out.", "success")
    return redirect(url_for('signin'))

@app.route('/force-logout', methods=['POST'])
def force_logout():
    """Forcefully log out the user when they click the back button."""
    session.clear()  # ✅ Completely remove session data
    return jsonify({"status": "success", "message": "Session cleared"}), 200


if __name__ == '__main__':
    app.run(debug=True)

