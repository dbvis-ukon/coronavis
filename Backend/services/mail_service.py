from threading import Thread

from flask import render_template
from flask_mail import Message
from werkzeug.exceptions import InternalServerError


# https://github.com/paurakhsharma/flask-rest-api-blog-series/blob/master/Part%20-%206/movie-bag/services/mail_service.py

def send_async_email(app2, msg):
    from server import mail
    with app2.app_context():
        try:
            mail.send(msg)
        except ConnectionRefusedError:
            raise InternalServerError("[MAIL SERVER] not working")


def send_email(subject, sender, recipients, template, **kwargs):
    from server import app
    msg = Message(subject, sender=sender, recipients=recipients)
    msg.body = render_template(template + '.txt', **kwargs)
    msg.html = render_template(template + '.html', **kwargs)
    return Thread(target=send_async_email, args=(app, msg)).start()
