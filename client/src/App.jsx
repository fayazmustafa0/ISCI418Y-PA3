
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


  // PA4 backlog state
  const emptyStory = {title:"",description:"",priority:"Medium",status:"To Do",assigned_user_id:""};
  const [stories,setStories] = useState([]);
  const [storyForm,setStoryForm] = useState(emptyStory);
  const [editingStory,setEditingStory] = useState(null);
  const [openStory,setOpenStory] = useState(null);
  const [storyLoading,setStoryLoading] = useState(false);
  useEffect(() => {
    setStories([]); setStoryForm(emptyStory); setEditingStory(null); setOpenStory(null);
    if (!selectedProject) return;
    let active=true;
    request(`/projects/${selectedProject}/stories`).then(data=>{if(active)setStories(data);}).catch(e=>{if(active)setMessage(e.message);});
    return ()=>{active=false;};
  },[selectedProject]);
  async function refreshStories(){
    if(selectedProject) setStories(await request(`/projects/${selectedProject}/stories`));
  }
  async function saveStory(e){
    e.preventDefault();setStoryLoading(true);
    try {
      const path=`/projects/${selectedProject}/stories${editingStory?`/${editingStory}`:""}`;
      await request(path,{method:editingStory?"PUT":"POST",body:JSON.stringify(storyForm)});
      await refreshStories();setStoryForm(emptyStory);setEditingStory(null);
      setMessage(editingStory?"Story updated.":"Story created.");
    }catch(e){setMessage(e.message);}finally{setStoryLoading(false);}
  }
  function startEdit(s){
    setEditingStory(s._id);setOpenStory(null);
    setStoryForm({title:s.title,description:s.description,priority:s.priority,status:s.status,assigned_user_id:s.assigned_user_id?._id||""});
  }
  async function deleteStory(s){
    if(!window.confirm(`Delete story "${s.title}"?`))return;
    setStoryLoading(true);
    try{
      await request(`/projects/${selectedProject}/stories/${s._id}`,{method:"DELETE"});
      if(editingStory===s._id){setEditingStory(null);setStoryForm(emptyStory);}
      setOpenStory(null);await refreshStories();setMessage("Story deleted.");
    }catch(e){setMessage(e.message);}finally{setStoryLoading(false);}
  }

  const activeProject = projects.find(
    (p) => p._id === selectedProject
  );

  return (
    <div className="container">
      <h1>Software Project Management</h1>
      <p className="subtitle">
        ICSI 418Y - Programming Assignment 4
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

      <section>
        <h2>5. Project Backlog (PA4)</h2>
        {!selectedProject ? <p>Select a project above to view its backlog.</p> : <>
          <h3>{activeProject?.name} - User Stories</h3>
          <form className="wide-form" onSubmit={saveStory}>
            <h3>{editingStory?"Edit User Story":"Create User Story"}</h3>
            <label>Title</label>
            <input required value={storyForm.title} onChange={e=>setStoryForm({...storyForm,title:e.target.value})} />
            <label>Description</label>
            <textarea required placeholder="As a user, I want ..., so that ..." value={storyForm.description} onChange={e=>setStoryForm({...storyForm,description:e.target.value})}/>
            <label>Priority</label>
            <select value={storyForm.priority} onChange={e=>setStoryForm({...storyForm,priority:e.target.value})}>
              {["High","Medium","Low"].map(x=><option key={x}>{x}</option>)}
            </select>
            {editingStory && <><label>Status</label><select value={storyForm.status} onChange={e=>setStoryForm({...storyForm,status:e.target.value})}>
              {["To Do","In Progress","Done"].map(x=><option key={x}>{x}</option>)}
            </select></>}
            <label>Assigned Member</label>
            <select value={storyForm.assigned_user_id} onChange={e=>setStoryForm({...storyForm,assigned_user_id:e.target.value})}>
              <option value="">Unassigned</option>
              {members.filter(m=>m.user_id).map(m=><option key={m.user_id._id} value={m.user_id._id}>{displayName(m.user_id)} (@{m.user_id.username})</option>)}
            </select>
            <button disabled={storyLoading}>{editingStory?"Save Changes":"Create Story"}</button>
            {editingStory && <button type="button" onClick={()=>{setEditingStory(null);setStoryForm(emptyStory);}}>Cancel</button>}
          </form>
          <h3>Stories</h3>
          {stories.length===0?<p>No user stories for this project yet.</p>:<div className="project-list">
            {stories.map(s=><div className="project-card" key={s._id}>
              <h3>{s.title}</h3>
              <p><strong>Priority:</strong> {s.priority}</p>
              <p><strong>Status:</strong> {s.status}</p>
              <p><strong>Assigned:</strong> {s.assigned_user_id?displayName(s.assigned_user_id):"Unassigned"}</p>
              <button type="button" onClick={()=>setOpenStory(openStory===s._id?null:s._id)}>{openStory===s._id?"Hide Details":"Details"}</button>
              {openStory===s._id&&<p>{s.description}</p>}
              <button type="button" onClick={()=>startEdit(s)}>Edit</button>
              <button type="button" className="remove-button" onClick={()=>deleteStory(s)} disabled={storyLoading}>Delete</button>
            </div>)}
          </div>}
        </>}
      </section>
    </div>
  );
}

export default App;
