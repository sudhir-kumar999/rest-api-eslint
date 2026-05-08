# Project Title 

## Authentication Based Blog POST API

# Project Description

This Blog is about Authentication based on JWT token to verify the authenticity of user. only logged in user are allowed to post the blog post on this API . First user have to sign in from sign in API and sign are only allowed with unique email, duplicates emails are not for sign in again, after Sign in they have to make a login request, if the email used in login request are used for sign in and found in db then it allow then for login otherwise they have to sign in first. If user login then two token are send to their browser like access token and refresh token. Both token are used to identify the user if user want to make a post request on blog APi 

# Tech Stack used
1. Node js
2. Express js
3. Typescript

# Table of content
1. User have to sign in with unique email used never before for sign in
2. After sign in they have make a login request
3. when login success user can post blog post to DB
4. user can post blog data
5. user can get blog data
6. user can delete blog data
7. user can see their all blog data posted previously
8. A public API to see all the post of the blog

# How to install Project

## Clone the URL from github repositories or use this link

Use this link --> https://github.com/sudhir-kumar999/rest-api-eslint.git

## Go to My project
cd project-name

## install dependencies
npm install

## start the server
npm run dev


# Download ZIP file and extract it then open that folder into vs code or other code editor
-->then go to my project in terminal.   
-->cd folder-name.  
-->npm install.  
-->npm run dev.  