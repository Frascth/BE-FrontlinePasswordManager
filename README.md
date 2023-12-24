# Frontline Back-End

## Step 1: Install NodeJS and NPM using nvm
Install node version manager (nvm) by typing the following at the command line.

```bash
sudo su -
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
Activate nvm by typing the following at the command line.

```bash
. ~/.nvm/nvm.sh
```

Use nvm to install the latest version of Node.js by typing the following at the command line.

```bash
nvm install 18.18.2
```

Test that node and npm are installed and running correctly by typing the following at the terminal:

```bash
nvm use 18.18.2
node -v
npm -v
```

## Step 2: Install Git and clone repository from GitHub
To install git, run below commands in the terminal window:

on debian linux:
```bash
sudo apt-get update -y
sudo apt-get install git -y
```

on aws linux:
```bash
sudo yum update -y
sudo yum install git -y
```

Just to verify if system has git installed or not, please run below command in terminal:
```bash
git --version
```

This command will print the git version in the terminal.

Run below command to clone the code repository from Github:

```bash
git clone https://github.com/Frascth/FrontlinePasswordManager.git
git clone https://Frascth:token@github.com/Frascth/FrontlinePasswordManager.git
```

Get inside the directory and Install Packages

```bash
cd FrontlinePasswordManager
npm install
```

Start the application
To start the application, run the below command in the terminal:

```bash
npm start
```

