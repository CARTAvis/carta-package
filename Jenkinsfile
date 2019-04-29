pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                    sh "pwd"
                    sh "git clone https://github.com/CARTAvis/carta-backend.git"
                    sh "cd carta-backend"
                    sh "git submodule init"
                    sh "git submodule update"
                    sh "mkdir build"
                    sh "cd build"
                    sh "ls -sort"
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
