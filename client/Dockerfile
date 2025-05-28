# Stage 1: Build the Vue.js application
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app/client

# Copy package.json and yarn.lock to install dependencies
COPY client/package.json client/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the client source code
COPY client/src ./src
COPY client/index.html ./index.html
COPY client/postcss.config.js ./postcss.config.js
COPY client/tailwind.config.js ./tailwind.config.js
COPY client/tsconfig.app.json ./tsconfig.app.json
COPY client/tsconfig.json ./tsconfig.json
COPY client/tsconfig.node.json ./tsconfig.node.json
COPY client/vite.config.ts ./vite.config.ts
COPY client/env.d.ts ./env.d.ts
COPY client/public ./public

# Build the Vue.js application
# The build output will be in the 'dist' directory
# Ensure VITE_API_URL is set during build if it's a build-time variable
# For runtime variables, you'd handle it differently (e.g., Nginx config or dynamic JS)
# For now, we'll assume it's a build-time variable that needs to be injected.
# We'll set a placeholder here, and you'll configure it in docker-compose.
# This assumes your vite.config.ts uses import.meta.env.VITE_API_URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN yarn build

# Stage 2: Serve the built static files
FROM node:22-alpine

# Install 'serve' globally to serve static files
RUN yarn global add serve

# Set the working directory inside the container
WORKDIR /app/client

# Copy the built application from the builder stage
COPY --from=builder /app/client/dist ./dist

# Expose the port 'serve' will run on
EXPOSE 5000

# Command to run 'serve' on the 'dist' directory
# The -s flag means "single page application mode" (fallback to index.html)
# The -l flag specifies the listen address and port
CMD ["serve", "-s", "dist", "-l", "5000"]
