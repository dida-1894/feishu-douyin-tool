FROM node:18

# Create app directory
WORKDIR /usr/src/feishudouyin

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
RUN npm build
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY ./backend .

EXPOSE 4000

CMD [ "npm", "start" ]