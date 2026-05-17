# Deployment Guide for SkillLink

This guide provides instructions on how to deploy the three components of SkillLink: the React frontend, the Node.js backend, and the Python FastAPI recommendation service.

## 1. MongoDB Atlas Setup
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster and set up a database user and IP access list (allow all `0.0.0.0/0` for deployment).
3. Get the connection string and replace `<username>` and `<password>` in your `.env` file.

## 2. Cloudinary Setup
1. Log in to [Cloudinary](https://cloudinary.com/).
2. From the dashboard, copy your `Cloud Name`, `API Key`, and `API Secret`.
3. Add these to your backend `.env` file.

## 3. Google OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and configure the OAuth consent screen.
3. Create OAuth client ID credentials (Web application).
4. Add your frontend deployment URL to the "Authorized JavaScript origins".
5. Copy the Client ID and add it to both the backend `.env` and frontend `.env`.

---

## Deploying the Backend (Render / Heroku)
We recommend deploying the Node.js backend to [Render](https://render.com/).
1. Push your monorepo to GitHub.
2. In Render, create a new **Web Service** and connect your repository.
3. Set the **Root Directory** to `server`.
4. Set the **Build Command** to `npm install && npm run build`.
5. Set the **Start Command** to `npm start`.
6. Add all the Environment Variables from your local `server/.env` file.

## Deploying the AI Recommendation Service (Render)
1. In Render, create another **Web Service** connected to your repository.
2. Set the **Root Directory** to `recommendation-service`.
3. Set the **Build Command** to `pip install -r requirements.txt`.
4. Set the **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`.

## Deploying the Frontend (Vercel)
We recommend deploying the React frontend to [Vercel](https://vercel.com/).
1. In Vercel, click "Add New Project" and import your GitHub repository.
2. Set the **Root Directory** to `client`.
3. The framework preset should automatically detect **Vite**.
4. Set any required environment variables (e.g., `VITE_API_URL` pointing to your deployed backend, and `VITE_GOOGLE_CLIENT_ID`).
5. Click **Deploy**.
