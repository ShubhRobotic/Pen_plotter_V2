import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

motor_PWM = 18
sensor1 = 14
motor_Direction = 15
GPIO.setup(motor_PWM,GPIO.OUT)
GPIO.setup(sensor1,GPIO.IN)
GPIO.setup(motor_Direction,GPIO.OUT)
motor = GPIO.PWM(motor_PWM,100)
motor.start(0)


while True:
    sensor = GPIO.input(sensor1)
    GPIO.output(motor_Direction,GPIO.LOW)
    motor.ChangeDutyCycle(100)
    # time.sleep(1.5)
    if sensor == 1:
        GPIO.output(motor_Direction,GPIO.LOW)
        motor.ChangeDutyCycle(100)
        print(sensor)
    else:
        time.sleep(1)
        GPIO.output(motor_Direction,GPIO.LOW)
        motor.ChangeDutyCycle(0)
        time.sleep(0.1)
        print(sensor)
        break
