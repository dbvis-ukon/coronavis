import os
from threading import Thread

from flask import render_template
from flask_mail import Message
from werkzeug.exceptions import InternalServerError

from server import app
from server import mail


# https://github.com/paurakhsharma/flask-rest-api-blog-series/blob/master/Part%20-%206/movie-bag/services/mail_service.py

def send_async_email(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
        except ConnectionRefusedError:
            raise InternalServerError("[MAIL SERVER] not working")


def send_email(subject, sender, recipients, template, **kwargs):
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = render_template(template + '.txt', **kwargs)
    msg.html = render_template(template + '.html', **kwargs)
    return Thread(target=send_async_email, args=(app, msg)).start()
