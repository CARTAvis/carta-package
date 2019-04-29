pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                    sh "pwd"
                    sh "git clone https://github.com/CARTAvis/carta-backend.git"
                    sh "cd carta-backend"
                    sh "git submodule init && git submodule update"
                    sh "mkdir build"
                    sh "cd build"
                    sh "cmake .."
                    sh "make"
                    sh "ls -sort"
            }
        }
        stage('ICD tests') {
            steps {
                echo 'Testing..'
                    sh "source ~/emsdk/emsdk_env.sh"
                    sh "wget http://alma.asiaa.sinica.edu.tw/_downloads/carta-backend-ICD-test-travis.tar.gz"
                    sh "tar -xvf carta-backend-ICD-test-travis.tar.gz"
                    sh "./run.sh & # run carta_backend in the background"
                    sh "cd carta-backend-ICD-test-travis"
                    sh "cd protobuf"
                    sh "git submodule init && git submodule update && git checkout master"
                    sh "npm install"
                    sh "./build_proto.sh"
                    sh "cd .."
                    sh "ls src/test/"
                    sh "./run-circle.sh"
echo "Finished !!"
            }
        }
        }
    }
}
