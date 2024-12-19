import re
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import random
from urllib import request as urllib_request
import time

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = r'D:\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable\ComfyUI\input'
PROCESSED_FOLDER = r'D:\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable\ComfyUI\output'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PROCESSED_FOLDER):
    os.makedirs(PROCESSED_FOLDER)


def queue_prompt(prompt_workflow):
    """Send prompt to ComfyUI."""
    p = {"prompt": prompt_workflow}
    data = json.dumps(p).encode('utf-8')
    req = urllib_request.Request("http://127.0.0.1:8188/prompt", data=data)

    try:
        urllib_request.urlopen(req)
        print("Prompt sent to ComfyUI.")
        return True
    except Exception as e:
        print(f"Error while sending prompt: {e}")
        return False


def find_largest_suffix_file(output_prefix, folder):
    """Find the file with the largest numeric suffix."""
    pattern = re.compile(rf'^{re.escape(output_prefix)}_(\d+)_?\.png$')

    max_suffix = -1
    latest_file = None

    for filename in os.listdir(folder):
        match = pattern.match(filename)
        if match:
            suffix = int(match.group(1))
            if suffix > max_suffix:
                max_suffix = suffix
                latest_file = filename

    return latest_file


def get_existing_files(folder):
    """Return a set of existing files in the folder before processing."""
    return set(os.listdir(folder))


def wait_for_new_image(output_prefix, folder, existing_files, timeout=180, poll_interval=5):
    """Poll the folder for a new image, timeout after 3 minutes."""
    start_time = time.time()

    while time.time() - start_time < timeout:
        current_files = set(os.listdir(folder))
        new_files = current_files - existing_files

        if new_files:
            largest_image = find_largest_suffix_file(output_prefix, folder)
            if largest_image and largest_image in new_files:
                print(f"New image found: {largest_image}")
                return largest_image

        print(f"Waiting for new image... Retrying in {poll_interval} seconds.")
        time.sleep(poll_interval)

    return None


@app.route('/process-images', methods=['POST'])
def process_images():
    images = {}
    # print('Uploaded files:', request.files)  
    # 可選處理的 node_id 列表
    optional_node_ids = ['node_392', 'node_58',
                         'node_460', 'node_436', 'node_459']

    for node_id in optional_node_ids:
        if node_id in request.files:
            file = request.files[node_id]
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            try:
                file.save(file_path)
                images[node_id] = file_path
                # print(f"File {file.filename} saved to {file_path}")
            except Exception as e:
                print(f"Failed to save file {file.filename}: {e}")
                return jsonify({'error': f'Failed to save {file.filename}'}), 400
        else:
            print(f"No file uploaded for {node_id}")

    if not images:  # 如果沒有任何文件被處理
        return jsonify({'error': 'No files were uploaded'}), 400

    prompt_workflow = json.load(
        open('workflow_api.json', 'r', encoding='utf-8'))

    for node_id, file_path in images.items():
        if node_id in prompt_workflow:
            prompt_workflow[node_id]["inputs"]["image"] = file_path
            # print(f"Assigned {file_path} to node {node_id}")
        else:
            print(f"Node {node_id} not found in workflow")

    # 保存輸出文件
    save_image_node = prompt_workflow["461"]
    output_image_filename = 'output'
    save_image_node["inputs"]["filename_prefix"] = output_image_filename

    existing_files = get_existing_files(PROCESSED_FOLDER)

    if queue_prompt(prompt_workflow):
        largest_image = wait_for_new_image(
            output_image_filename, PROCESSED_FOLDER, existing_files)

        if largest_image:
            return jsonify({'image_url': f'{largest_image}'})
        else:
            return jsonify({'error': 'Processed image not found within the timeout'}), 500
    else:
        return jsonify({'error': 'Image processing failed'}), 500


@app.route('/processed_images/<filename>')
def serve_image(filename):
    return send_from_directory(PROCESSED_FOLDER, filename)


if __name__ == '__main__':
    app.run(debug=True)
