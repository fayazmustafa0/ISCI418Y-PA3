import { useState } from "react";
import "./App.css";

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

  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signup),
      });

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage("Server error.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(login),
      });

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage("Server error.");
    }
  };

  return (
    <div className="container">
      <h1>Login and Signup</h1>

      <div className="forms">
        <form onSubmit={handleSignup}>
          <h2>Signup</h2>

          <input
            type="text"
            placeholder="First Name"
            value={signup.f_name}
            onChange={(e) =>
              setSignup({ ...signup, f_name: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Last Name"
            value={signup.l_name}
            onChange={(e) =>
              setSignup({ ...signup, l_name: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Username"
            value={signup.username}
            onChange={(e) =>
              setSignup({ ...signup, username: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={signup.password}
            onChange={(e) =>
              setSignup({ ...signup, password: e.target.value })
            }
          />

          <button type="submit">Signup</button>
        </form>

        <form onSubmit={handleLogin}>
          <h2>Login</h2>

          <input
            type="text"
            placeholder="Username"
            value={login.username}
            onChange={(e) =>
              setLogin({ ...login, username: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={login.password}
            onChange={(e) =>
              setLogin({ ...login, password: e.target.value })
            }
          />

          <button type="submit">Login</button>
        </form>
      </div>

      <p>{message}</p>
    </div>
  );
}

export default App;