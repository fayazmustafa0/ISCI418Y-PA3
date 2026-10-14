
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [signup, setSignup] = useState({
    f_name: "",
    l_name: "",
    username: "",
    password: "",
  });

  const [login, setLogin] = useState({
    username: "",
    password: "",
  });

  const [project, setProject] = useState({
    name: "",
    description: "",
    status: "Planning",
    project_lead_id: "",
  });

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const displayName = (user) => {
    if (!user) return "Unknown User";
    return `${user.f_name || ""} ${user.l_name || ""}`.trim() ||
      user.username;
  };

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  const loadUsers = async () => {
    try {
      const data = await request("/users");
      setUsers(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await request("/projects");
      setProjects(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadMembers = async (projectId) => {
    if (!projectId) {
      setMembers([]);
      return;
    }

    try {
      const data = await request(`/projects/${projectId}/members`);
      setMembers(data);
    } catch (error) {
      setMembers([]);
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadUsers();
    loadProjects();
  }, []);

  useEffect(() => {
    loadMembers(selectedProject);
  }, [selectedProject]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await request("/signup", {
        method: "POST",
        body: JSON.stringify(signup),
      });

      setMessage(data.message);
      setSignup({
        f_name: "",
        l_name: "",
        username: "",
        password: "",
      });

      await loadUsers();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await request("/login", {
        method: "POST",
        body: JSON.stringify(login),
      });

      setMessage(data.message);
      setLogin({ username: "", password: "" });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await request("/projects", {
        method: "POST",
        body: JSON.stringify(project),
      });

      setMessage(data.message);
      setProject({
        name: "",
        description: "",
        status: "Planning",
        project_lead_id: "",
      });

      await loadProjects();

      if (selectedProject) {
        await loadMembers(selectedProject);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!selectedProject || !selectedUser) {
      setMessage("Select a project and a user.");
      return;
    }

    setLoading(true);

    try {
      const data = await request(
        `/projects/${selectedProject}/members`,
        {
          method: "POST",
          body: JSON.stringify({ user_id: selectedUser }),
        }
      );

      setMessage(data.message);
      setSelectedUser("");
      await loadMembers(selectedProject);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setLoading(true);

    try {
      const data = await request(
        `/projects/${selectedProject}/members/${userId}`,
        { method: "DELETE" }
      );

      setMessage(data.message);
      await loadMembers(selectedProject);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const activeProject = projects.find(
    (p) => p._id === selectedProject
  );

  return (
    <div className="container">
      <h1>Software Project Management</h1>
      <p className="subtitle">
        ICSI 418Y - Programming Assignment 3
      </p>

      {message && (
        <div className="message" role="status">
          {message}
        </div>
      )}

      <section>
        <h2>1. User Accounts</h2>

        <div className="forms">
          <form onSubmit={handleSignup}>
            <h3>Signup</h3>

            <input
              placeholder="First Name"
              value={signup.f_name}
              onChange={(e) =>
                setSignup({ ...signup, f_name: e.target.value })
              }
              required
            />

            <input
              placeholder="Last Name"
              value={signup.l_name}
              onChange={(e) =>
                setSignup({ ...signup, l_name: e.target.value })
              }
              required
            />

            <input
              placeholder="Username"
              value={signup.username}
              onChange={(e) =>
                setSignup({ ...signup, username: e.target.value })
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={signup.password}
              onChange={(e) =>
                setSignup({ ...signup, password: e.target.value })
              }
              required
            />

            <button disabled={loading}>Signup</button>
          </form>

          <form onSubmit={handleLogin}>
            <h3>Login</h3>

            <input
              placeholder="Username"
              value={login.username}
              onChange={(e) =>
                setLogin({ ...login, username: e.target.value })
              }
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={login.password}
              onChange={(e) =>
                setLogin({ ...login, password: e.target.value })
              }
              required
            />

            <button disabled={loading}>Login</button>
          </form>
        </div>
      </section>

      <section>
        <h2>2. Create Project</h2>

        <form className="wide-form" onSubmit={handleCreateProject}>
          <label>Project Name</label>
          <input
            placeholder="Enter project name"
            value={project.name}
            onChange={(e) =>
              setProject({ ...project, name: e.target.value })
            }
            required
          />

          <label>Description</label>
          <textarea
            placeholder="Enter project description"
            value={project.description}
            onChange={(e) =>
              setProject({ ...project, description: e.target.value })
            }
            required
          />

          <label>Status</label>
          <select
            value={project.status}
            onChange={(e) =>
              setProject({ ...project, status: e.target.value })
            }
          >
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>

          <label>Project Lead</label>
          <select
            value={project.project_lead_id}
            onChange={(e) =>
              setProject({
                ...project,
                project_lead_id: e.target.value,
              })
            }
            required
          >
            <option value="">Select a registered user</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {displayName(user)} (@{user.username})
              </option>
            ))}
          </select>

          <button disabled={loading}>Create Project</button>
        </form>
      </section>

      <section>
        <h2>3. View Projects</h2>

        <button
          className="refresh-button"
          onClick={loadProjects}
          type="button"
        >
          Refresh Projects
        </button>

        {projects.length === 0 ? (
          <p>No projects have been created yet.</p>
        ) : (
          <div className="project-list">
            {projects.map((p) => (
              <div className="project-card" key={p._id}>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <p><strong>Status:</strong> {p.status}</p>
                <p>
                  <strong>Project Lead:</strong>{" "}
                  {displayName(p.project_lead_id)}
                  {p.project_lead_id?.username &&
                    ` (@${p.project_lead_id.username})`}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject(p._id);
                    setSelectedUser("");
                    setMessage("");
                  }}
                >
                  Manage Members
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>4. Manage Project Memberships</h2>

        <div className="membership-panel">
          <label>Select Project</label>
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setSelectedUser("");
              setMembers([]);
              setMessage("");
            }}
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {activeProject && (
            <>
              <h3>Members of {activeProject.name}</h3>

              {members.length === 0 ? (
                <p>No members found.</p>
              ) : (
                <div className="member-list">
                  {members.map((membership) => {
                    const user = membership.user_id;
                    if (!user) return null;

                    const isLead =
                      String(user._id) ===
                      String(activeProject.project_lead_id?._id);

                    return (
                      <div
                        className="member-row"
                        key={membership._id}
                      >
                        <span>
                          {displayName(user)} (@{user.username})
                          {isLead && <strong> - Project Lead</strong>}
                        </span>

                        {!isLead && (
                          <button
                            className="remove-button"
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              handleRemoveMember(user._id)
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <form
                className="add-member-form"
                onSubmit={handleAddMember}
              >
                <h3>Add a Member</h3>

                <select
                  value={selectedUser}
                  onChange={(e) =>
                    setSelectedUser(e.target.value)
                  }
                  required
                >
                  <option value="">Select a registered user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {displayName(user)} (@{user.username})
                    </option>
                  ))}
                </select>

                <button disabled={loading}>Add Member</button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
