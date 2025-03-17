from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "static/uploads"
DATABASE = "projects.db"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Создание таблицы, если её нет
def init_db():
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                image_url TEXT
            )
        """)

# Загрузка всех проектов
def get_projects():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects")
        projects = cursor.fetchall()
        return [{"id": p[0], "title": p[1], "description": p[2], "image_url": p[3]} for p in projects]

# Добавление нового проекта
def create_project(title, description, image_url):
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO projects (title, description, image_url) VALUES (?, ?, ?)",
            (title, description, image_url)
        )
        project_id = cursor.lastrowid
        return {"id": project_id, "title": title, "description": description, "image_url": image_url}

# Обновление проекта
def update_project(project_id, title, description, image_url):
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE projects SET title = ?, description = ?, image_url = ? WHERE id = ?",
            (title, description, image_url, project_id)
        )
        return {"id": project_id, "title": title, "description": description, "image_url": image_url}

# Удаление проекта
def delete_project(project_id):
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))

# Инициализация базы данных
init_db()

@app.route("/projects", methods=["GET"])
def get_projects_route():
    return jsonify(get_projects())

@app.route("/projects", methods=["POST"])
def create_project_route():
    title = request.form.get("title")
    description = request.form.get("description")
    image = request.files.get("image")

    image_url = None
    if image:
        image_filename = f"{len(get_projects()) + 1}_{image.filename}"
        image.save(os.path.join(UPLOAD_FOLDER, image_filename))
        image_url = f"static/uploads/{image_filename}"

    project = create_project(title, description, image_url)
    return jsonify(project), 201

@app.route("/projects/<int:project_id>", methods=["PUT"])
def update_project_route(project_id):
    title = request.form.get("title")
    description = request.form.get("description")
    image = request.files.get("image")
    delete_image = request.form.get("deleteImage") == "true"

    projects = get_projects()
    project = next((p for p in projects if p["id"] == project_id), None)
    if not project:
        return jsonify({"error": "Проект не найден"}), 404

    if delete_image and project.get("image_url"):
        try:
            os.remove(project["image_url"])
        except FileNotFoundError:
            pass
        image_url = None
    else:
        image_url = project["image_url"]

    if image:
        if project.get("image_url"):
            try:
                os.remove(project["image_url"])
            except FileNotFoundError:
                pass

        image_filename = f"{project_id}_{image.filename}"
        image.save(os.path.join(UPLOAD_FOLDER, image_filename))
        image_url = f"static/uploads/{image_filename}"

    updated_project = update_project(project_id, title, description, image_url)
    return jsonify(updated_project), 200

@app.route("/projects/<int:project_id>", methods=["DELETE"])
def delete_project_route(project_id):
    projects = get_projects()
    project = next((p for p in projects if p["id"] == project_id), None)
    if project:
        if project.get("image_url"):
            try:
                os.remove(project["image_url"])
            except FileNotFoundError:
                pass
        delete_project(project_id)
        return jsonify({"message": "Проект удалён"}), 200
    return jsonify({"error": "Проект не найден"}), 404

@app.route("/static/uploads/<path:filename>")
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    app.run(debug=True)