pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                    pwd
                    git clone "https://github.com/CARTAvis/carta-backend.git"
                    cd carta-backend
                    git submodule init
                    git submodule update
                    mkdir build
                    cd build
                    ls -sort
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
