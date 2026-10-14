
# ICSI 418Y - Programming Assignment 3

## Projects and Project Memberships

This application extends Programming Assignment 2 by adding project management functionality using React, Express, Node.js, and MongoDB.

## Features

- User Signup and Login
- Create software projects
- Select registered users as project leads
- Set project status: Planning, Active, or Completed
- View existing projects
- Add registered users to projects
- Remove non-lead project members
- Prevent duplicate project memberships
- Prevent removal of project leads
- Support users belonging to multiple projects
- Display success and error messages

## Technologies

- React and Vite
- Node.js
- Express
- MongoDB Atlas
- Mongoose
- CSS

## Database Collections

1. Users
2. Projects
3. ProjectMemberships

ProjectMemberships stores ObjectId references to users and projects.

## How to Run

### Backend

Open a terminal:

```bash
cd server
npm install
```

Create a `server/.env` file containing:

```text
MONGO_URI=your_mongodb_connection_string
```

Start the backend:

```bash
node index.js
```

The server runs at http://localhost:5000.

### Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite, normally http://localhost:5173.

## How to Use

1. Register users using Signup.
2. Test Login using a registered account.
3. Create a project and select a registered project lead.
4. View the project list.
5. Select a project to view its members.
6. Add users to the project.
7. Add the same user to another project.
8. Attempt to add a duplicate member to view the error.
9. Remove a non-lead member.
10. Verify the collections in MongoDB Atlas.

## Author

Mustafa Fayaz
