#!/usr/bin/env node
try {
  require('./backend/dist/src/main.js');
} catch (e) {
  require('./dist/src/main.js');
}
