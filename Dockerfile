FROM apify/actor-node-playwright:22-1.54.1

# Copy package files
COPY --chown=myuser:myuser package*.json ./

# Install NPM packages, skip optional and development dependencies to keep the image small
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version \
    && rm -r ~/.npm

# Copy source code
COPY --chown=myuser:myuser . ./

# Run using npm start (matches Apify pattern)
CMD ["npm", "start", "--silent"]

