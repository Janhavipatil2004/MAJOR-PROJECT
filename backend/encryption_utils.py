import numpy as np
import base64
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the base64-encoded AES key from .env and decode it
key_b64 = os.getenv("AES_SECRET_KEY")
if not key_b64:
    raise ValueError("AES_SECRET_KEY not found in environment variables")

SECRET_KEY = base64.b64decode(key_b64)  # Should be 32 bytes for AES-256

# Derive a consistent IV (e.g., use the first 16 bytes of the key or hash)
IV = SECRET_KEY[:16]  # CBC mode requires 16-byte IV

def encrypt_embedding(embedding):
    """Encrypt the facial embedding using AES-CBC."""
    embedding_bytes = embedding.tobytes()

    # Pad the data to a multiple of AES block size
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(embedding_bytes) + padder.finalize()

    # Encrypt using AES
    cipher = Cipher(algorithms.AES(SECRET_KEY), modes.CBC(IV), backend=default_backend())
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(padded_data) + encryptor.finalize()

    # Encode to base64 string for MongoDB storage
    encrypted_b64 = base64.b64encode(encrypted).decode('utf-8')
    return encrypted_b64

def decrypt_embedding(encrypted_b64):
    """Decrypt the encrypted base64 facial embedding back to a NumPy array."""
    try:
        # Decode base64 string
        encrypted_data = base64.b64decode(encrypted_b64)

        # Decrypt using AES
        cipher = Cipher(algorithms.AES(SECRET_KEY), modes.CBC(IV), backend=default_backend())
        decryptor = cipher.decryptor()
        decrypted_padded = decryptor.update(encrypted_data) + decryptor.finalize()

        # Unpad the data
        unpadder = padding.PKCS7(128).unpadder()
        decrypted = unpadder.update(decrypted_padded) + unpadder.finalize()

        # Convert bytes back to NumPy array
        embedding = np.frombuffer(decrypted, dtype=np.float32)
        return embedding

    except Exception as e:
        print(f"❌ Decryption failed: {e}")
        return None
