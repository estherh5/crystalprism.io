import base64, glob, json, os, time

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS


app = Flask(__name__)
cors = CORS(app, resources = {r"/api/*": {"origins": "*"}})


@app.route('/api/drawing/<image_name>', methods = ['POST', 'GET'])
def drawing(image_name):
    if request.method == 'POST':
        return add_drawing(image_name)
    if request.method == 'GET':
        return get_drawing(image_name)


@app.route('/api/gallery', methods = ['GET'])
def gallery():
    if request.method == 'GET':
        return get_all_drawings()


def add_drawing(image_name):
    # Get JSON image data URL in base64 format
    data = request.get_json()
    # Remove 'data:image/png;base64'
    image = data['image'].split(',')[1].encode('utf-8')
    if os.path.exists('drawings/' + image_name + '.png'):
        same_name = image_name + '`{}' + '.png'
        filename = same_name.format(int(time.time()))
    else:
        filename = image_name + '.png'
    with open('drawings/' + filename, 'wb') as drawing_file:
        drawing_file.write(base64.decodestring(image))
    return "Success!"

def get_drawing(image_name):
    return send_file('drawings/' + image_name)

def get_all_drawings():
    request_start = int(request.args.get('start'))
    request_end = int(request.args.get('end'))
    all_drawings = glob.glob('drawings/*')
    all_drawings.sort(key = os.path.getctime, reverse = True)
    requested_drawings = all_drawings[request_start:request_end]
    images = [os.path.basename(i) for i in requested_drawings]
    return jsonify(images)
