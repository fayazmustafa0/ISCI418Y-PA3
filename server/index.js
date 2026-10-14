
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

// USER MODEL (PA2)
const userSchema = new mongoose.Schema({
  f_name: { type: String, required: true },
  l_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// PROJECT MODEL (PA3)
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["Planning", "Active", "Completed"],
    required: true,
  },
  project_lead_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Project = mongoose.model("Project", projectSchema);

// PROJECT MEMBERSHIP MODEL (PA3)
const membershipSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Prevent duplicate memberships
membershipSchema.index(
  { project_id: 1, user_id: 1 },
  { unique: true }
);

const ProjectMembership = mongoose.model(
  "ProjectMembership",
  membershipSchema
);

// Helper functions
const validId = (id) => mongoose.isValidObjectId(id);

const serverError = (res, err) => {
  console.error(err);
  return res.status(500).json({
    message: "Server or database error.",
  });
};

// HOME
app.get("/", (req, res) => {
  res.send("Server is working");
});

// SIGNUP (PA2)
app.post("/signup", async (req, res) => {
  try {
    const { f_name, l_name, username, password } = req.body;

    if (!f_name || !l_name || !username || !password) {
      return res.status(400).json({
        message: "All signup fields are required.",
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists.",
      });
    }

    const newUser = new User({
      f_name,
      l_name,
      username,
      password,
    });

    await newUser.save();

    return res.status(201).json({
      message: "User created successfully.",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Username already exists.",
      });
    }
    return serverError(res, err);
  }
});

// LOGIN (PA2)
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required.",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        message: "Username does not exist.",
      });
    }

    if (user.password !== password) {
      return res.status(400).json({
        message: "Incorrect password.",
      });
    }

    return res.json({
      message: "Login successful.",
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET REGISTERED USERS
app.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("_id f_name l_name username")
      .sort({ username: 1 });

    return res.json(users);
  } catch (err) {
    return serverError(res, err);
  }
});

// CREATE PROJECT
app.post("/projects", async (req, res) => {
  try {
    const { name, description, status, project_lead_id } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !["Planning", "Active", "Completed"].includes(status) ||
      !project_lead_id
    ) {
      return res.status(400).json({
        message: "All valid project fields are required.",
      });
    }

    if (!validId(project_lead_id)) {
      return res.status(400).json({
        message: "Invalid Project Lead ID.",
      });
    }

    const lead = await User.findById(project_lead_id);

    if (!lead) {
      return res.status(404).json({
        message: "Selected Project Lead does not exist.",
      });
    }

    const project = new Project({
      name: name.trim(),
      description: description.trim(),
      status,
      project_lead_id: lead._id,
    });

    await project.save();

    // Automatically add project lead as a member.
    try {
      await ProjectMembership.create({
        project_id: project._id,
        user_id: lead._id,
      });
    } catch (err) {
      // Roll back project creation if lead membership fails.
      await Project.deleteOne({ _id: project._id });
      throw err;
    }

    await project.populate(
      "project_lead_id",
      "f_name l_name username"
    );

    return res.status(201).json({
      message: "Project created successfully.",
      project,
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// VIEW ALL PROJECTS
app.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("project_lead_id", "f_name l_name username")
      .sort({ _id: -1 });

    return res.json(projects);
  } catch (err) {
    return serverError(res, err);
  }
});

// VIEW MEMBERS OF ONE PROJECT
app.get("/projects/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!validId(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project does not exist.",
      });
    }

    const members = await ProjectMembership.find({
      project_id: projectId,
    }).populate("user_id", "f_name l_name username");

    return res.json(members);
  } catch (err) {
    return serverError(res, err);
  }
});

// ADD PROJECT MEMBER
app.post("/projects/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { user_id } = req.body;

    if (!validId(projectId) || !validId(user_id)) {
      return res.status(400).json({
        message: "Invalid project or user ID.",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project does not exist.",
      });
    }

    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({
        message: "User does not exist.",
      });
    }

    const existing = await ProjectMembership.findOne({
      project_id: projectId,
      user_id,
    });

    if (existing) {
      return res.status(409).json({
        message: "User is already a member of this project.",
      });
    }

    await ProjectMembership.create({
      project_id: projectId,
      user_id,
    });

    return res.status(201).json({
      message: "Member added successfully.",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "User is already a member of this project.",
      });
    }

    return serverError(res, err);
  }
});

// REMOVE PROJECT MEMBER
app.delete(
  "/projects/:projectId/members/:userId",
  async (req, res) => {
    try {
      const { projectId, userId } = req.params;

      if (!validId(projectId) || !validId(userId)) {
        return res.status(400).json({
          message: "Invalid project or user ID.",
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project does not exist.",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User does not exist.",
        });
      }

      if (String(project.project_lead_id) === String(userId)) {
        return res.status(403).json({
          message: "Project Lead cannot be removed.",
        });
      }

      const removed = await ProjectMembership.findOneAndDelete({
        project_id: projectId,
        user_id: userId,
      });

      if (!removed) {
        return res.status(404).json({
          message: "User is not a member of this project.",
        });
      }

      return res.json({
        message: "Member removed successfully.",
      });
    } catch (err) {
      return serverError(res, err);
    }
  }
);

// START SERVER
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
