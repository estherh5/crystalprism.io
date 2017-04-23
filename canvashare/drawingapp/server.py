import base64, glob, json, os

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS


app = Flask(__name__)
cors = CORS(app, resources = {r"/api/*": {"origins": "*"}})


@app.route('/api/drawing/<image>', methods = ['POST', 'GET'])
def drawing(image):
    if request.method == 'POST':
        return add_drawing()
    if request.method == 'GET':
        return get_drawing(image)


@app.route('/api/gallery', methods = ['GET'])
def gallery():
    if request.method == 'GET':
        return get_all_drawings()


def add_drawing():
    data = request.get_json()
    filename = data['filename'] + '.png'
    # Remove 'data:image/png;base64'
    image = data['image'].split(',')[1].encode('utf-8')
    with open('drawings/' + filename, 'wb') as drawing_file:
        drawing_file.write(base64.decodestring(image))
    return "Success!"

def get_drawing(image):
    return send_file('drawings/' + image)

def get_all_drawings():
    images = [os.path.basename(i) for i in glob.glob('drawings/*')]
    return jsonify(images)
