from flask import Flask, render_template, redirect, url_for, request, flash, jsonify
import pymongo
import bcrypt

# Flask app setup
app = Flask(__name__, template_folder="../templates", static_folder="static")
app.secret_key = "your_secret_key"  # Required for flash messages
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017"
client = pymongo.MongoClient(MONGO_URI)
db = client["signin"]
collection = db["signindata"]

# Routes
@app.route('/')
def base():
    """Render the homepage."""
    return render_template('base.html')

@app.route('/signin')
def signin():
    """Render the sign-in page."""
    return render_template('signin.html')

@app.route('/register', methods=['POST'])
def register():
    """Handle user registration."""
    try:
        # Retrieve form data
        name = request.form['name']
        email = request.form['email']
        phone = request.form['phone']
        dob = request.form['dob']
        password = request.form['password']

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Check if the email is already registered
        if collection.find_one({"email": email}):
            return jsonify({"status": "error", "message": "Email already registered!"}), 400

        # Create user data dictionary
        user_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "dob": dob,
            "password": hashed_password
        }

        # Insert user data into the MongoDB collection
        collection.insert_one(user_data)

        # Return a success response
        return jsonify({"status": "success", "message": "Registration successful!"}), 200

    except Exception as e:
        # Log the exception (optional)
        print("Error during registration:", e)

        # Return an error response
        return jsonify({"status": "error", "message": "An error occurred during registration."}), 500

if __name__ == '__main__':
    app.run(debug=True)





