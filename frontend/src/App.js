import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import "./App.css"

function ProjectListPage({ projects, deleteProject }) {
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const navigate = useNavigate();

  const handleCheckboxChange = (projectId) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    } else {
      setSelectedProjects([...selectedProjects, projectId]);
    }
  };

  // Удаление выбранных проектов
  const handleDeleteSelected = () => {
    if (selectedProjects.length > 0) {
      setShowDeleteConfirmation(true);
    }
  };

  // Подтверждение удаления
  const confirmDelete = () => {
    selectedProjects.forEach(id => deleteProject(id));
    setSelectedProjects([]);
    setShowDeleteConfirmation(false);
  };

  return (
    <div>
      <h1>Список проектов</h1>
      <Link to="/create">
        <button className="create-button">Создать проект</button>
      </Link>
      <button onClick={handleDeleteSelected} disabled={selectedProjects.length === 0}>
        Удалить выбранные
      </button>

      <ul>
          {projects.map((project) => (
            <li key={project.id} style={{ display: "flex" }}
            className="container">
              <input className="checkbox"
                type="checkbox"
                checked={selectedProjects.includes(project.id)}
                onChange={() => handleCheckboxChange(project.id)}
              />
              <p className="project-naming">
                <Link  to={`/edit/${project.id}`} style={{ flexGrow: 1 } }>
                  {project.title}
                </Link>
              </p>
              <p className="project-description">{project.description}</p>
              {project.image_url && (
                <img className="project-image" src={`http://127.0.0.1:5000/${project.image_url}`} alt={project.title} />
              )}
            </li>
          ))}
      </ul>

      {/* Модальное окно подтверждения удаления */}
      {showDeleteConfirmation && (
        <div className="modal">
          <div className="modal-content">
            <p>Вы уверены, что хотите удалить выбранные проекты?</p>
            <button onClick={confirmDelete}>Да</button>
            <button onClick={() => setShowDeleteConfirmation(false)}>Нет</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Создание проекта
function CreateProjectPage({ createProject }) {
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectImage, setNewProjectImage] = useState(null);
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!newProjectTitle.trim()) {
      alert("Название проекта не может быть пустым!");
      return;
    }
    createProject(newProjectTitle, newProjectDescription, newProjectImage);
    navigate("/");
  };

  return (
    <div>
      <h1>Создание проекта</h1>
      <input
        type="text"
        value={newProjectTitle}
        onChange={(e) => setNewProjectTitle(e.target.value)}
        placeholder="Название проекта"
      />
      <textarea
        value={newProjectDescription}
        onChange={(e) => setNewProjectDescription(e.target.value)}
        placeholder="Описание проекта"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setNewProjectImage(e.target.files[0])}
      />
      <button className="save-button" onClick={handleCreate}>Сохранить</button>
      <Link to="/">
        <button>Вернуться</button>
      </Link>
    </div>
  );
}

// Редактирование проекта
function EditProjectPage({ projects, updateProject }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === parseInt(id));

  const [title, setTitle] = useState(project ? project.title : "");
  const [description, setDescription] = useState(project ? project.description : "");
  const [image, setImage] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      alert("Название проекта не может быть пустым!");
      return;
    }
    const updatedProject = {
      ...project,
      title,
      description,
      image: deleteImage ? null : image,
      deleteImage,
    };
    updateProject(updatedProject);
    navigate("/");
  };

  if (!project) {
    return <div>Проект не найден</div>;
  }

  return (
    <div>
      <h1>Редактирование проекта</h1>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название проекта"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Описание проекта"
      />
      {project.image_url && (
        <div>
          <img className="change-img" src={`http://127.0.0.1:5000/${project.image_url}`} alt={project.title} />
          <label>
            <input
              type="checkbox"
              checked={deleteImage}
              onChange={(e) => setDeleteImage(e.target.checked)}
            />
            Удалить фотографию
          </label>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />
      <button className="save-button" onClick={handleSave}>Сохранить</button>
      <Link to="/">
        <button>Вернуться</button>
      </Link>
    </div>
  );
}

function App() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/projects")
      .then((response) => setProjects(response.data))
      .catch((error) => console.error("Ошибка при загрузке проектов:", error));
  }, []);

  const createProject = (title, description, image) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (image) {
      formData.append("image", image);
    }

    axios.post("http://127.0.0.1:5000/projects", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(() => axios.get("http://127.0.0.1:5000/projects"))
    .then((response) => setProjects(response.data))
    .catch((error) => console.error("Ошибка при создании проекта:", error));
  };

  const deleteProject = (id) => {
    axios.delete(`http://127.0.0.1:5000/projects/${id}`)
      .then(() => axios.get("http://127.0.0.1:5000/projects"))
      .then((response) => setProjects(response.data))
      .catch((error) => console.error("Ошибка при удалении проекта:", error));
  };

  const updateProject = (updatedProject) => {
    const formData = new FormData();
    formData.append("title", updatedProject.title);
    formData.append("description", updatedProject.description);
    if (updatedProject.image) {
      formData.append("image", updatedProject.image);
    }
    if (updatedProject.deleteImage) {
      formData.append("deleteImage", "true");
    }

    axios.put(`http://127.0.0.1:5000/projects/${updatedProject.id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(() => axios.get("http://127.0.0.1:5000/projects"))
    .then((response) => setProjects(response.data))
    .catch((error) => console.error("Ошибка при обновлении проекта:", error));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProjectListPage projects={projects} deleteProject={deleteProject} />} />
        <Route path="/create" element={<CreateProjectPage createProject={createProject} />} />
        <Route path="/edit/:id" element={<EditProjectPage projects={projects} updateProject={updateProject} />} />
      </Routes>
    </Router>
  );
}

export default App;