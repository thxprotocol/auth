#!/bin/bash
npm run migrate
pm2 reload auth --update-env