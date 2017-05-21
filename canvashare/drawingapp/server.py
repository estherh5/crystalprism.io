import base64, glob, json, os, time

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS


app = Flask(__name__)
cors = CORS(app, resources = {r"/api/*": {"origins": "*"}})


@app.route('/api/drawing/<image>', methods = ['POST', 'GET'])
def drawing(image):
    if request.method == 'POST':
        return add_drawing(image)
    if request.method == 'GET':
        return get_drawing(image)


@app.route('/api/gallery', methods = ['GET'])
def gallery():
    if request.method == 'GET':
        return get_all_drawings()


def add_drawing(image):
    data = request.get_json()
    if os.path.exists('drawings/' + image + '.png'):
        same_name = image + '`{}' + '.png'
        filename = same_name.format(int(time.time()))
    else:
        filename = image + '.png'
    # Remove 'data:image/png;base64'
    image = data['image'].split(',')[1].encode('utf-8')
    with open('drawings/' + filename, 'wb') as drawing_file:
        drawing_file.write(base64.decodestring(image))
    return "Success!"

def get_drawing(image):
    return send_file('drawings/' + image)

def get_all_drawings():
    request_start = int(request.args.get('start'))
    request_end = int(request.args.get('end'))
    all_drawings = glob.glob('drawings/*')
    all_drawings.sort(key = os.path.getctime, reverse = True)
    requested_drawings = all_drawings[request_start:request_end]
    images = [os.path.basename(i) for i in requested_drawings]
    return jsonify(images)
