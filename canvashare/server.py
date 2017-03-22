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
    # Remove 'data:image/png;base64'
    data = request.data.decode('utf-8').split(',')[1].encode('utf-8')
    with open('drawing.png', 'wb') as drawing_file:
        drawing_file.write(base64.decodestring(data))
    return "Success!"


def get_drawing():
    return open('drawing.png').read()
