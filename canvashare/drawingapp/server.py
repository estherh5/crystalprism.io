import json
import base64

from flask import Flask, request
from flask_cors import CORS


app = Flask(__name__)
cors = CORS(app, resources = {r"/api/*": {"origins": "*"}})


@app.route('/api/drawing', methods = ['POST', 'GET'])
def drawing():
    if request.method == 'POST':
        return add_drawing()
    elif request.method == 'GET':
        return get_drawing()


def add_drawing():
    data = request.get_json()
    filename = data['filename'] + '.png'
    # Remove 'data:image/png;base64'
    image = data['image'].split(',')[1].encode('utf-8')
    with open(filename, 'wb') as drawing_file:
        drawing_file.write(base64.decodestring(image))
    return "Success!"
