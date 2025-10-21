# Setting up local environment
- Clone github repository
- Access root directory
- Access backend directory
- Create two environment files
    1. .env
        - PORT=5000
        - MONGODB_URI='mongodb+srv://[your name]_db_user:purple_nurPle33a@mernproj33.dxo9msw.mongodb.net/?retryWrites=true&w=majority&appName=MERNProj33'
        - VITE_ENVIRONMENT=development
        - VITE_DOMAIN=localhost
        - ACCESS_TOKEN_SECRET=[insert random string of your choice]
    2. .env.production
        - VITE_ENVIRONMENT=production
        - VITE_DOMAIN=vasupradha.xyz
- npm install
- Access frontend directory
- npm install

# Running locally
1. Open two terminals
2. Access backend in one terminal, frontend in the other
3. In backend, npm start 
    - NOTE: should say running on PORT 5000
4. In frontend, npm run dev
    - Click localhost link
