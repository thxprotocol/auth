#!/bin/bash
npx migrate-mongo up
pm2 reload auth --update-env