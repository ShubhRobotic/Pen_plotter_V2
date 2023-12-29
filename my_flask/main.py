from flask import Flask, flash, redirect, render_template, request, Response
from werkzeug.utils import secure_filename
from subprocess import run
import subprocess
import os
import glob
from PIL import Image
import serial

import time

app = Flask(__name__, static_folder="static",)
app.config["SECRET_KEY"] = "Gooseberry"
# app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "/home/penplotter/Pen_plotter_V2/my_flask/static/Image_Storage/Images")  # saves all images uploaded
app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "/home/shubh/Pen_plotter_V2/my_flask/static/Image_Storage/Images")  # saves all images uploaded
app.config["GCODE_FOLDER"] = os.path.join(app.root_path, "/home/shubh/Pen_plotter_V2/my_flask/static/Image_Storage/Gcodes")   # saves all gcode converted from images and text folder 
app.config["TEXT_FOLDER"] = os.path.join(app.root_path, "/home/shubh/Pen_plotter_V2/my_flask/static/Image_Storage/Text")      # save all Pdf uploaded
cargo = os.path.join(app.root_path,"/home/shubh/Pen_plotter_V2/my_flask/svg2gcode/svg2gcode")     # converter for images to gcode 
setting = os.path.join(app.root_path,"/home/shubh/Pen_plotter_V2/my_flask/static/Setting/svg2gcode_settings.json") # some required gcode parameter for this specific plotter 
current_Gcode = "/home/shubh/Pen_plotter_V2/my_flask/static/Image_Storage/Gcodes/previous.gcode" # location to current gcode file
logo_filename = "/home/shubh/Pen_plotter_V2/my_flask/Testing_Folder/mvths engineering (2).gcode" # location to small sketch needed for paper roller sensor that get added to current gcode file.



def allowed_file(filename, allowed_extensions):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions

@app.route("/", methods=["GET", "POST"])
def home():
    if request.method == "POST":
        print("Made it to post")
        submit_button = request.form.get("submit_button")
        size = request.form.get("size_selector")
        if submit_button == "upload_image":
            print("Made it to Upload Image")
            file = request.files["file1"]
            print(file)
            if file and allowed_file(file.filename, ["jpg", "jpeg", "png", "bmp"]):
                print("Made it to allowed_file")
                # Delete Previous Image
                prev_images = glob.glob(app.config["UPLOAD_FOLDER"] + '/*')
                for f in prev_images:
                    os.remove(f)
                # converts png images to svg
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename)))
                resized_filename = file.filename
                subprocess.run(
                        [
                            "convert",
                            (os.path.join(app.config["UPLOAD_FOLDER"], file.filename)),
                            "-gravity",
                            "East",
                            "-extent",
                            "105%x100%",
                            "-threshold",
                            "50%",
                            "-background",
                            "none",
                            "-alpha",
                            "remove",
                            "-negate",
                            (
                                os.path.join(
                                    app.config["UPLOAD_FOLDER"], resized_filename[:-4] + ".svg"
                                )
                                
                            ),
                        ]
                )
                # convert svg to gcode
                subprocess.run([cargo,(os.path.join(app.config["UPLOAD_FOLDER"], resized_filename[:-4]+ ".svg")),  "--settings", setting, "-o",(os.path.join(app.config["GCODE_FOLDER"], "previous.gcode"))]); 
                    # add small gcode to current gcode after it has been uploaded
                with open(logo_filename, 'r') as f:
                    data = f.read()
                    f.close()

                with open(current_Gcode, 'r') as f:
                    old_data = f.read()
                    f.close()

                with open(current_Gcode, 'w') as f:
                    f.write(data)
                    f.write(old_data)
                    f.close()               
                
                flash("Image has been Uploaded and Converted successfully.")
            else:
                flash("Invalid file format. Only JPG and PNG are allowed.")
            # converts PDF to gcode
        elif submit_button == "Upload PDF":
            file = request.files["file2"]
            if file and allowed_file(file.filename, ["pdf"]):
                # remove any previous pdf before uploading new pdf
                prev_images = glob.glob(app.config["TEXT_FOLDER"] + '/*')
                for f in prev_images:
                    os.remove(f)
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config["TEXT_FOLDER"], filename))
                # converts pdf to svg
                subprocess.run(["pdftocairo",(os.path.join(app.config["TEXT_FOLDER"], filename)),"-paperh","900","-paperw","800","-expand","-svg",(os.path.join(app.config["TEXT_FOLDER"], filename[:-4]+ "resized.svg"))])
                # converts svg to gcode
                subprocess.run(["vpype", "read", (os.path.join(app.config["TEXT_FOLDER"], filename[:-4]+ "resized.svg")), "gwrite", "--profile", "my_own_plotter", (os.path.join(app.config["GCODE_FOLDER"], "previous.gcode"))])
                flash("Text file has been Uploaded Successfully.")
            else:
                flash("Invalid file format. Only .pdf files are allowed.")
        return redirect("/")
    return render_template('index.html')


@app.route("/servo_up/")
def servo_up():
    port = '/dev/ttyUSB0'
    baud = 115200
    try:
        for i in tqdm(range(100), desc="connecting to the port: ", leave=True):
            ser = serial.Serial(port, baud)
        flash(f"Connected to {port}")
    except serial.SerialException:
        flash(f"Failed to connect to {port}")
        return redirect('/')
        
    time.sleep(2)
    try:
        for i in tqdm(range(100), desc="servo motor off: ", leave=True):
            ser.write(b'M03 S190;\n'.encode())
        flash("Servo down command sent")
    except Exception as e:
        flash(f"Failed to send servo down command: {e}")
        ser.close()
        return redirect('/')
    while ser.in_waiting == 0:
        pass
    response = ser.readline()
    flash(f"Servo up response: {response}")
    ser.close() 
    return redirect('/')

@app.route("/servo_down/")
def servo_down():
    port = '/dev/ttyUSB0'
    baud = 115200
    try:
        for i in tqdm(range(100), desc="connecting to the port: ", leave=True):
            ser = serial.Serial(port, baud)
        flash(f"Connected to {port}")
    except serial.SerialException:
        flash(f"Failed to connect to {port}")
        return redirect('/')
    time.sleep(2)
    try:
        for i in tqdm(range(100), desc="servo motor on: ", leave=True):
            ser.write(('M03 S150;\n').encode())
        flash("Servo up command sent")
    except Exception as e:
        flash(f"Failed to send servo up command: {e}")
        ser.close()
        return redirect('/')
    while ser.in_waiting == 0:
        pass
    response = ser.readline()
    flash(f"Servo up response: {response}")
    ser.close()
    return redirect("/")

@app.route("/Print/")
def Print():
    port = '/dev/ttyUSB0'
    baud = 115200
    firmware_file = '/home/penplotter/Pen_plotter_V2/my_flask/UI_Buttons_Bash/firmware_onlykeys.txt'
    
    try:
        for i in tqdm(range(100), desc="connecting to the port: ", leave=True):
            ser = serial.Serial(port, baud)
        flash(f"Connected to {port}")
    except serial.SerialException:
        flash(f"Failed to connect to {port}")
        return redirect('/')
    time.sleep(2)
    try:
        for i in tqdm(range(100), desc="uploading firmware: " , leave=True):
            with open(firmware_file, 'r') as f:
                for line in f:
                    line = line.split(";")[0]
                    ser.write((line + '\n').encode())
                    while ser.in_waiting == 0:
                        pass
        flash("firmware uploaded")
    except FileNotFoundError:
        flash(f"File {firmware_file} not uploaded")
    filename = os.path.join(app.config["GCODE_FOLDER"], "previous.gcode")
    try:
        for i in tqdm(range(100), desc="uploading gcode: ", leave=True):
            with open(filename, 'r') as f:
                for line in f:
                    line = line.split(';')[0]
                    ser.write((line + '\n').encode())
                    while ser.in_waiting == 0:
                        pass
        flash("Gcode Uploaded")
    except FileNotFoundError:
        flash(f"File {filename} not found")
        ser.close()
        return redirect('/')
    except:
        flash("Failed to upload G-code file")
        ser.close()
        return redirect('/')
    ser.close()
    return redirect("/")


@app.route("/homing/")
def homing():
    port = '/dev/ttyUSB0'
    baud = 115200
    try:
        for i in tqdm(range(100), desc="connecting to the port : ", leave=True):
            ser = serial.Serial(port, baud)
        flash(f"Connected to {port}")
    except serial.SerialException:
        flash(f"Failed to connect to {port}")
        return redirect('/')
    time.sleep(2)
    try:
        for i in tqdm(range(100), desc="homing the plotter: ", leave=True):
            ser.write(('$H\n').encode())
        flash("Homing command sent")
    except Exception as e:
        flash(f"Failed to send homing command: {e}")
        ser.close()
        exit()
    while ser.in_waiting == 0:
        pass
    response = ser.readline()
    flash(f"Homing response: {response}")
    ser.close()
    return redirect("/")


@app.route("/reset_alarm/")  # press this button if the plotter stops
def reset_alarm():
    port = '/dev/ttyUSB0'
    baud = 115200
    try:
        for i in tqdm(range(100), desc="connecting to the port: ", leave=True):
            ser = serial.Serial(port, baud)
        flash(f"Connected to {port}")
    except serial.SerialException:
        flash(f"Failed to connect to {port}")
        return redirect('/')
    time.sleep(2)
    try:
        for i in tqdm(range(100), desc="reseting alarm: ", leave=True):
            ser.write(('$X\n').encode())
        flash("Alarm reset command sent")
    except Exception as e:
        flash(f"Failed to send alarm reset command: {e}")
        ser.close()
        exit()
    while ser.in_waiting == 0:
        pass
    response = ser.readline()
    flash(f"Alarm reset response: {response}")
    ser.close()
    return redirect("/")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
