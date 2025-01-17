from flask import Flask, render_template, redirect, url_for, request, flash, jsonify , session
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

@app.route('/signin', methods=['GET'])
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
    
@app.route('/login', methods=['POST'])
def login():
    """Handle user login."""
    try:
        # Retrieve form data
        email = request.form['email']
        password = request.form['password']

        # Find the user in the database
        user = collection.find_one({"email": email})
        if user:
            # Check the hashed password
            if bcrypt.checkpw(password.encode('utf-8'), user['password']):
                # Set user session
                session['user'] = user['name']
                flash("Login successful!", "success")
                return redirect(url_for('dashboard'))
            else:
                flash("Invalid password. Please try again.", "error")
        else:
            flash("Email not registered. Please sign up.", "error")
        
        return redirect(url_for('signin'))

    except Exception as e:
        print("Error during login:", e)
        flash("An error occurred during login. Please try again.", "error")
        return redirect(url_for('signin'))

@app.route('/dashboard')
def dashboard():
    """Render the dashboard page."""
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





