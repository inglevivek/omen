from flask import Flask, request
from sqlalchemy import Column, Integer, String
import os

app = Flask(__name__)

class UserModel:
    """SQLAlchemy User model"""
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(200))

    def get_display_name(self):
        return self.name

@app.route('/api/users', methods=['GET'])
def list_users():
    """Returns all users"""
    return []

@app.route('/api/users', methods=['POST'])
def create_user():
    """Creates a new user"""
    return {}, 201

async def background_job(task_id: str):
    pass
