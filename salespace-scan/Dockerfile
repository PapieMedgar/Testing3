# Simple Dockerfile for Vite/React development
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN rm -rf node_modules package-lock.json
RUN npm install
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
