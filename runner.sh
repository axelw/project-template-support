#! /opt/local/bin/bash

git clone https://github.com/axelw/project-template.git "$1"

if [ "$?" = 0 ]; then
	grunt --gruntfile=crpr.js __finishProjectTemplate
	if [ "$?" = 0 ]; then
		cd "$1"
		npm install

		if [ "$?" = 0 ]; then
			echo server.json >> .gitignore
			printf "\n\nFinished.\n"
		else
			printf "\n\nerror in npm install; exiting"
		fi		
	fi
fi
