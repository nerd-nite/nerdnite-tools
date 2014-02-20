#!/usr/bin/env bash

set -e

if [[ -z $1 ]] 
then
    echo "Please provide the location of the aliases file"
    exit 1
fi

echo Updating $1

./createAliasMap.js > $1
postmap $1
sudo postfix reload
