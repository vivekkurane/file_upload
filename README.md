MEAN-style document upload demo

This is a minimal MEAN-style (MongoDB, Express, AngularJS, Node) project that demonstrates:
- Uploading files (via drag & drop or click)
- Storing files in MongoDB (as binary Buffer via Mongoose)
- Listing uploaded documents and downloading them

Files added:
- `server.js` - Express backend with APIs
- `package.json` - dependencies and start script
- `public/index.html` - AngularJS frontend (Home and Upload tabs)
- `public/app.js` - frontend controller and upload logic

Setup
1. Install dependencies:

```powershell
npm install
```

2. Ensure `MONGO_URI` environment variable is set, or edit `server.js` to include your connection string.

3. Start the server:

```powershell
npm start
```

4. Open `http://localhost:3000` in the browser.

Notes
- This project uses AngularJS (1.x) for simplicity so you can run it without the Angular CLI. If you prefer a modern Angular (2+) frontend, I can scaffold that instead.
- Files are stored in MongoDB. For production, consider using an object store (S3) and storing URLs in the DB.

Deployment
 use Render.com


 # live URL
 https://file-upload-app-wqlg.onrender.com/