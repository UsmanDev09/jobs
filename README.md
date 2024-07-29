# Quick Setup

## Clone
```bash
git clone https://github.com/UsmanDev09/jobs.git
```

## Usage

### Add .env to client:
```
CLIENT_URL=###
SERVER_URL=###
```

### Add .env to server:
```
UNSPLASH_ACCESS_KEY=###
PORT=###
UNSPLASH_SECRET_KEY=###
REDIS_URL=###
UNSPLASH_URL=###
CLIENT_URL=###
```


### Client setup:

```
cd client
npm install
npm run dev
```

### Server setup:

#### Setup redis for backgroun-jobs: 
```
 ## installation
 MacOS: brew install redis
 Linux: sudo apt-get install redis-server
 Windows: download msi installer from redis website

 ## start server
 redis-server

 ## test if it is working
 redis-cli ping
```

```
cd server
npm install 
npm start 
```

## Time Report

```
Frontend: 1 hour
Planning & Research: 1 hour
Implementing backgroun jobs with custom delays: 2 hours
Implementing real-time communication: 2 hours
Implementing retry mechanism upon failures: 3 hours
Handling edge-cases: 2 hours
```
