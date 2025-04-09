import os
import base64

key = os.urandom(32)  # 32 bytes = 256-bit key
encoded_key = base64.b64encode(key).decode('utf-8')
print(f"Your AES key: {encoded_key}")
